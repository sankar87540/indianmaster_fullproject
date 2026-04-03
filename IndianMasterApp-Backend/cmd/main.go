package main

import (
	"context"
	"database/sql"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"myapp/config"
	_ "myapp/docs"
	database "myapp/internal/database"
	"myapp/internal/logger"
	"myapp/internal/middleware"
	"myapp/internal/routes"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"go.uber.org/zap"
)

// @title Indian Master API
// @version 1.0
// @description Backend APIs for Indian Master Application - A comprehensive platform for job seekers and hirers in India
// @termsOfService http://swagger.io/terms/
// @contact.name API Support
// @contact.email support@indianmaster.com
// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html
// @basePath /api/v1
// @schemes http https

func main() {
	// Load configuration from environment variables
	cfg, err := config.LoadConfig()
	if err != nil {
		panic("Failed to load configuration: " + err.Error())
	}

	// Initialize logger based on environment
	if err := logger.Init(cfg.Environment); err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Configuration loaded successfully", zap.String("environment", cfg.AppEnv))

	// Initialize database connection
	dbURL := cfg.GetDatabaseURL()
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}

	// Test database connection
	if err := db.Ping(); err != nil {
		logger.Fatal("Failed to ping database", zap.Error(err))
	}

	// Run database migrations before accepting traffic
	logger.Info("Running migrations...")
	if err := database.RunMigrations(db, "migrations"); err != nil {
		logger.Fatal("Failed to run migrations", zap.Error(err))
	}
	logger.Info("Migrations applied successfully")

	// Configure connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	defer func() {
		if err := db.Close(); err != nil {
			logger.Warn("Error closing database", zap.Error(err))
		}
	}()

	// Initialize Redis connection for rate limiting
	redisAddr := cfg.RedisHost + ":" + cfg.RedisPort
	redisDB := 0
	if redisDBInt, err := strconv.Atoi(cfg.RedisDB); err == nil {
		redisDB = redisDBInt
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: cfg.RedisPassword,
		DB:       redisDB,
	})

	// Test Redis connection
	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		logger.Warn("Redis connection warning", zap.Error(err), zap.String("message", "rate limiting will be disabled"))
		redisClient = nil // Set to nil so routes can handle it
	} else {
		logger.Info("Redis connected successfully")
	}

	defer func() {
		if redisClient != nil {
			if err := redisClient.Close(); err != nil {
				logger.Warn("Error closing Redis", zap.Error(err))
			}
		}
	}()

	// Set Gin mode from configuration
	gin.SetMode(cfg.GinMode)

	// Create Gin router
	router := gin.New()

	// Add middleware - order matters!
	router.Use(gin.Recovery())                         // Recover from panics
	router.Use(corsMiddleware(cfg))                    // CORS headers
	router.Use(middleware.SecurityHeadersMiddleware()) // Defensive security headers
	router.Use(middleware.CorrelationIDMiddleware())   // Add correlation ID
	router.Use(middleware.LoggingMiddleware())         // Structured logging

	// Setup all routes
	routes.SetupRoutes(router, db, redisClient)

	// Setup Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	logger.Info("Database connected successfully")
	logger.Info("Server starting", zap.String("address", "http://localhost:"+cfg.AppPort))

	// Create HTTP server
	server := &http.Server{
		Addr:         ":" + cfg.AppPort,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Warn("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited cleanly")
}

// corsMiddleware adds CORS headers to all responses.
// Allowed origins are read from CORS_ALLOWED_ORIGINS (comma-separated).
// If the env var is empty, all origins are allowed in non-production environments only.
func corsMiddleware(cfg *config.Config) gin.HandlerFunc {
	var allowedOrigins []string
	for _, o := range strings.Split(cfg.AllowedOrigins, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			allowedOrigins = append(allowedOrigins, o)
		}
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		if origin != "" {
			if len(allowedOrigins) == 0 {
				// No allowlist configured: permit all in development, block in production.
				if cfg.AppEnv != "production" {
					c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
				}
			} else {
				for _, allowed := range allowedOrigins {
					if origin == allowed {
						c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
						c.Writer.Header().Set("Vary", "Origin")
						break
					}
				}
			}
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
