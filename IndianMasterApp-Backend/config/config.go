package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config holds all environment configuration for the application
type Config struct {
	AppEnv         string
	AppPort        string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	JWTSecret      string
	RedisURL       string
	RedisHost      string
	RedisPort      string
	RedisDB        string
	RedisPassword  string
	GinMode        string
	Environment    string
	AllowedOrigins string // Comma-separated list of allowed CORS origins
}

// LoadConfig loads environment variables from .env file and environment,
// then returns a populated Config struct
func LoadConfig() (*Config, error) {
	// Load .env file (optional - may not exist in production)
	_ = godotenv.Load()

	cfg := &Config{
		AppEnv:         getEnv("APP_ENV", "development"),
		AppPort:        getEnv("APP_PORT", "8080"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "indian_master"),
		JWTSecret:      getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		RedisURL:       getEnv("REDIS_URL", ""),
		RedisHost:      getEnv("REDIS_HOST", "localhost"),
		RedisPort:      getEnv("REDIS_PORT", "6379"),
		RedisDB:        getEnv("REDIS_DB", "0"),
		RedisPassword:  getEnv("REDIS_PASSWORD", ""),
		GinMode:        getEnv("GIN_MODE", "release"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		AllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", ""),
	}

	// Validate required configuration
	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// Validate checks if all required configuration values are set
func (c *Config) Validate() error {
	// Check required fields
	if c.JWTSecret == "" || c.JWTSecret == "your-secret-key-change-in-production" {
		return fmt.Errorf("JWT_SECRET must be set and changed from default value")
	}
	if len(c.JWTSecret) < 32 {
		return fmt.Errorf("JWT_SECRET must be at least 32 characters long")
	}

	if c.DBPassword == "" || c.DBPassword == "postgres" {
		if c.AppEnv == "production" {
			return fmt.Errorf("DB_PASSWORD must be set in production environment")
		}
	}

	return nil
}

// GetDatabaseURL returns the formatted PostgreSQL database URL
func (c *Config) GetDatabaseURL() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.DBUser,
		c.DBPassword,
		c.DBHost,
		c.DBPort,
		c.DBName,
	)
}

// getEnv retrieves an environment variable with a default fallback
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
