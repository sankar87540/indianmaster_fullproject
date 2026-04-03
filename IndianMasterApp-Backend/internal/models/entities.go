package models

import (
	"time"

	"github.com/lib/pq"
)

// ================ USER ENTITY ================

// User represents a system user (Hirer, Worker, Admin)
type User struct {
	ID           string     `json:"id" db:"id"`
	Phone        string     `json:"phoneNumber" db:"phone"`
	FullName     string     `json:"fullName" db:"full_name"`
	Email        string     `json:"email" db:"email"`
	PasswordHash string     `json:"-" db:"password_hash"`   // Never exposed in JSON
	Role         string     `json:"role" db:"role"`         // HIRER, WORKER, ADMIN
	Language     string     `json:"language" db:"language"` // en, hi, ta
	IsActive     bool       `json:"isActive" db:"is_active"`
	LastSeen     *time.Time `json:"lastSeen" db:"last_seen"` // Presence: updated on activity
	PushToken    *string    `json:"-" db:"push_token"`       // Expo push token — never exposed in JSON
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time  `json:"updatedAt" db:"updated_at"`
}

// ================ BUSINESS ENTITY (Replaces Employers + Employer Locations) ================

// Business represents a restaurant/venue/business
type Business struct {
	ID           string    `json:"id" db:"id"`
	OwnerID      string    `json:"ownerId" db:"owner_id"`
	BusinessName string    `json:"businessName" db:"business_name"`
	OwnerName    string    `json:"ownerName" db:"owner_name"`
	ContactRole  string    `json:"contactRole" db:"contact_role"`
	BusinessType string    `json:"businessType" db:"business_type"`
	Email        string    `json:"email" db:"email"`
	MobileNumber string    `json:"mobileNumber" db:"mobile_number"`
	FSAILicense  string    `json:"fssaiLicense" db:"fssai_license"`
	GSTNumber    string    `json:"gstNumber" db:"gst_number"`
	LogoURL      string    `json:"logoUrl" db:"logo_url"`
	City         string    `json:"city" db:"city"`
	State        string    `json:"state" db:"state"`
	AddressText  string    `json:"addressText" db:"address_text"`
	Latitude     float64   `json:"latitude" db:"latitude"`
	Longitude    float64   `json:"longitude" db:"longitude"`
	EmployeeCount int       `json:"employeeCount" db:"employee_count"`
	IsActive     bool      `json:"isActive" db:"is_active"`
	Language     string    `json:"language" db:"language"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}

// ================ WORKER ENTITY (Replaces Job Seekers) ================

// Worker represents a worker/job seeker profile
type Worker struct {
	ID                   string         `json:"id" db:"id"`
	UserID               string         `json:"userId" db:"user_id"`
	FullName             string         `json:"fullName" db:"full_name"`
	Phone                string         `json:"phoneNumber" db:"phone"`
	Email                string         `json:"email" db:"email"`
	ProfilePhotoURL      string         `json:"profilePhotoUrl" db:"profile_photo_url"`
	ExperienceYears      int            `json:"experienceYears" db:"experience_years"`
	SelectedRoles        pq.StringArray `json:"selectedRoles" db:"selected_roles"`
	BusinessTypes        pq.StringArray `json:"businessTypes" db:"business_types"`
	JobCategories        pq.StringArray `json:"jobCategories" db:"job_categories"`
	JobRoles             pq.StringArray `json:"jobRoles" db:"job_roles"`
	LanguagesKnown       pq.StringArray `json:"languagesKnown" db:"languages_known"`
	VenuePreferences     pq.StringArray `json:"venuePreferences" db:"venue_preferences"`
	WorkTypes            pq.StringArray `json:"workTypes" db:"work_types"`
	Availability         pq.StringArray `json:"availability" db:"availability"`
	AvailabilityStatus   string         `json:"availabilityStatus" db:"availability_status"`
	ExpectedSalaryMin    int            `json:"expectedSalaryMin" db:"expected_salary_min"`
	ExpectedSalaryMax    int            `json:"expectedSalaryMax" db:"expected_salary_max"`
	LiveLatitude         *float64       `json:"liveLatitude" db:"live_latitude"`
	LiveLongitude        *float64       `json:"liveLongitude" db:"live_longitude"`
	LastActive           *time.Time     `json:"lastActive" db:"last_active"`
	CompletionPercentage int            `json:"completionPercentage" db:"completion_percentage"`
	Rating               float64        `json:"rating" db:"rating"`
	TotalReviews         int            `json:"totalReviews" db:"total_reviews"`
	Age                  int            `json:"age" db:"age"`
	Gender               string         `json:"gender" db:"gender"`
	Address              string         `json:"address" db:"address"`
	City                 string         `json:"city" db:"city"`
	State                string         `json:"state" db:"state"`
	IsEducated           bool           `json:"isEducated" db:"is_educated"`
	EducationLevel       string         `json:"educationLevel" db:"education_level"`
	Degree               string         `json:"degree" db:"degree"`
	College              string         `json:"college" db:"college"`
	AadhaarNumber        string         `json:"aadhaarNumber" db:"aadhaar_number"`
	Language             string         `json:"language" db:"language"`
	IsActive             bool           `json:"isActive" db:"is_active"`
	CreatedAt            time.Time      `json:"createdAt" db:"created_at"`
	UpdatedAt            time.Time      `json:"updatedAt" db:"updated_at"`
}

// ================ JOB ENTITY ================

// Job represents a job posting
type Job struct {
	ID                 string         `json:"id" db:"id"`
	BusinessID         string         `json:"businessId" db:"business_id"`
	JobRole            string         `json:"jobRole" db:"job_role"`
	Position           string         `json:"position" db:"position"`
	Categories         pq.StringArray `json:"categories" db:"categories"`
	Roles              pq.StringArray `json:"roles" db:"roles"`
	PreferredLanguages pq.StringArray `json:"preferredLanguages" db:"preferred_languages"`
	SalaryMinAmount    float64        `json:"salaryMinAmount" db:"salary_min_amount"`
	SalaryMaxAmount    float64        `json:"salaryMaxAmount" db:"salary_max_amount"`
	ExperienceMin      int            `json:"experienceMin" db:"experience_min"`
	ExperienceMax      *int           `json:"experienceMax" db:"experience_max"`
	Vacancies          int            `json:"vacancies" db:"vacancies"`
	GenderPreference   string         `json:"genderPreference" db:"gender_preference"`
	MaleVacancies      int            `json:"maleVacancies" db:"male_vacancies"`
	FemaleVacancies    int            `json:"femaleVacancies" db:"female_vacancies"`
	OthersVacancies    int            `json:"othersVacancies" db:"others_vacancies"`
	WorkingHours       *int           `json:"workingHours" db:"working_hours"`
	WeeklyLeaves       int            `json:"weeklyLeaves" db:"weekly_leaves"`
	Benefits           pq.StringArray `json:"benefits" db:"benefits"`
	WorkType           string         `json:"workType" db:"work_type"`
	AddressText        string         `json:"addressText" db:"address_text"`
	Locality           string         `json:"locality" db:"locality"`
	City               string         `json:"city" db:"city"`
	State              string         `json:"state" db:"state"`
	Latitude           *float64       `json:"latitude" db:"latitude"`
	Longitude          *float64       `json:"longitude" db:"longitude"`
	Description        string         `json:"description" db:"description"`
	Availability       pq.StringArray `json:"availability" db:"availability"`
	Status             string         `json:"status" db:"status"` // OPEN, CLOSED, FILLED
	Language           string         `json:"language" db:"language"`
	IsActive           bool           `json:"isActive" db:"is_active"`
	CreatedAt          time.Time      `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time      `json:"updatedAt" db:"updated_at"`
	// Transient fields — populated by ListOpenJobs via LEFT JOIN businesses, zero otherwise.
	BusinessName string `json:"businessName,omitempty" db:"-"`
	LogoURL      string `json:"logoUrl,omitempty" db:"-"`
}

// ================ APPLICATION ENTITY ================

// Application represents a worker's job application
type Application struct {
	ID        string    `json:"id" db:"id"`
	JobID     string    `json:"jobId" db:"job_id"`
	WorkerID  string    `json:"workerId" db:"worker_id"`
	Status    string    `json:"status" db:"status"` // pending, shortlisted, rejected, accepted
	AppliedAt time.Time `json:"appliedAt" db:"applied_at"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}

// ================ SUBSCRIPTION ENTITY ================

// Subscription represents a user's subscription plan
type Subscription struct {
	ID         string     `json:"id" db:"id"`
	UserID     string     `json:"userId" db:"user_id"`
	PlanName   string     `json:"planName" db:"plan_name"`
	Amount     float64    `json:"amount" db:"amount"`
	Status     string     `json:"status" db:"status"` // ACTIVE, EXPIRED, CANCELLED
	ExpiryDate *time.Time `json:"expiryDate" db:"expiry_date"`
	PaymentID  string     `json:"paymentId" db:"payment_id"`
	CreatedAt  time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt  time.Time  `json:"updatedAt" db:"updated_at"`
}

// ================ HIRER WORKER UNLOCK ENTITY ================

// HirerWorkerUnlock records when a hirer has unlocked a worker's contact details.
// Created once per (hirer, worker) pair after subscription is verified.
type HirerWorkerUnlock struct {
	ID          string    `json:"id" db:"id"`
	HirerUserID string    `json:"hirerUserId" db:"hirer_user_id"`
	WorkerID    string    `json:"workerId" db:"worker_id"`
	UnlockedAt  time.Time `json:"unlockedAt" db:"unlocked_at"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
}

// ================ LIVE TRACKING ENTITY ================

// WorkerLiveTracking represents real-time worker GPS coordinates
type WorkerLiveTracking struct {
	ID            string    `json:"id" db:"id"`
	WorkerID      string    `json:"workerId" db:"worker_id"`
	Latitude      float64   `json:"latitude" db:"latitude"`
	Longitude     float64   `json:"longitude" db:"longitude"`
	ActiveRouteID *string   `json:"activeRouteId" db:"active_route_id"`
	Timestamp     time.Time `json:"timestamp" db:"timestamp"`
}

// ================ SUPPORTING MODELS ================

// CreateUserRequest handles user creation requests with validation
type CreateUserRequest struct {
	// Phone is required, must be valid international format (7-20 chars)
	Phone string `json:"phoneNumber" binding:"required,min=7,max=20" form:"phone"`

	// FullName - optional, max 255 characters
	FullName string `json:"fullName" binding:"max=255" form:"full_name"`

	// Email - optional, must be valid format if provided, max 254 chars
	Email string `json:"email" binding:"omitempty,email,max=254" form:"email"`

	// Role is required, must be one of: ADMIN, WORKER, HIRER
	Role string `json:"role" binding:"required,oneof=ADMIN WORKER HIRER" form:"role"`

	// Language - optional, must be one of: en, hi, ta if provided
	Language string `json:"language" binding:"omitempty,oneof=en hi ta" form:"language"`
}

// CreateBusinessRequest handles business creation requests with validation
type CreateBusinessRequest struct {
	OwnerID      string  `json:"ownerId" binding:"required,uuid" form:"owner_id"`
	BusinessName string  `json:"businessName" binding:"required,max=255" form:"business_name"`
	OwnerName    string  `json:"ownerName" binding:"omitempty,max=255" form:"owner_name"`
	ContactRole  string  `json:"contactRole" binding:"omitempty,max=50" form:"contact_role"`
	BusinessType string  `json:"businessType" binding:"required,max=100" form:"business_type"`
	Email        string  `json:"email" binding:"omitempty,email,max=254" form:"email"`
	MobileNumber string  `json:"mobileNumber" binding:"omitempty,min=7,max=20" form:"mobile_number"`
	FSAILicense  string  `json:"fssaiLicense" binding:"omitempty,max=100" form:"fssai_license"`
	GSTNumber    string  `json:"gstNumber" binding:"omitempty,max=20" form:"gst_number"`
	LogoURL      string  `json:"logoUrl" binding:"omitempty,url" form:"logo_url"`
	City         string  `json:"city" binding:"required,max=100" form:"city"`
	State        string  `json:"state" binding:"required,max=100" form:"state"`
	AddressText  string  `json:"addressText" binding:"omitempty,max=1000" form:"address_text"`
	Latitude     float64 `json:"latitude" binding:"omitempty,latitude" form:"latitude"`
	Longitude    float64 `json:"longitude" binding:"omitempty,longitude" form:"longitude"`
	Language     string  `json:"language" binding:"omitempty,oneof=en hi ta" form:"language"`
}

// CreateWorkerRequest handles worker profile creation requests with validation
type CreateWorkerRequest struct {
	UserID             string   `json:"userId" binding:"required,uuid" form:"user_id"`
	ProfilePhotoURL    string   `json:"profilePhotoUrl" binding:"omitempty,url" form:"profile_photo_url"`
	ExperienceYears    int      `json:"experienceYears" binding:"omitempty,min=0,max=80" form:"experience_years"`
	SelectedRoles      []string `json:"selectedRoles" binding:"omitempty" form:"selected_roles"`
	BusinessTypes      []string `json:"businessTypes" binding:"omitempty" form:"business_types"`
	JobCategories      []string `json:"jobCategories" binding:"omitempty" form:"job_categories"`
	JobRoles           []string `json:"jobRoles" binding:"omitempty" form:"job_roles"`
	LanguagesKnown     []string `json:"languagesKnown" binding:"omitempty" form:"languages_known"`
	VenuePreferences   []string `json:"venuePreferences" binding:"omitempty" form:"venue_preferences"`
	WorkTypes          []string `json:"workTypes" binding:"omitempty" form:"work_types"`
	Availability       []string `json:"availability" binding:"omitempty" form:"availability"`
	AvailabilityStatus string   `json:"availabilityStatus" binding:"omitempty" form:"availability_status"`
	ExpectedSalaryMin  int      `json:"expectedSalaryMin" binding:"omitempty,min=0" form:"expected_salary_min"`
	ExpectedSalaryMax  int      `json:"expectedSalaryMax" binding:"omitempty,min=0" form:"expected_salary_max"`
	Language           string   `json:"language" binding:"omitempty,oneof=en hi ta" form:"language"`
}

// CreateJobRequest handles job posting creation requests with validation
type CreateJobRequest struct {
	BusinessID         string   `json:"businessId" binding:"required,uuid" form:"business_id"`
	JobRole            string   `json:"jobRole" binding:"required,max=100" form:"job_role"`
	Position           string   `json:"position" binding:"omitempty,max=200" form:"position"`
	Categories         []string `json:"categories" binding:"omitempty" form:"categories"`
	Roles              []string `json:"roles" binding:"omitempty" form:"roles"`
	PreferredLanguages []string `json:"preferredLanguages" binding:"omitempty" form:"preferred_languages"`
	SalaryMinAmount    float64  `json:"salaryMinAmount" binding:"omitempty,min=0" form:"salary_min_amount"`
	SalaryMaxAmount    float64  `json:"salaryMaxAmount" binding:"omitempty,min=0" form:"salary_max_amount"`
	ExperienceMin      int      `json:"experienceMin" binding:"omitempty,min=0" form:"experience_min"`
	ExperienceMax      *int     `json:"experienceMax" binding:"omitempty,min=0" form:"experience_max"`
	Vacancies          int      `json:"vacancies" binding:"required,min=1" form:"vacancies"`
	WorkingHours       *int     `json:"workingHours" binding:"omitempty,min=0,max=24" form:"working_hours"`
	WeeklyLeaves       int      `json:"weeklyLeaves" binding:"omitempty,min=0,max=7" form:"weekly_leaves"`
	Benefits           []string `json:"benefits" binding:"omitempty" form:"benefits"`
	WorkType           string   `json:"workType" binding:"omitempty,max=50" form:"work_type"`
	AddressText        string   `json:"addressText" binding:"omitempty,max=1000" form:"address_text"`
	City               string   `json:"city" binding:"omitempty,max=100" form:"city"`
	State              string   `json:"state" binding:"omitempty,max=100" form:"state"`
	Latitude           *float64 `json:"latitude" binding:"omitempty,latitude" form:"latitude"`
	Longitude          *float64 `json:"longitude" binding:"omitempty,longitude" form:"longitude"`
	Status             string   `json:"status" binding:"omitempty,oneof=OPEN CLOSED FILLED" form:"status"`
	Language           string   `json:"language" binding:"omitempty,oneof=en hi ta" form:"language"`
}

// UpdateUserRequest handles user profile update requests with validation
type UpdateUserRequest struct {
	// FullName - optional update
	FullName string `json:"fullName" binding:"omitempty,max=255" form:"full_name"`

	// Email - optional update
	Email string `json:"email" binding:"omitempty,email,max=254" form:"email"`

	// Language - optional update
	Language string `json:"language" binding:"omitempty,oneof=en hi ta" form:"language"`
}

// CreateApplicationRequest handles application creation requests
type CreateApplicationRequest struct {
	JobID    string `json:"jobId" binding:"required"`
	WorkerID string `json:"workerId" binding:"required"`
}

// ================ CHAT SYSTEM ENTITIES ================

// ChatThread represents a conversation between a worker and hirer about a specific job
type ChatThread struct {
	ID            string     `json:"id" db:"id"`
	WorkerID      string     `json:"workerId" db:"worker_id"`
	HirerID       string     `json:"hirerId" db:"hirer_id"`
	JobID         string     `json:"jobId" db:"job_id"`
	LastMessageAt *time.Time `json:"lastMessageAt" db:"last_message_at"`
	IsArchived    bool       `json:"isArchived" db:"is_archived"`
	CreatedAt     time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time  `json:"updatedAt" db:"updated_at"`

	// Enriched fields — populated by GetChatThreadsByUserID only.
	// DisplayName is the other party's name as seen by the requesting user:
	// a worker sees the hirer/business name; a hirer sees the worker's name.
	HirerName           string `json:"hirerName" db:"-"`
	WorkerName          string `json:"workerName" db:"-"`
	LastMessagePreview  string `json:"lastMessagePreview" db:"-"`
	UnreadCount         int    `json:"unreadCount" db:"-"`
}

// ChatMessage represents a single message in a chat thread
type ChatMessage struct {
	ID             string         `json:"id" db:"id"`
	ThreadID       string         `json:"threadId" db:"thread_id"`
	SenderID       string         `json:"senderId" db:"sender_id"`
	MessageText    string         `json:"messageText" db:"message_text"`
	AttachmentURLs pq.StringArray `json:"attachmentUrls" db:"attachment_urls"`
	IsRead         bool           `json:"isRead" db:"is_read"`
	ReadAt         *time.Time     `json:"readAt" db:"read_at"`
	DeliveredAt    *time.Time     `json:"deliveredAt" db:"delivered_at"`
	// Reply support: points to the message this one is quoting.
	ReplyToMessageID *string    `json:"replyToMessageId" db:"reply_to_message_id"`
	// Enriched fields — populated by GetChatMessages JOIN only.
	ReplyToText     *string    `json:"replyToText" db:"-"`
	ReplyToSenderID *string    `json:"replyToSenderId" db:"-"`
	DeletedAt       *time.Time `json:"deletedAt" db:"deleted_at"`
	DeletedBy       *string    `json:"deletedBy" db:"deleted_by"`
	CreatedAt       time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time  `json:"updatedAt" db:"updated_at"`
}

// ================ SAVED ITEMS ENTITIES ================

// SavedJob represents a worker's saved job
type SavedJob struct {
	ID       string    `json:"id" db:"id"`
	WorkerID string    `json:"workerId" db:"worker_id"`
	JobID    string    `json:"jobId" db:"job_id"`
	SavedAt  time.Time `json:"savedAt" db:"saved_at"`
}

// SavedWorker represents a hirer's saved worker
type SavedWorker struct {
	ID       string    `json:"id" db:"id"`
	HirerID  string    `json:"hirerId" db:"hirer_id"`
	WorkerID string    `json:"workerId" db:"worker_id"`
	SavedAt  time.Time `json:"savedAt" db:"saved_at"`
}

// ================ VERIFICATION ENTITIES ================

// WorkerVerification tracks worker KYC status
type WorkerVerification struct {
	ID                     string     `json:"id" db:"id"`
	WorkerID               string     `json:"workerId" db:"worker_id"`
	PhoneVerified          bool       `json:"phoneVerified" db:"phone_verified"`
	PhoneVerifiedAt        *time.Time `json:"phoneVerifiedAt" db:"phone_verified_at"`
	EmailVerified          bool       `json:"emailVerified" db:"email_verified"`
	EmailVerifiedAt        *time.Time `json:"emailVerifiedAt" db:"email_verified_at"`
	IdentityVerified       bool       `json:"identityVerified" db:"identity_verified"`
	IdentityDocumentURL    string     `json:"identityDocumentUrl" db:"identity_document_url"`
	IdentityVerifiedAt     *time.Time `json:"identityVerifiedAt" db:"identity_verified_at"`
	IdentityRejectedReason string     `json:"identityRejectedReason" db:"identity_rejected_reason"`
	VerificationStatus     string     `json:"verificationStatus" db:"verification_status"`
	StatusUpdatedAt        time.Time  `json:"statusUpdatedAt" db:"status_updated_at"`
	RejectionCount         int        `json:"rejectionCount" db:"rejection_count"`
	LastRejectionReason    string     `json:"lastRejectionReason" db:"last_rejection_reason"`
	CreatedAt              time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt              time.Time  `json:"updatedAt" db:"updated_at"`
}

// BusinessVerification tracks business compliance documents
type BusinessVerification struct {
	ID                 string     `json:"id" db:"id"`
	BusinessID         string     `json:"businessId" db:"business_id"`
	FSAIVerified       bool       `json:"fssaiVerified" db:"fssai_verified"`
	FSAIDocumentURL    string     `json:"fssaiDocumentUrl" db:"fssai_document_url"`
	FSAIVerifiedAt     *time.Time `json:"fssaiVerifiedAt" db:"fssai_verified_at"`
	FSAIRejectedReason string     `json:"fssaiRejectedReason" db:"fssai_rejected_reason"`
	GSTVerified        bool       `json:"gstVerified" db:"gst_verified"`
	GSTDocumentURL     string     `json:"gstDocumentUrl" db:"gst_document_url"`
	GSTVerifiedAt      *time.Time `json:"gstVerifiedAt" db:"gst_verified_at"`
	GSTRejectedReason  string     `json:"gstRejectedReason" db:"gst_rejected_reason"`
	OwnerVerified      bool       `json:"ownerVerified" db:"owner_verified"`
	OwnerDocumentURL   string     `json:"ownerDocumentUrl" db:"owner_document_url"`
	OwnerVerifiedAt    *time.Time `json:"ownerVerifiedAt" db:"owner_verified_at"`
	VerificationStatus string     `json:"verificationStatus" db:"verification_status"`
	StatusUpdatedAt    time.Time  `json:"statusUpdatedAt" db:"status_updated_at"`
	CreatedAt          time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt          time.Time  `json:"updatedAt" db:"updated_at"`
}

// ================ NOTIFICATION ENTITY ================

// Notification represents a user notification
type Notification struct {
	ID                string     `json:"id" db:"id"`
	UserID            string     `json:"userId" db:"user_id"`
	Title             string     `json:"title" db:"title"`
	Message           string     `json:"message" db:"message"`
	Type              string     `json:"type" db:"type"`
	RelatedEntityType *string    `json:"relatedEntityType" db:"related_entity_type"`
	RelatedEntityID   *string    `json:"relatedEntityId" db:"related_entity_id"`
	IsRead            bool       `json:"isRead" db:"is_read"`
	ReadAt            *time.Time `json:"readAt" db:"read_at"`
	UnreadCount       int        `json:"unreadCount" db:"unread_count"`
	UpdatedAt         time.Time  `json:"updatedAt" db:"updated_at"`
	CreatedAt         time.Time  `json:"createdAt" db:"created_at"`
}

// ================ AUDIT & LOGGING ENTITIES ================

// AuditEvent tracks all administrative actions for compliance
type AuditEvent struct {
	ID             string                 `json:"id" db:"id"`
	AdminID        *string                `json:"adminId" db:"admin_id"`
	Action         string                 `json:"action" db:"action"`
	EntityType     string                 `json:"entityType" db:"entity_type"`
	EntityID       string                 `json:"entityId" db:"entity_id"`
	BeforeSnapshot map[string]interface{} `json:"beforeSnapshot" db:"before_snapshot"`
	AfterSnapshot  map[string]interface{} `json:"afterSnapshot" db:"after_snapshot"`
	ChangeReason   string                 `json:"changeReason" db:"change_reason"`
	IPAddress      *string                `json:"ipAddress" db:"ip_address"`
	UserAgent      *string                `json:"userAgent" db:"user_agent"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
}

// AdminLog tracks admin actions (simplified)
type AdminLog struct {
	ID           string                 `json:"id" db:"id"`
	AdminID      string                 `json:"adminId" db:"admin_id"`
	Action       string                 `json:"action" db:"action"`
	TargetUserID *string                `json:"targetUserId" db:"target_user_id"`
	Details      map[string]interface{} `json:"details" db:"details"`
	CreatedAt    time.Time              `json:"createdAt" db:"created_at"`
}

// ================ SUBSCRIPTION TRACKING ================

// WorkerContactLimitLog tracks daily contact limits per hirer
type WorkerContactLimitLog struct {
	ID           string    `json:"id" db:"id"`
	HirerID      string    `json:"hirerId" db:"hirer_id"`
	ContactDate  time.Time `json:"contactDate" db:"contact_date"`
	ContactsUsed int       `json:"contactsUsed" db:"contacts_used"`
	ContactLimit int       `json:"contactLimit" db:"contact_limit"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}

// ================ INSTANT JOB APPLICATION ================

// InstantJobApplication stores a worker's direct company application form submission.
// Not linked to a specific job posting — worker expresses interest in a company/role directly.
type InstantJobApplication struct {
	ID          string    `json:"id" db:"id"`
	UserID      *string   `json:"userId" db:"user_id"`
	Name        string    `json:"name" db:"name"`
	Phone       string    `json:"phone" db:"phone"`
	Role        string    `json:"role" db:"role"`
	Experience  string    `json:"experience" db:"experience"`
	Location    string    `json:"location" db:"location"`
	CompanyName string    `json:"companyName" db:"company_name"`
	CreatedAt   time.Time `json:"createdAt" db:"created_at"`
}

// ================ WORKER RESUME ================

// WorkerResume stores resume file metadata for a worker.
// Binary data is never stored in DB — only file path/URL and metadata.
// Ownership is established via worker_id (FK → workers.id).
type WorkerResume struct {
	ID           string     `json:"id" db:"id"`
	WorkerID     string     `json:"workerId" db:"worker_id"`
	FileURL      string     `json:"fileUrl" db:"file_url"`
	OriginalName string     `json:"originalName" db:"original_name"`
	StoredName   string     `json:"storedName" db:"stored_name"`
	MimeType     string     `json:"mimeType" db:"mime_type"`
	FileSize     int64      `json:"fileSize" db:"file_size"`
	IsActive     bool       `json:"isActive" db:"is_active"`
	UploadedAt   time.Time  `json:"uploadedAt" db:"uploaded_at"`
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time  `json:"updatedAt" db:"updated_at"`
	DeletedAt    *time.Time `json:"deletedAt,omitempty" db:"deleted_at"`
}
