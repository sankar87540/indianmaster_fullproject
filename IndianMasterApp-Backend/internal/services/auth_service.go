package services

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strings"
	"time"

	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/repositories"
	"myapp/internal/utils"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// otpRecord is the value stored in Redis for a pending OTP verification.
type otpRecord struct {
	OTP   string `json:"otp"`
	Phone string `json:"phone"`
}

const otpTTL = 5 * time.Minute
const otpKeyPrefix = "otp:"

// OTP rate-limiting: max 3 requests per phone per 60-second window.
const otpRateLimit  = 3
const otpRateWindow = 60 * time.Second
const otpRateKey    = "otp_rate:"

// AuthService handles authentication business logic
type AuthService struct {
	userRepo repositories.UserRepository
	cache    *utils.CacheService
}

// NewAuthService creates a new auth service
func NewAuthService(userRepo repositories.UserRepository, cache *utils.CacheService) *AuthService {
	return &AuthService{userRepo: userRepo, cache: cache}
}

// CustomClaims defines the structure of JWT claims
type CustomClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// SendOTP generates a 6-digit OTP, stores it in Redis, and (in production) sends it via SMS.
func (s *AuthService) SendOTP(ctx context.Context, phone string) (*dto.SendOTPResponse, error) {
	// Rate limit: max otpRateLimit requests per phone per otpRateWindow.
	// Increment returns 0 (no-op) when Redis is unavailable, so dev without Redis is unthrottled.
	count, err := s.cache.Increment(ctx, otpRateKey+phone, otpRateWindow)
	if err != nil {
		return nil, fmt.Errorf("rate limit check failed: %w", err)
	}
	if count > otpRateLimit {
		return nil, fmt.Errorf("TooManyOTPRequests")
	}

	otp := fmt.Sprintf("%06d", rand.Intn(1000000))
	requestID := fmt.Sprintf("req_%d", time.Now().UnixNano())

	// Store {otp, phone} in Redis with 5-minute TTL.
	// CacheService is a no-op when Redis client is nil, so this is safe in dev.
	record := otpRecord{OTP: otp, Phone: phone}
	if err := s.cache.SetWithTTL(ctx, otpKeyPrefix+requestID, record, otpTTL); err != nil {
		return nil, fmt.Errorf("failed to store OTP: %w", err)
	}

	// TODO: integrate SMS provider here (Twilio / Gupshup / AWS SNS).
	// In non-production environments, log the OTP so the dev flow still works.
	if os.Getenv("APP_ENV") != "production" {
		log.Printf("[OTP] phone=%s otp=%s requestId=%s", phone, otp, requestID)
	}

	return &dto.SendOTPResponse{
		RequestID: requestID,
		ExpiresIn: int(otpTTL.Seconds()),
	}, nil
}

// VerifyOTP verifies the OTP against the Redis-stored record and returns an authentication response.
func (s *AuthService) VerifyOTP(ctx context.Context, req *dto.VerifyOTPRequest) (*dto.AuthResponse, error) {
	// 1. Look up the OTP record stored by SendOTP.
	var record otpRecord
	found, err := s.cache.Get(ctx, otpKeyPrefix+req.RequestID, &record)
	if err != nil {
		return nil, fmt.Errorf("OTP lookup failed: %w", err)
	}

	if found {
		// Redis record exists — validate phone and OTP.
		if record.Phone != req.Phone || record.OTP != req.OTP {
			return nil, fmt.Errorf("invalid OTP")
		}
		// One-time use: delete after successful verification.
		_ = s.cache.Delete(ctx, otpKeyPrefix+req.RequestID)
	} else {
		// Redis record not found (expired, never stored, or Redis unavailable).
		// In non-production environments fall back to the hardcoded dev OTP.
		if os.Getenv("APP_ENV") == "production" {
			return nil, fmt.Errorf("OTP expired or invalid")
		}
		if req.OTP != "123456" {
			return nil, fmt.Errorf("invalid OTP")
		}
	}

	// 2. Normalize role and language
	role := strings.ToUpper(req.Role)
	language := req.Language
	if language == "" {
		language = "en"
	}

	// 3. Find user by phone
	user, err := s.userRepo.GetByPhone(ctx, req.Phone)
	if err != nil {
		// If user not found, create a new user (Signup flow)
		if strings.Contains(err.Error(), "not found") || strings.Contains(err.Error(), "no rows") {
			user = &models.User{
				Phone:    req.Phone,
				Role:     role,
				Language: language,
				IsActive: true,
				FullName: "User " + req.Phone[len(req.Phone)-4:], // Placeholder name
			}

			if err := s.userRepo.Create(ctx, user); err != nil {
				return nil, fmt.Errorf("failed to create user: %w", err)
			}
		} else {
			return nil, fmt.Errorf("failed to fetch user: %w", err)
		}
	} else {
		// If user exists, optionally update their role and language if provided
		// Local requirements say the flow is: Select Language -> Select Role -> Mobile -> OTP
		// So we might update these on every successful login if they changed
		user.Role = role
		user.Language = language
		_ = s.userRepo.Update(ctx, user)
	}

	// 4. Generate JWT token
	token, err := s.generateJWT(user.ID, user.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// 5. Build and return response
	return &dto.AuthResponse{
		AccessToken: token,
		ExpiresIn:   86400, // 24 hours
		User: dto.UserResponse{
			ID:        user.ID,
			Phone:     user.Phone,
			Email:     user.Email,
			FullName:  user.FullName,
			Role:      user.Role,
			Language:  user.Language,
			IsActive:  user.IsActive,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

// Login authenticates user with email and password (LEGACY - DEPRECATED)
func (s *AuthService) Login(ctx context.Context, email, password string) (*dto.LoginResponse, error) {
	// ... (implementation remains same but shouldn't be used according to new requirements)
	return nil, fmt.Errorf("email/password login is deprecated")
}

// Register creates a new user account (LEGACY - DEPRECATED)
func (s *AuthService) Register(ctx context.Context, req *dto.RegistrationRequest) (*dto.RegistrationResponse, error) {
	return nil, fmt.Errorf("standard registration is deprecated, use OTP flow")
}

// generateJWT creates a JWT token with 24-hour expiry
func (s *AuthService) generateJWT(userID, role string) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", fmt.Errorf("JWT_SECRET environment variable not set")
	}

	// Create claims with 24-hour expiry
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour)

	claims := CustomClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	// Create token with HS256 signing method
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// HashPassword generates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}
