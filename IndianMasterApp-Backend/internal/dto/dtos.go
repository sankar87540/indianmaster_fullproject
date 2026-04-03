package dto

import "time"

// ================ PAGINATION ================

// PaginationRequest standard pagination query parameters
type PaginationRequest struct {
	Page  int `form:"page" binding:"omitempty,min=1" default:"1"`
	Limit int `form:"limit" binding:"omitempty,min=1,max=100" default:"20"`
}

// Pagination represents pagination parameters with sorting
type Pagination struct {
	Page  int    `form:"page" binding:"omitempty,min=1"`
	Limit int    `form:"limit" binding:"omitempty,min=1,max=100"`
	Sort  string `form:"sort" binding:"omitempty"`                 // Field to sort by (e.g., "created_at", "name")
	Order string `form:"order" binding:"omitempty,oneof=asc desc"` // Sort order: asc or desc
}

// PaginationMeta contains pagination metadata for responses
type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int64 `json:"totalPages"`
}

// PaginatedResponse wraps paginated results
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"totalPages"`
}

// ================ AUTH DTOs ================

// LoginRequest request for email/password login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

// LoginResponse successful login response with JWT token
type LoginResponse struct {
	Token  string `json:"token"`
	UserID string `json:"userId"`
	Role   string `json:"role"`
}

// RegistrationRequest request for user registration
type RegistrationRequest struct {
	Name     string `json:"name" binding:"required,max=255"`
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role" binding:"required,oneof=worker business admin"`
}

// RegistrationResponse successful registration response
type RegistrationResponse struct {
	Message   string    `json:"message"`
	UserID    string    `json:"userId"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

// SendOTPRequest request to send OTP to phone
type SendOTPRequest struct {
	Phone string `json:"phone" binding:"required,min=7,max=20"`
}

// SendOTPResponse response with request ID and expiry
type SendOTPResponse struct {
	RequestID string `json:"requestId"`
	ExpiresIn int    `json:"expiresIn"` // seconds
}

// VerifyOTPRequest request to verify OTP and login/signup
type VerifyOTPRequest struct {
	Phone     string `json:"phone" binding:"required,min=7,max=20"`
	OTP       string `json:"otp" binding:"required,len=6"`
	RequestID string `json:"requestId" binding:"required"`
	Role      string `json:"role" binding:"required,oneof=WORKER HIRER ADMIN"`
	Language  string `json:"language" binding:"omitempty,oneof=en hi ta"`
}

// AuthResponse successful authentication response
type AuthResponse struct {
	AccessToken string       `json:"accessToken"`
	ExpiresIn   int          `json:"expiresIn"` // seconds
	User        UserResponse `json:"user"`
}

// ================ WORKER DTOs ================

// WorkerProfileResponse worker profile view
type WorkerProfileResponse struct {
	ID                   string    `json:"id"`
	UserID               string    `json:"userId"`
	Phone                string    `json:"phoneNumber"`
	FullName             string    `json:"fullName"`
	Email                string    `json:"email"`
	ProfilePhotoURL      string    `json:"profilePhotoUrl"`
	ExperienceYears      int       `json:"experienceYears"`
	SelectedRoles        []string  `json:"selectedRoles"`
	BusinessTypes        []string  `json:"businessTypes"`
	JobCategories        []string  `json:"jobCategories"`
	JobRoles             []string  `json:"jobRoles"`
	LanguagesKnown       []string  `json:"languagesKnown"`
	VenuePreferences     []string  `json:"venuePreferences"`
	WorkTypes            []string  `json:"workTypes"`
	Availability         []string  `json:"availability"`
	AvailabilityStatus   string    `json:"availabilityStatus"`
	ExpectedSalaryMin    int       `json:"expectedSalaryMin"`
	ExpectedSalaryMax    int       `json:"expectedSalaryMax"`
	CompletionPercentage int       `json:"completionPercentage"`
	Rating               float64   `json:"rating"`
	TotalReviews         int       `json:"totalReviews"`
	Age                  int       `json:"age"`
	Gender               string    `json:"gender"`
	Address              string    `json:"address"`
	City                 string    `json:"city"`
	State                string    `json:"state"`
	IsEducated           bool      `json:"isEducated"`
	EducationLevel       string    `json:"educationLevel"`
	Degree               string    `json:"degree"`
	College              string    `json:"college"`
	AadhaarNumber        string    `json:"aadhaarNumber"`
	Language             string    `json:"language"`
	IsVerified           bool     `json:"isVerified"`
	VerificationStatus   string   `json:"verificationStatus"`
	LiveLatitude         *float64 `json:"liveLatitude"`
	LiveLongitude        *float64 `json:"liveLongitude"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

// WorkerUnlockStatusResponse is returned by GET /hirer/workers/:id/unlock-status
type WorkerUnlockStatusResponse struct {
	WorkerID   string `json:"workerId"`
	IsUnlocked bool   `json:"isUnlocked"`
}

// WorkerContactResponse is returned by POST /hirer/workers/:id/unlock
// Only returned to hirers who have unlocked the worker.
type WorkerContactResponse struct {
	WorkerID    string `json:"workerId"`
	Phone       string `json:"phone"`
	WhatsAppURL string `json:"whatsappUrl"`
	IsUnlocked  bool   `json:"isUnlocked"`
}

// CreateWorkerProfileRequest create worker profile
type CreateWorkerProfileRequest struct {
	FullName           string   `json:"fullName" binding:"omitempty,max=255"`
	Phone              string   `json:"mobileNumber" binding:"omitempty,min=7,max=20"`
	Email              string   `json:"email" binding:"omitempty,email,max=254"`
	SelectedRoles      []string `json:"selectedRoles" binding:"omitempty"`
	ExperienceYears    int      `json:"experienceYears" binding:"omitempty,min=0,max=80"`
	BusinessTypes      []string `json:"businessTypes" binding:"omitempty"`
	JobCategories      []string `json:"jobCategories" binding:"omitempty"`
	JobRoles           []string `json:"jobRoles" binding:"omitempty"`
	LanguagesKnown     []string `json:"languagesKnown" binding:"omitempty"`
	VenuePreferences   []string `json:"venuePreferences" binding:"omitempty"`
	WorkTypes          []string `json:"workTypes" binding:"omitempty"`
	Availability       []string `json:"availability" binding:"omitempty"`
	AvailabilityStatus string   `json:"availabilityStatus" binding:"omitempty"`
	ExpectedSalaryMin  int      `json:"expectedSalaryMin" binding:"omitempty,min=0"`
	ExpectedSalaryMax  int      `json:"expectedSalaryMax" binding:"omitempty,min=0"`
	ProfilePhotoURL    string   `json:"profilePhotoUrl" binding:"omitempty"`
	Language           string   `json:"language" binding:"omitempty,oneof=en hi ta"`
	Age                int      `json:"age" binding:"omitempty,min=0,max=120"`
	Gender             string   `json:"gender" binding:"omitempty,max=20"`
	Address            string   `json:"address" binding:"omitempty"`
	City               string   `json:"city" binding:"omitempty,max=100"`
	State              string   `json:"state" binding:"omitempty,max=100"`
	IsEducated         bool     `json:"isEducated" binding:"omitempty"`
	EducationLevel     string   `json:"educationLevel" binding:"omitempty,max=100"`
	Degree             string   `json:"degree" binding:"omitempty,max=200"`
	College            string   `json:"college" binding:"omitempty,max=255"`
	AadhaarNumber      string   `json:"aadhaarNumber" binding:"omitempty,len=12"`
	LiveLatitude       *float64 `json:"liveLatitude" binding:"omitempty"`
	LiveLongitude      *float64 `json:"liveLongitude" binding:"omitempty"`
}

// UpdateWorkerProfileRequest update worker profile
type UpdateWorkerProfileRequest struct {
	FullName           string   `json:"fullName" binding:"omitempty,max=255"`
	Phone              string   `json:"mobileNumber" binding:"omitempty,min=7,max=20"`
	Email              string   `json:"email" binding:"omitempty,email,max=254"`
	SelectedRoles      []string `json:"selectedRoles" binding:"omitempty"`
	ExperienceYears    int      `json:"experienceYears" binding:"omitempty,min=0,max=80"`
	BusinessTypes      []string `json:"businessTypes" binding:"omitempty"`
	JobCategories      []string `json:"jobCategories" binding:"omitempty"`
	JobRoles           []string `json:"jobRoles" binding:"omitempty"`
	LanguagesKnown     []string `json:"languagesKnown" binding:"omitempty"`
	VenuePreferences   []string `json:"venuePreferences" binding:"omitempty"`
	WorkTypes          []string `json:"workTypes" binding:"omitempty"`
	Availability       []string `json:"availability" binding:"omitempty"`
	AvailabilityStatus string   `json:"availabilityStatus" binding:"omitempty"`
	ExpectedSalaryMin  int      `json:"expectedSalaryMin" binding:"omitempty,min=0"`
	ExpectedSalaryMax  int      `json:"expectedSalaryMax" binding:"omitempty,min=0"`
	ProfilePhotoURL    string   `json:"profilePhotoUrl" binding:"omitempty"`
	Language           string   `json:"language" binding:"omitempty,oneof=en hi ta"`
	Age                int      `json:"age" binding:"omitempty,min=0,max=120"`
	Gender             string   `json:"gender" binding:"omitempty,max=20"`
	Address            string   `json:"address" binding:"omitempty"`
	City               string   `json:"city" binding:"omitempty,max=100"`
	State              string   `json:"state" binding:"omitempty,max=100"`
	IsEducated         *bool    `json:"isEducated" binding:"omitempty"`
	EducationLevel     string   `json:"educationLevel" binding:"omitempty,max=100"`
	Degree             string   `json:"degree" binding:"omitempty,max=200"`
	College            string   `json:"college" binding:"omitempty,max=255"`
	AadhaarNumber      string   `json:"aadhaarNumber" binding:"omitempty,len=12"`
	LiveLatitude       *float64 `json:"liveLatitude" binding:"omitempty"`
	LiveLongitude      *float64 `json:"liveLongitude" binding:"omitempty"`
}

// ================ JOB DTOs ================

// JobResponse job posting view
type JobResponse struct {
	ID                 string    `json:"id"`
	BusinessID         string    `json:"businessId"`
	BusinessName       string    `json:"businessName,omitempty"`
	LogoURL            string    `json:"logoUrl,omitempty"`
	JobRole            string    `json:"jobRole"`
	Position           string    `json:"position"`
	Categories         []string  `json:"categories"`
	Roles              []string  `json:"roles"`
	PreferredLanguages []string  `json:"preferredLanguages"`
	SalaryMinAmount    float64   `json:"salaryMinAmount"`
	SalaryMaxAmount    float64   `json:"salaryMaxAmount"`
	ExperienceMin      int       `json:"experienceMin"`
	ExperienceMax      *int      `json:"experienceMax"`
	Vacancies          int       `json:"vacancies"`
	GenderPreference   string    `json:"genderPreference"`
	MaleVacancies      int       `json:"maleVacancies"`
	FemaleVacancies    int       `json:"femaleVacancies"`
	OthersVacancies    int       `json:"othersVacancies"`
	WorkingHours       *int      `json:"workingHours"`
	WeeklyLeaves       int       `json:"weeklyLeaves"`
	Benefits           []string  `json:"benefits"`
	WorkType           string    `json:"workType"`
	City               string    `json:"city"`
	State              string    `json:"state"`
	Locality           string    `json:"locality"`
	AddressText        string    `json:"addressText"`
	Latitude           *float64  `json:"latitude"`
	Longitude          *float64  `json:"longitude"`
	Description        string    `json:"description"`
	Availability       []string  `json:"availability"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"createdAt"`
}

// CreateJobRequest create new job
// BusinessID is optional — if omitted the service resolves it from the hirer's JWT identity.
// JobRole is optional — if omitted the service derives it from the first element of Roles.
type CreateJobRequest struct {
	BusinessID         string   `json:"businessId" binding:"omitempty,uuid"`
	JobRole            string   `json:"jobRole" binding:"omitempty,max=100"`
	Position           string   `json:"position" binding:"omitempty,max=200"`
	Categories         []string `json:"categories" binding:"omitempty"`
	Roles              []string `json:"roles" binding:"omitempty"`
	PreferredLanguages []string `json:"preferredLanguages" binding:"omitempty"`
	SalaryMinAmount    float64  `json:"salaryMinAmount" binding:"omitempty,min=0"`
	SalaryMaxAmount    float64  `json:"salaryMaxAmount" binding:"omitempty,min=0"`
	ExperienceMin      int      `json:"experienceMin" binding:"omitempty,min=0"`
	ExperienceMax      *int     `json:"experienceMax" binding:"omitempty,min=0"`
	Vacancies          int      `json:"vacancies" binding:"omitempty,min=0"`
	GenderPreference   string   `json:"genderPreference" binding:"omitempty,oneof=Male Female Others All"`
	MaleVacancies      int      `json:"maleVacancies" binding:"omitempty,min=0"`
	FemaleVacancies    int      `json:"femaleVacancies" binding:"omitempty,min=0"`
	OthersVacancies    int      `json:"othersVacancies" binding:"omitempty,min=0"`
	WorkingHours       *int     `json:"workingHours" binding:"omitempty,min=0,max=24"`
	WeeklyLeaves       int      `json:"weeklyLeaves" binding:"omitempty,min=0,max=7"`
	Benefits           []string `json:"benefits" binding:"omitempty"`
	WorkType           string   `json:"workType" binding:"omitempty,max=50"`
	AddressText        string   `json:"addressText" binding:"omitempty,max=1000"`
	Locality           string   `json:"locality" binding:"omitempty,max=255"`
	City               string   `json:"city" binding:"omitempty,max=100"`
	State              string   `json:"state" binding:"omitempty,max=100"`
	Description        string   `json:"description" binding:"omitempty"`
	Availability       []string `json:"availability" binding:"omitempty"`
}

// UpdateJobRequest update job details
type UpdateJobRequest struct {
	Position           string   `json:"position" binding:"omitempty,max=200"`
	Categories         []string `json:"categories" binding:"omitempty"`
	Roles              []string `json:"roles" binding:"omitempty"`
	PreferredLanguages []string `json:"preferredLanguages" binding:"omitempty"`
	SalaryMinAmount    float64  `json:"salaryMinAmount" binding:"omitempty,min=0"`
	SalaryMaxAmount    float64  `json:"salaryMaxAmount" binding:"omitempty,min=0"`
	ExperienceMin      int      `json:"experienceMin" binding:"omitempty,min=0"`
	ExperienceMax      *int     `json:"experienceMax" binding:"omitempty,min=0"`
	Vacancies          int      `json:"vacancies" binding:"omitempty,min=0"`
	GenderPreference   string   `json:"genderPreference" binding:"omitempty,oneof=Male Female Others All"`
	MaleVacancies      int      `json:"maleVacancies" binding:"omitempty,min=0"`
	FemaleVacancies    int      `json:"femaleVacancies" binding:"omitempty,min=0"`
	OthersVacancies    int      `json:"othersVacancies" binding:"omitempty,min=0"`
	WorkingHours       *int     `json:"workingHours" binding:"omitempty,min=0,max=24"`
	WeeklyLeaves       int      `json:"weeklyLeaves" binding:"omitempty,min=0,max=7"`
	Benefits           []string `json:"benefits" binding:"omitempty"`
	Status             string   `json:"status" binding:"omitempty,oneof=DRAFT OPEN PAUSED CLOSED FILLED"`
	WorkType           string   `json:"workType" binding:"omitempty,max=50"`
	AddressText        string   `json:"addressText" binding:"omitempty,max=1000"`
	Locality           string   `json:"locality" binding:"omitempty,max=255"`
	City               string   `json:"city" binding:"omitempty,max=100"`
	State              string   `json:"state" binding:"omitempty,max=100"`
	Description        string   `json:"description" binding:"omitempty"`
	Availability       []string `json:"availability" binding:"omitempty"`
}

// ================ APPLICATION DTOs ================

// CreateApplicationRequest apply for a job
type CreateApplicationRequest struct {
	JobID string `json:"jobId" binding:"required,uuid"`
}

// ApplicationResponse application view
type ApplicationResponse struct {
	ID        string    `json:"id"`
	JobID     string    `json:"jobId"`
	WorkerID  string    `json:"workerId"`
	Status    string    `json:"status"`
	AppliedAt time.Time `json:"appliedAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// UpdateApplicationStatusRequest update application status
type UpdateApplicationStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=shortlisted rejected accepted withdrawn"`
}

// ApplicantDetail enriched applicant view returned to hirers for a specific job
type ApplicantDetail struct {
	ApplicationID     string    `json:"applicationId"`
	Status            string    `json:"status"`
	AppliedAt         time.Time `json:"appliedAt"`
	WorkerUserID      string    `json:"workerUserId"`
	FullName          string    `json:"fullName"`
	Phone             string    `json:"phone"`
	Email             string    `json:"email"`
	City              string    `json:"city"`
	State             string    `json:"state"`
	ExpectedSalaryMin int       `json:"expectedSalaryMin"`
	ExpectedSalaryMax int       `json:"expectedSalaryMax"`
	ProfilePhotoURL   string    `json:"profilePhotoUrl,omitempty"`
}

// ================ CHAT DTOs ================

// CreateChatThreadRequest open or retrieve a conversation between the caller and another user.
// The caller's identity (worker or hirer) is derived from their JWT token server-side.
// OtherUserID is the UUID of the other party.
type CreateChatThreadRequest struct {
	OtherUserID string `json:"otherUserId" binding:"required,uuid"`
	// JobID is optional context for the conversation
	JobID string `json:"jobId" binding:"omitempty,uuid"`
}

// ChatThreadResponse chat thread view
type ChatThreadResponse struct {
	ID                 string     `json:"id"`
	WorkerID           string     `json:"workerId"`
	HirerID            string     `json:"hirerId"`
	JobID              string     `json:"jobId"`
	LastMessageAt      *time.Time `json:"lastMessageAt"`
	IsArchived         bool       `json:"isArchived"`
	UnreadCount        int        `json:"unreadCount"`
	// HirerName: other party's display name as seen by the requester.
	// For a worker, this is the hirer/business name. For a hirer, it is the worker's name.
	HirerName          string     `json:"hirerName"`
	WorkerName         string     `json:"workerName"`
	LastMessagePreview string     `json:"lastMessagePreview"`
	CreatedAt          time.Time  `json:"createdAt"`
}

// ChatMessageResponse chat message view
type ChatMessageResponse struct {
	ID             string     `json:"id"`
	ThreadID       string     `json:"threadId"`
	SenderID       string     `json:"senderId"`
	MessageText    string     `json:"messageText"`
	AttachmentURLs []string   `json:"attachmentUrls"`
	IsRead         bool       `json:"isRead"`
	ReadAt         *time.Time `json:"readAt"`
	DeliveredAt    *time.Time `json:"deliveredAt"`
	// Reply context — null when this message is not a reply.
	ReplyToMessageID *string    `json:"replyToMessageId"`
	ReplyToText      *string    `json:"replyToText"`
	ReplyToSenderID  *string    `json:"replyToSenderId"`
	CreatedAt        time.Time  `json:"createdAt"`
}

// SendChatMessageRequest send new message (threadId comes from URL path param)
type SendChatMessageRequest struct {
	MessageText      string   `json:"messageText" binding:"required,max=5000"`
	AttachmentURLs   []string `json:"attachmentUrls" binding:"omitempty"`
	// ReplyToMessageID: optional; when set the message is a quoted reply.
	ReplyToMessageID string   `json:"replyToMessageId" binding:"omitempty,uuid"`
}

// PresenceResponse online/offline status of the other chat participant
type PresenceResponse struct {
	IsOnline bool       `json:"isOnline"`
	LastSeen *time.Time `json:"lastSeen"`
}

// ================ SUBSCRIPTION DTOs ================

// SubscriptionResponse subscription view
type SubscriptionResponse struct {
	ID            string     `json:"id"`
	PlanName      string     `json:"planName"`
	Status        string     `json:"status"`
	Amount        float64    `json:"amount"`
	StartDate     time.Time  `json:"startDate"`
	EndDate       *time.Time `json:"endDate"`
	RemainingDays int        `json:"remainingDays"`
	ContactLimit  int        `json:"contactLimit"`
	ContactsUsed  int        `json:"contactsUsed"`
	CreatedAt     time.Time  `json:"createdAt"`
}

// PlanResponse subscription plan details
type PlanResponse struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Price        float64  `json:"price"`
	Currency     string   `json:"currency"`
	DurationDays int      `json:"durationDays"`
	ContactLimit int      `json:"contactLimit"`
	Features     []string `json:"features"`
}

// CreateSubscriptionRequest create new subscription
type CreateSubscriptionRequest struct {
	PlanName string  `json:"planName" binding:"required,oneof=Free Premium Enterprise"`
	Amount   float64 `json:"amount" binding:"required,min=0"`
}

// UpgradeSubscriptionRequest upgrade subscription
type UpgradeSubscriptionRequest struct {
	PlanID         string `json:"planId" binding:"required"`
	PaymentGateway string `json:"paymentGateway" binding:"required,oneof=razorpay stripe"`
}

// ================ BUSINESS DTOs ================

// BusinessResponse business view
type BusinessResponse struct {
	ID           string    `json:"id"`
	OwnerID      string    `json:"ownerId"`
	BusinessName string    `json:"businessName"`
	OwnerName    string    `json:"ownerName"`
	ContactRole  string    `json:"contactRole"`
	BusinessType string    `json:"businessType"`
	Email        string    `json:"email"`
	MobileNumber string    `json:"mobileNumber"`
	FSAILicense  string    `json:"fssaiLicense"`
	GSTNumber    string    `json:"gstNumber"`
	City         string    `json:"city"`
	State        string    `json:"state"`
	AddressText  string    `json:"addressText"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	Language     string    `json:"language"`
	LogoURL      string    `json:"logoUrl"`
	IsActive     bool      `json:"isActive"`
	IsVerified   bool      `json:"isVerified"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CreateBusinessRequest create new business
type CreateBusinessRequest struct {
	OwnerID      string  `json:"ownerId" binding:"required"`
	BusinessName string  `json:"businessName" binding:"required,max=255"`
	OwnerName    string  `json:"ownerName" binding:"required,max=255"`
	ContactRole  string  `json:"contactRole" binding:"required,max=100"`
	BusinessType string  `json:"businessType" binding:"required,max=100"`
	Email        string  `json:"email" binding:"required,email"`
	MobileNumber string  `json:"mobileNumber" binding:"required,max=20"`
	FSAILicense  string  `json:"fssaiLicense" binding:"omitempty,max=50"`
	GSTNumber    string  `json:"gstNumber" binding:"omitempty,max=50"`
	LogoURL      string  `json:"logoUrl" binding:"omitempty,url"`
	City         string  `json:"city" binding:"required,max=100"`
	State        string  `json:"state" binding:"required,max=100"`
	AddressText  string  `json:"addressText" binding:"required,max=1000"`
	Latitude     float64 `json:"latitude" binding:"omitempty"`
	Longitude    float64 `json:"longitude" binding:"omitempty"`
	Language     string  `json:"language" binding:"omitempty,oneof=en hi ta"`
}

// HirerProfileRequest is the upsert payload from the restaurant-setup screen.
// OwnerID is taken from the JWT — not from the request body.
type HirerProfileRequest struct {
	BusinessName  string   `json:"businessName" binding:"required"`
	OwnerName     string   `json:"ownerName" binding:"required"`
	ContactRole   string   `json:"contactRole" binding:"required"`
	BusinessTypes []string `json:"businessTypes" binding:"required,min=1"`
	Email         string   `json:"email" binding:"omitempty,email"`
	MobileNumber  string   `json:"mobileNumber" binding:"omitempty"`
	FSSAILicense  string   `json:"fssaiLicense" binding:"omitempty"`
	GSTNumber     string   `json:"gstNumber" binding:"omitempty"`
	EmployeeCount int      `json:"employeeCount" binding:"omitempty,min=0"`
	City          string   `json:"city" binding:"omitempty,max=100"`
	State         string   `json:"state" binding:"omitempty,max=100"`
	Latitude      float64  `json:"latitude" binding:"omitempty"`
	Longitude     float64  `json:"longitude" binding:"omitempty"`
}

// HirerProfileResponse is returned by GET/PUT /api/v1/hirer/profile.
type HirerProfileResponse struct {
	ID            string    `json:"id"`
	OwnerID       string    `json:"ownerId"`
	BusinessName  string    `json:"businessName"`
	OwnerName     string    `json:"ownerName"`
	ContactRole   string    `json:"contactRole"`
	BusinessTypes []string  `json:"businessTypes"`
	Email         string    `json:"email"`
	MobileNumber  string    `json:"mobileNumber"`
	FSSAILicense  string    `json:"fssaiLicense"`
	GSTNumber     string    `json:"gstNumber"`
	EmployeeCount int       `json:"employeeCount"`
	LogoURL       string    `json:"logoUrl"`
	City          string    `json:"city"`
	State         string    `json:"state"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	IsVerified    bool      `json:"isVerified"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// ================ NOTIFICATION DTOs ================

// NotificationResponse notification view
type NotificationResponse struct {
	ID                string    `json:"id"`
	Title             string    `json:"title"`
	Message           string    `json:"message"`
	Type              string    `json:"type"`
	RelatedEntityType *string   `json:"relatedEntityType"`
	RelatedEntityID   *string   `json:"relatedEntityId"`
	IsRead            bool      `json:"isRead"`
	UnreadCount       int       `json:"unreadCount"`
	UpdatedAt         time.Time `json:"updatedAt"`
	CreatedAt         time.Time `json:"createdAt"`
}

// MarkNotificationReadRequest mark notification as read
type MarkNotificationReadRequest struct {
	IsRead bool `json:"isRead" binding:"required"`
}

// ================ USER RESPONSE ================

// UserResponse user profile view
type UserResponse struct {
	ID        string    `json:"id"`
	Phone     string    `json:"phoneNumber"`
	Email     string    `json:"email"`
	FullName  string    `json:"fullName"`
	Role      string    `json:"role"`
	Language  string    `json:"language"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}

// UpdateProfileRequest update user profile
type UpdateProfileRequest struct {
	FullName string `json:"fullName" binding:"omitempty,max=255"`
	Email    string `json:"email" binding:"omitempty,email,max=254"`
	Language string `json:"language" binding:"omitempty,oneof=en hi ta"`
}

// ================ SEARCH DTOs ================

// SearchJobsRequest search jobs with filters
type SearchJobsRequest struct {
	PaginationRequest
	City          string  `form:"city" binding:"omitempty,max=100"`
	JobRole       string  `form:"job_role" binding:"omitempty,max=100"`
	SalaryMin     float64 `form:"salary_min" binding:"omitempty,min=0"`
	SalaryMax     float64 `form:"salary_max" binding:"omitempty,min=0"`
	ExperienceMin int     `form:"experience_min" binding:"omitempty,min=0"`
	WorkType      string  `form:"work_type" binding:"omitempty,max=50"`
	Sort          string  `form:"sort" binding:"omitempty,oneof=-created_at created_at salary_min salary_max"`
}

// SearchWorkersRequest search workers with filters
type SearchWorkersRequest struct {
	PaginationRequest
	City          string `form:"city" binding:"omitempty,max=100"`
	Roles         string `form:"roles" binding:"omitempty"` // comma-separated
	MinExperience int    `form:"min_experience" binding:"omitempty,min=0"`
	MaxExperience int    `form:"max_experience" binding:"omitempty,min=0"`
	Sort          string `form:"sort" binding:"omitempty,oneof=-created_at created_at -experience_years experience_years"`
}

// ================ VERIFICATION DTOs ================

// VerificationStatusResponse KYC status view
type VerificationStatusResponse struct {
	PhoneVerified          bool      `json:"phoneVerified"`
	EmailVerified          bool      `json:"emailVerified"`
	IdentityVerified       bool      `json:"identityVerified"`
	OverallStatus          string    `json:"overallStatus"`      // verified, pending, rejected
	VerificationStatus     string    `json:"verificationStatus"` // alias for overall_status
	IdentityRejectedReason string    `json:"identityRejectedReason,omitempty"`
	UpdatedAt              time.Time `json:"updatedAt"`
}

// UploadVerificationDocumentRequest upload KYC document
type UploadVerificationDocumentRequest struct {
	DocumentType string `json:"documentType" binding:"required,oneof=identity_id pancard aadhar"`
	DocumentURL  string `json:"documentUrl" binding:"required,url"`
}

// ApproveVerificationRequest approve verification request
type ApproveVerificationRequest struct {
	EntityType string `json:"entityType" binding:"required,oneof=WORKER HIRER BUSINESS"`
	EntityID   string `json:"entityId" binding:"required,uuid"`
}

// RejectVerificationRequest reject verification request
type RejectVerificationRequest struct {
	EntityType string `json:"entityType" binding:"required,oneof=WORKER HIRER BUSINESS"`
	EntityID   string `json:"entityId" binding:"required,uuid"`
	Reason     string `json:"reason" binding:"required,max=1000"`
}

// ================ ADMIN DTOs ================

// AdminDashboardResponse admin dashboard stats
type AdminDashboardResponse struct {
	TotalUsers           int64   `json:"totalUsers"`
	TotalHirers          int64   `json:"totalHirers"`
	TotalWorkers         int64   `json:"totalWorkers"`
	TotalJobs            int64   `json:"totalJobs"`
	TotalApplications    int64   `json:"totalApplications"`
	ActiveSubscriptions  int64   `json:"activeSubscriptions"`
	Revenue              float64 `json:"revenue"`
	PendingVerifications int64   `json:"pendingVerifications"`
}

// AuditLogResponse admin action log view
type AuditLogResponse struct {
	ID             string                 `json:"id"`
	AdminID        string                 `json:"adminId"`
	Action         string                 `json:"action"`
	EntityType     string                 `json:"entityType"`
	EntityID       string                 `json:"entityId"`
	BeforeSnapshot map[string]interface{} `json:"beforeSnapshot"`
	AfterSnapshot  map[string]interface{} `json:"afterSnapshot"`
	ChangeReason   string                 `json:"changeReason"`
	CreatedAt      time.Time              `json:"createdAt"`
}

// ================ INSTANT JOB APPLICATION DTOs ================

// InstantJobApplicationRequest is the body for POST /worker/instant-apply
type InstantJobApplicationRequest struct {
	Name        string `json:"name" binding:"required"`
	Phone       string `json:"phone" binding:"required"`
	Role        string `json:"role" binding:"required"`
	Experience  string `json:"experience"`
	Location    string `json:"location"`
	CompanyName string `json:"companyName"`
}

// InstantJobApplicationResponse is returned after a successful submission
type InstantJobApplicationResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Phone       string    `json:"phone"`
	Role        string    `json:"role"`
	Experience  string    `json:"experience"`
	Location    string    `json:"location"`
	CompanyName string    `json:"companyName"`
	CreatedAt   time.Time `json:"createdAt"`
}
