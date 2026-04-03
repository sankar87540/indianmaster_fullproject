package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	authService *services.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// SendOTP godoc
// @Summary Send OTP to Mobile Number
// @Description Initiate the login/signup flow by sending a 6-digit OTP to the provided mobile number.
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body dto.SendOTPRequest true "Mobile number"
// @Success 200 {object} dto.APIResponse "OTP sent successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 500 {object} dto.APIResponse "Internal server error"
// @Router /auth/send-otp [post]
func (h *AuthHandler) SendOTP(c *gin.Context) {
	var req dto.SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.SendOTP(c.Request.Context(), req.Phone)
	if err != nil {
		if err.Error() == "TooManyOTPRequests" {
			dto.TooManyRequestsResponse(c, "Too many OTP requests. Please wait before trying again.")
			return
		}
		internalError(c, "Failed to send OTP", err)
		return
	}

	dto.OKResponse(c, "OTP sent successfully", resp)
}

// VerifyOTP godoc
// @Summary Verify OTP and Login/Signup
// @Description Verify the 6-digit OTP. If the user doesn't exist, a new account will be created with the provided role and language.
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body dto.VerifyOTPRequest true "OTP verification details"
// @Success 200 {object} dto.APIResponse "Authentication successful"
// @Failure 400 {object} dto.APIResponse "Invalid request body or OTP"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Internal server error"
// @Router /auth/verify-otp [post]
func (h *AuthHandler) VerifyOTP(c *gin.Context) {
	var req dto.VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.VerifyOTP(c.Request.Context(), &req)
	if err != nil {
		switch err.Error() {
		case "invalid OTP":
			dto.BadRequestResponse(c, "The OTP entered is incorrect", nil)
		case "OTP expired or invalid":
			dto.UnauthorizedResponse(c, "OTP has expired or is invalid. Please request a new one.")
		default:
			internalError(c, "Authentication failed", err)
		}
		return
	}

	dto.OKResponse(c, "Login successful", resp)
}

// Login godoc (DEPRECATED)
func (h *AuthHandler) Login(c *gin.Context) {
	dto.BadRequestResponse(c, "Email/Password login is no longer supported. Please use OTP login.", nil)
}

// Register godoc (DEPRECATED)
func (h *AuthHandler) Register(c *gin.Context) {
	dto.BadRequestResponse(c, "Standard registration is no longer supported. Please use OTP flow.", nil)
}
