package dto

// AdminStatsRequest represents request for admin statistics
type AdminStatsRequest struct {
	StartDate string `json:"startDate" form:"startDate"`
	EndDate   string `json:"endDate" form:"endDate"`
}

// AdminStatsResponse represents admin dashboard statistics
type AdminStatsResponse struct {
	TotalUsers        int64 `json:"totalUsers"`
	ActiveUsers       int64 `json:"activeUsers"`
	TotalJobs         int64 `json:"totalJobs"`
	ActiveJobs        int64 `json:"activeJobs"`
	TotalApplications int64 `json:"totalApplications"`
	TotalBusinesses   int64 `json:"totalBusinesses"`
	ActiveBusinesses  int64 `json:"activeBusinesses"`
	TotalRevenue      int64 `json:"totalRevenue"`
}

// AuditLogRequest represents request for audit logs
type AuditLogRequest struct {
	ActionType string `json:"actionType" form:"actionType"`
	UserID     string `json:"userId" form:"userId"`
	StartDate  string `json:"startDate" form:"startDate"`
	EndDate    string `json:"endDate" form:"endDate"`
	Page       int    `json:"page" form:"page"`
	Limit      int    `json:"limit" form:"limit"`
}

// AuditLogsResponse represents paginated audit logs
type AuditLogsResponse struct {
	Logs  []AuditLogResponse `json:"logs"`
	Total int64              `json:"total"`
	Page  int                `json:"page"`
	Limit int                `json:"limit"`
}

// UserActivityRequest represents request for user activity
type UserActivityRequest struct {
	UserID    string `json:"userId" form:"userId"`
	StartDate string `json:"startDate" form:"startDate"`
	EndDate   string `json:"endDate" form:"endDate"`
	Page      int    `json:"page" form:"page"`
	Limit     int    `json:"limit" form:"limit"`
}

// UserActivityResponse represents user activity log
type UserActivityResponse struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	Action    string `json:"action"`
	Timestamp string `json:"timestamp"`
	Details   string `json:"details"`
}

// UserActivitiesResponse represents paginated user activities
type UserActivitiesResponse struct {
	Activities []UserActivityResponse `json:"activities"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	Limit      int                    `json:"limit"`
}

// SystemHealthResponse represents system health status
type SystemHealthResponse struct {
	Status      string            `json:"status"`
	Timestamp   string            `json:"timestamp"`
	Services    map[string]string `json:"services"`
	MemoryUsage string            `json:"memoryUsage"`
	CPUUsage    string            `json:"cpuUsage"`
	Database    string            `json:"database"`
	Redis       string            `json:"redis"`
}

// BusinessVerificationRequest represents request for business verification
type BusinessVerificationRequest struct {
	BusinessID string `json:"businessId" form:"businessId"`
	Action     string `json:"action" form:"action"` // approve, reject
	Reason     string `json:"reason" form:"reason"`
}

// WorkerVerificationRequest represents request for worker verification
type WorkerVerificationRequest struct {
	WorkerID string `json:"workerId" form:"workerId"`
	Action   string `json:"action" form:"action"` // approve, reject
	Reason   string `json:"reason" form:"reason"`
}
