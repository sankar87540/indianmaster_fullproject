package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggerMiddleware logs HTTP requests and responses
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Extract request info
		method := c.Request.Method
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery
		remoteAddr := c.ClientIP()

		// Log request
		log.Printf("[%s] %s %s | Query: %s | From: %s",
			method, path, c.Request.Proto, query, remoteAddr,
		)

		// Process request
		c.Next()

		// Calculate duration
		duration := time.Since(startTime)
		statusCode := c.Writer.Status()
		responseSize := c.Writer.Size()

		// Log response
		log.Printf("[%d] %s %s | Duration: %v | Size: %d bytes",
			statusCode, method, path, duration, responseSize,
		)

		// Log any errors that occurred
		if len(c.Errors) > 0 {
			for _, err := range c.Errors {
				log.Printf("[ERROR] %s", err.Error())
			}
		}
	}
}
