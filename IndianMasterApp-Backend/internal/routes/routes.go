package routes

import (
	"database/sql"

	"myapp/internal/handlers"
	"myapp/internal/middleware"
	"myapp/internal/repositories"
	"myapp/internal/services"
	"myapp/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// SetupRoutes configures all API routes for Gin
func SetupRoutes(router *gin.Engine, db *sql.DB, redisClient *redis.Client) {
	// Apply middleware
	router.Use(middleware.LoggerMiddleware())
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.CorrelationIDMiddleware())

	// =========================================================================
	// INITIALIZE REPOSITORIES
	// =========================================================================
	repos := repositories.NewPostgresRepository(db)

	// Use real Postgres notification repository (replaces stub)
	notifRepo := repositories.NewNotificationPostgresRepository(db)

	// Instant job application repository
	instantApplyRepo := repositories.NewInstantJobApplicationRepository(db)

	// =========================================================================
	// INITIALIZE CACHE SERVICE
	// =========================================================================
	cache := utils.NewCacheService(redisClient) // safe when redisClient is nil

	// =========================================================================
	// INITIALIZE SERVICES (V2 — with caching + notifications)
	// =========================================================================

	// Notification service (shared across all services that trigger notifications)
	notificationSvc := services.NewNotificationServiceV2(notifRepo)

	// Worker service V2 (cache-aware)
	workerServiceV2 := services.NewWorkerServiceV2(
		repos.Workers(),
		repos.Users(),
		repos.Verification(),
		notifRepo,
		cache,
	)

	// Job service V2 (cache-aware + notification triggers)
	jobServiceV2 := services.NewJobServiceV2(
		repos.Jobs(),
		repos.Businesses(),
		repos.Workers(),
		repos.Audit(),
		notificationSvc,
		cache,
	)

	// Application service V2 (notification triggers + cache invalidation)
	applicationServiceV2 := services.NewApplicationServiceV2(
		repos.Applications(),
		repos.Jobs(),
		repos.Businesses(),
		repos.Workers(),
		repos.Users(),
		repos.Verification(),
		notificationSvc,
		repos.Audit(),
		cache,
	)

	// Search service V2 (Redis-cached)
	searchServiceV2 := services.NewSearchServiceV2(
		jobServiceV2,
		cache,
	)

	// Admin service V2 (notification triggers on verification events)
	adminServiceV2 := services.NewAdminServiceV2(
		repos.Verification(),
		repos.Audit(),
		notificationSvc,
		cache,
	)

	// Legacy services (unchanged — keep existing endpoints working)
	chatService := services.NewChatService(repos.Chat())
	subscriptionService := services.NewSubscriptionService(repos.Subscriptions())
	userService := services.NewUserService(repos.Users())
	adminDashboardService := services.NewAdminDashboardService(
		repos.Users(),
		repos.Businesses(),
		repos.Jobs(),
		repos.Applications(),
		repos.Subscriptions(),
		repos.Audit(),
	)

	// =========================================================================
	// INITIALIZE HANDLERS
	// =========================================================================

	authHandler := handlers.NewAuthHandler(services.NewAuthService(repos.Users(), cache))

	// Worker handler — uses WorkerServiceV2 for cache-aware profile ops
	workerHandler := handlers.NewWorkerHandlerV2(workerServiceV2)

	// Job handler — uses JobServiceV2 for cached feed + notification triggers
	jobHandler := handlers.NewJobHandlerV2(jobServiceV2)

	// Application handler — uses ApplicationServiceV2 for notification triggers
	applicationHandler := handlers.NewApplicationHandlerV2(applicationServiceV2)

	// Chat handler (unchanged)
	chatHandler := handlers.NewChatHandler(chatService)

	// Subscription handler (unchanged)
	subscriptionHandler := handlers.NewSubscriptionHandler(subscriptionService)

	// Notification handler V2 — full implementation
	notificationHandler := handlers.NewNotificationHandlerV2(notificationSvc)

	// Admin handler V2 — with notification triggers
	adminHandler := handlers.NewAdminHandlerV2(adminServiceV2)

	// Admin dashboard handler (unchanged)
	adminDashboardHandler := handlers.NewAdminDashboardHandler(adminDashboardService)

	// User handler V2 — uses WorkerServiceV2 for cached recommendations
	userHandlerV2 := handlers.NewUserHandlerV2(userService, workerServiceV2)

	// User handler (legacy — for user CRUD endpoints)
	userHandler := handlers.NewUserHandler(userService, workerServiceV2)

	// Search handler V2 — Redis-cached search
	searchHandlerV2 := handlers.NewSearchHandlerV2(searchServiceV2)

	// Instant apply handler
	instantApplyHandler := handlers.NewInstantApplyHandler(services.NewInstantApplyService(instantApplyRepo))

	// =========================================================================
	// RATE LIMITER
	// =========================================================================
	var rateLimiter *middleware.RateLimiter
	if redisClient != nil {
		rateLimiter = middleware.NewRateLimiter(redisClient)
		router.Use(rateLimiter.RateLimitGeneral())
	}

	// =========================================================================
	// HEALTH CHECK
	// =========================================================================
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"message": "Indian Master API is running",
		})
	})

	// =========================================================================
	// API v1 ROUTES
	// =========================================================================
	v1 := router.Group("/api/v1")
	{
		// ===================== AUTH ROUTES =====================
		if rateLimiter != nil {
			v1.POST("/auth/login", rateLimiter.RateLimitLogin(), authHandler.Login)
		} else {
			v1.POST("/auth/login", authHandler.Login)
		}
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/send-otp", authHandler.SendOTP)
		v1.POST("/auth/verify-otp", authHandler.VerifyOTP)

		// ===================== USER PROFILE ROUTE =====================
		// Authenticated, role-agnostic — any logged-in user can update their own name/email
		userProfile := v1.Group("/user")
		userProfile.Use(middleware.AuthMiddleware())
		{
			userProfile.PUT("/profile", userHandlerV2.UpdateMyProfile)
		}

		// ===================== WORKER ROUTES =====================
		workers := v1.Group("/worker")
		workers.Use(middleware.AuthMiddleware())
		workers.Use(middleware.WorkerOnly())
		{
			workers.POST("/profile", workerHandler.CreateProfile)
			workers.GET("/profile", workerHandler.GetProfile)
			workers.PUT("/profile", workerHandler.UpdateProfile)
			workers.GET("/profile/verification", workerHandler.GetVerificationStatus)
			// Cached recommended jobs endpoint
			workers.GET("/:worker_id/recommended-jobs", userHandlerV2.GetRecommendedJobs)
			// Instant job application form submission
			workers.POST("/instant-apply", instantApplyHandler.Submit)
		}

		// ===================== JOB ROUTES =====================
		jobs := v1.Group("/jobs")
		jobs.Use(middleware.AuthMiddleware())
		{
			// Cached jobs feed
			jobs.GET("/feed", jobHandler.GetJobsFeed)
			jobs.GET("/:job_id", jobHandler.GetJobByID)
		}

		hirersJobs := v1.Group("/hirer/jobs")
		hirersJobs.Use(middleware.AuthMiddleware())
		hirersJobs.Use(middleware.RoleValidator("HIRER"))
		{
			// Creates job + invalidates cache + notifies matching workers
			hirersJobs.POST("", jobHandler.CreateJob)
			// Updates job + invalidates cache
			hirersJobs.PUT("/:job_id", jobHandler.UpdateJob)
		}

		// ===================== APPLICATION ROUTES =====================
		applications := v1.Group("/applications")
		applications.Use(middleware.AuthMiddleware())
		applications.Use(middleware.WorkerOnly())
		{
			// Apply to job + notify hirer + invalidate cache
			applications.POST("", applicationHandler.ApplyToJob)
			applications.GET("/my-applications", applicationHandler.GetApplicationsByWorker)
		}

		adminApplications := v1.Group("/admin/applications")
		adminApplications.Use(middleware.AuthMiddleware())
		adminApplications.Use(middleware.AdminOnly())
		{
			// Update status + notify worker
			adminApplications.PUT("/:application_id/status", applicationHandler.UpdateApplicationStatus)
		}

		// ===================== CHAT ROUTES =====================
		chat := v1.Group("/chat")
		chat.Use(middleware.AuthMiddleware())
		{
			chat.GET("/threads", chatHandler.GetMyThreads)
			chat.POST("/threads", chatHandler.GetOrCreateThread)
			chat.GET("/threads/:thread_id/messages", chatHandler.GetMessages)
			chat.POST("/threads/:thread_id/messages", chatHandler.SendMessage)
			chat.PATCH("/threads/:thread_id/read", chatHandler.MarkThreadRead)
		}

		// ===================== SUBSCRIPTION ROUTES =====================
		subscriptions := v1.Group("/subscriptions")
		subscriptions.Use(middleware.AuthMiddleware())
		{
			subscriptions.POST("", subscriptionHandler.CreateSubscription)
			subscriptions.GET("/active", subscriptionHandler.GetActiveSubscription)
			subscriptions.GET("/contact-limit", subscriptionHandler.CheckContactLimit)
		}

		// ===================== NOTIFICATION ROUTES =====================
		notifications := v1.Group("/notifications")
		notifications.Use(middleware.AuthMiddleware())
		{
			// GET /notifications          — all notifications (paginated)
			notifications.GET("", notificationHandler.GetNotifications)
			// GET /notifications/unread   — unread only (paginated)
			notifications.GET("/unread", notificationHandler.GetUnreadNotifications)
			// GET /notifications/unread/count — unread count
			notifications.GET("/unread/count", notificationHandler.GetUnreadCount)
			// PATCH /notifications/{id}/read — mark as read
			notifications.PATCH("/:id/read", notificationHandler.MarkNotificationRead)
		}

		// ===================== ADMIN VERIFICATION ROUTES =====================
		adminVerification := v1.Group("/admin/verification")
		adminVerification.Use(middleware.AuthMiddleware())
		adminVerification.Use(middleware.AdminOnly())
		{
			// Approve/reject + notify entity owner
			adminVerification.POST("/approve", adminHandler.ApproveVerification)
			adminVerification.POST("/reject", adminHandler.RejectVerification)
		}

		// ===================== ADMIN DASHBOARD ROUTES =====================
		adminDashboard := v1.Group("/admin")
		adminDashboard.Use(middleware.AuthMiddleware())
		adminDashboard.Use(middleware.AdminOnly())
		{
			adminDashboard.POST("/stats", adminDashboardHandler.GetAdminStats)
			adminDashboard.GET("/audit-logs", adminDashboardHandler.GetAuditLogs)
			adminDashboard.GET("/user-activities", adminDashboardHandler.GetUserActivities)
			adminDashboard.GET("/system-health", adminDashboardHandler.GetSystemHealth)
			adminDashboard.POST("/business-verification/approve", adminDashboardHandler.ApproveBusinessVerification)
			adminDashboard.POST("/business-verification/reject", adminDashboardHandler.RejectBusinessVerification)
			adminDashboard.POST("/worker-verification/approve", adminDashboardHandler.ApproveWorkerVerification)
			adminDashboard.POST("/worker-verification/reject", adminDashboardHandler.RejectWorkerVerification)
		}

		// ===================== SEARCH ROUTES (CACHED) =====================
		search := v1.Group("/search")
		search.Use(middleware.AuthMiddleware())
		{
			// POST /search/workers — cached worker search
			search.POST("/workers", searchHandlerV2.SearchWorkers)
			// POST /search/jobs   — cached job search
			search.POST("/jobs", searchHandlerV2.SearchJobs)
		}

		// ===================== USER ROUTES (LEGACY) =====================
		usersGroup := v1.Group("/users")
		usersGroup.Use(middleware.AuthMiddleware())
		{
			usersGroup.GET("", userHandler.ListUsersByRole)
			usersGroup.GET("/active", userHandler.ListActiveUsers)
			usersGroup.POST("", userHandler.CreateUser)
			usersGroup.GET("/:id", userHandler.GetUser)
			usersGroup.PUT("/:id", userHandler.UpdateUser)
			usersGroup.DELETE("/:id", userHandler.DeleteUser)
		}
	}
}
