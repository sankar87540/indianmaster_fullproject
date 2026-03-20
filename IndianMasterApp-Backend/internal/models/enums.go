package models

// ================ USER ROLES ================
const (
	RoleWorker = "WORKER"
	RoleHirer  = "HIRER"
	RoleAdmin  = "ADMIN"
)

// ================ LANGUAGES ================
const (
	LangEnglish = "en"
	LangHindi   = "hi"
	LangTamil   = "ta"
)

// ================ JOB STATUS ================
const (
	JobStatusDraft   = "DRAFT"
	JobStatusOpen    = "OPEN"
	JobStatusPaused  = "PAUSED"
	JobStatusClosed  = "CLOSED"
	JobStatusFilled  = "FILLED"
	JobStatusExpired = "EXPIRED"
)

// ================ APPLICATION STATUS ================
const (
	ApplicationStatusPending     = "pending"
	ApplicationStatusShortlisted = "shortlisted"
	ApplicationStatusRejected    = "rejected"
	ApplicationStatusAccepted    = "accepted"
	ApplicationStatusWithdrawn   = "withdrawn"
)

// ================ SUBSCRIPTION STATUS ================
const (
	SubscriptionStatusPending   = "PENDING"
	SubscriptionStatusActive    = "ACTIVE"
	SubscriptionStatusExpired   = "EXPIRED"
	SubscriptionStatusCancelled = "CANCELLED"
	SubscriptionStatusRefunded  = "REFUNDED"
)

// ================ SUBSCRIPTION PLANS ================
const (
	PlanFree       = "FREE"
	PlanBasic      = "BASIC"
	PlanPremium    = "PREMIUM"
	PlanEnterprise = "ENTERPRISE"
)

// ================ VERIFICATION STATUS ================
const (
	VerificationStatusPending  = "pending"
	VerificationStatusVerified = "verified"
	VerificationStatusRejected = "rejected"
)

// ================ NOTIFICATION TYPES ================
const (
	NotificationTypeNewApplication     = "NEW_APPLICATION"
	NotificationTypeAppStatusChange    = "APP_STATUS_CHANGE"
	NotificationTypeJobMatch           = "JOB_MATCH"
	NotificationTypeChatMessage        = "CHAT_MESSAGE"
	NotificationTypeSubscriptionExpiry = "SUBSCRIPTION_EXPIRY"
	NotificationTypeKYCApproved        = "KYC_APPROVED"
	NotificationTypeKYCRejected        = "KYC_REJECTED"
)

// ================ AUDIT ACTIONS ================
const (
	AuditActionCreated       = "CREATED"
	AuditActionUpdated       = "UPDATED"
	AuditActionDeleted       = "DELETED"
	AuditActionApproved      = "APPROVED"
	AuditActionRejected      = "REJECTED"
	AuditActionSuspended     = "SUSPENDED"
	AuditActionActivated     = "ACTIVATED"
	AuditActionBanned        = "BANNED"
	AuditActionStatusChanged = "STATUS_CHANGED"
)

// ================ AUDIT ENTITY TYPES ================
const (
	EntityTypeUser                 = "user"
	EntityTypeWorker               = "worker"
	EntityTypeBusiness             = "business"
	EntityTypeJob                  = "job"
	EntityTypeApplication          = "application"
	EntityTypeSubscription         = "subscription"
	EntityTypeChatThread           = "chat_thread"
	EntityTypeWorkerVerification   = "worker_verification"
	EntityTypeBusinessVerification = "business_verification"
)

// ================ WORK TYPES ================
const (
	WorkTypeFullTime    = "FullTime"
	WorkTypePartTime    = "PartTime"
	WorkTypeFreelance   = "Freelance"
	WorkTypeContractual = "Contractual"
)

// ================ AVAILABILITY ================
const (
	AvailabilityMorning   = "Morning"
	AvailabilityAfternoon = "Afternoon"
	AvailabilityEvening   = "Evening"
	AvailabilityNight     = "Night"
	AvailabilityFlexible  = "Flexible"
	AvailabilityWeekends  = "Weekends"
)

// ================ BUSINESS TYPES ================
const (
	BusinessTypeRestaurant = "Restaurant"
	BusinessTypeCafe       = "Cafe"
	BusinessTypeBakery     = "Bakery"
	BusinessTypeHotel      = "Hotel"
	BusinessTypeBarPub     = "BarPub"
	BusinessTypeCanteen    = "Canteen"
	BusinessTypeFoodTruck  = "FoodTruck"
)

// ================ COMMON JOB ROLES ================
const (
	JobRoleChef          = "Chef"
	JobRoleCook          = "Cook"
	JobRoleParottaMaster = "ParottaMaster"
	JobRoleWaiter        = "Waiter"
	JobRoleHelper        = "Helper"
	JobRoleCleaner       = "Cleaner"
	JobRoleDeliveryStaff = "DeliveryStaff"
	JobRoleBarista       = "Barista"
	JobRoleKitchenHelper = "KitchenHelper"
	JobRoleManager       = "Manager"
)

// ================ COMMON BENEFITS ================
const (
	BenefitHealthInsurance = "HealthInsurance"
	BenefitMeal            = "Meal"
	BenefitAccommodation   = "Accommodation"
	BenefitTransport       = "Transport"
	BenefitBonus           = "Bonus"
	BenefitLeaves          = "Leaves"
	BenefitUniform         = "Uniform"
	BenefitTraining        = "Training"
)

// ================ CONTACT LIMIT DEFAULTS BY PLAN ================
const (
	ContactLimitFree       = 5
	ContactLimitBasic      = 20
	ContactLimitPremium    = 100
	ContactLimitEnterprise = 1000
)

// ================ SUBSCRIPTION PRICING (in INR paise) ================
const (
	PricePlanBasic      = 99900  // Rs. 999
	PricePlanPremium    = 299900 // Rs. 2999
	PricePlanEnterprise = 999900 // Rs. 9999
)

// ================ SUBSCRIPTION DURATION (in days) ================
const (
	DurationMonthly    = 30
	DurationQuarterly  = 90
	DurationHalfYearly = 180
	DurationYearly     = 365
)

// ================ ERROR CODES ================
const (
	ErrorCodeInvalidRequest       = "INVALID_REQUEST"
	ErrorCodeUnauthorized         = "UNAUTHORIZED"
	ErrorCodeForbidden            = "FORBIDDEN"
	ErrorCodeNotFound             = "NOT_FOUND"
	ErrorCodeConflict             = "CONFLICT"
	ErrorCodeValidationFailed     = "VALIDATION_FAILED"
	ErrorCodeInternalServer       = "INTERNAL_SERVER_ERROR"
	ErrorCodeDuplicateApplication = "DUPLICATE_APPLICATION"
	ErrorCodeDuplicateSavedJob    = "DUPLICATE_SAVED_JOB"
	ErrorCodeSubscriptionRequired = "SUBSCRIPTION_REQUIRED"
	ErrorCodeContactLimitExceeded = "CONTACT_LIMIT_EXCEEDED"
	ErrorCodeKYCPending           = "KYC_PENDING"
	ErrorCodeKYCRejected          = "KYC_REJECTED"
)
