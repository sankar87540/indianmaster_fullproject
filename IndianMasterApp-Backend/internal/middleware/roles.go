package middleware

import (
	"myapp/internal/dto"

	"github.com/gin-gonic/gin"
)

// ============================================================================
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ============================================================================

// AdminOnly middleware restricts access to admin users only
// Returns 403 Forbidden if user role is not ADMIN
//
// Usage:
//
//	router.DELETE("/admin/users/:id", middleware.AuthMiddleware(), middleware.AdminOnly(), handler.DeleteUser)
func AdminOnly() gin.HandlerFunc {
	return RoleValidator("ADMIN")
}

// WorkerOnly middleware restricts access to worker users only
// Returns 403 Forbidden if user role is not WORKER
//
// Usage:
//
//	router.GET("/jobs/apply", middleware.AuthMiddleware(), middleware.WorkerOnly(), handler.ApplyJob)
func WorkerOnly() gin.HandlerFunc {
	return RoleValidator("WORKER")
}

// BusinessOnly middleware restricts access to business users only
// Returns 403 Forbidden if user role is not BUSINESS
//
// Usage:
//
//	router.POST("/jobs/create", middleware.AuthMiddleware(), middleware.BusinessOnly(), handler.CreateJob)
func BusinessOnly() gin.HandlerFunc {
	return RoleValidator("BUSINESS")
}

// RequireRole middleware restricts access to users with any of the specified roles
// Returns 403 Forbidden if user role is not in the allowed list
//
// Usage:
//
//	router.GET("/api/data", middleware.AuthMiddleware(), middleware.RequireRole("ADMIN", "HIRER"), handler.GetData)
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get(RoleContextKey)
		if !exists {
			dto.UnauthorizedResponse(c, "user role not found in context")
			c.Abort()
			return
		}

		userRole, ok := role.(string)
		if !ok {
			dto.UnauthorizedResponse(c, "invalid user role in context")
			c.Abort()
			return
		}

		// Check if user role is in allowed roles
		isAllowed := false
		for _, allowedRole := range allowedRoles {
			if userRole == allowedRole {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			dto.ForbiddenResponse(c, "You do not have permission to access this resource")
			c.Abort()
			return
		}

		c.Next()
	}
}
