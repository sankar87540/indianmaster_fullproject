# Production-Safe Database Error Handling - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Database Migration Strategy](#database-migration-strategy)
3. [Column Length Standards](#column-length-standards)
4. [Validation Architecture](#validation-architecture)
5. [Error Mapping Strategy](#error-mapping-strategy)
6. [API Response Standards](#api-response-standards)
7. [Zero-Downtime Deployment](#zero-downtime-deployment)
8. [Testing Strategy](#testing-strategy)
9. [Monitoring & Debugging](#monitoring--debugging)

---

## Overview

### The Problem
The application was returning "value too long for type character varying(5)" errors, which:
- Indicates insufficient database column sizes for input data
- Should be caught at validation layer (400 Bad Request), not database layer (500 Error)
- Indicates missing input validation

### The Solution
A multi-layered validation and error handling approach:
1. **Handler Layer** - Input validation using struct tags
2. **Repository Layer** - Enum validation and database error mapping
3. **Database Layer** - Constraints (CHECK, UNIQUE, NOT NULL, FOREIGN KEY)

---

## Database Migration Strategy

### Why Create New Migrations?
✅ **DO** Create new migration files
```
migrations/
├── 000006_new_entity_schema.up.sql
├── 000006_new_entity_schema.down.sql
├── 000007_fix_column_lengths_and_constraints.up.sql  ← NEW
└── 000007_fix_column_lengths_and_constraints.down.sql ← NEW
```

❌ **DO NOT** Modify existing migration files
- Breaking reproducibility
- Causes failed deployments in environments where migrations already ran
- Makes troubleshooting impossible

### Safe ALTER TABLE Strategy

#### For Adding Constraints (Always Safe)
```sql
ALTER TABLE users 
  ADD CONSTRAINT chk_users_role 
  CHECK (role IN ('ADMIN', 'WORKER', 'HIRER'));
```
✅ Safe - No data loss, non-blocking

#### For Increasing Column Size (Always Safe)
```sql
-- Increasing size is always safe
ALTER TABLE users 
  ALTER COLUMN language TYPE VARCHAR(10) USING language::VARCHAR(10);
```
✅ Safe - Existing data still valid, slight lock time on large tables

#### For Decreasing Column Size (Dangerous)
```sql
-- NEVER do this without validating existing data
ALTER TABLE users 
  ALTER COLUMN language TYPE VARCHAR(3) USING language::VARCHAR(3);
```
❌ Dangerous - Can fail if data exceeds new size
✅ If needed: Check for violations first with `SELECT * WHERE LENGTH(language) > 3`

### Migration Execution Order
```sql
-- Phase 1: Increase columns (safe, non-blocking)
ALTER TABLE users ALTER COLUMN language TYPE VARCHAR(10);

-- Phase 2: Add constraints (safe, non-blocking)
ALTER TABLE users ADD CONSTRAINT chk_users_language CHECK (...);

-- Phase 3: Create indices (builds in background on large tables)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone);
```

### Rollback Strategy
The down migration safely reverses changes:
```sql
-- Reduces column back to original size
ALTER TABLE users ALTER COLUMN language TYPE VARCHAR(5);

-- Drops constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_language;
```

---

## Column Length Standards

### Recommended Field Sizes

| Field | Type | Size | Rationale |
|-------|------|------|-----------|
| `id` (UUID) | VARCHAR | 36 | UUID format: `550e8400-e29b-41d4-a716-446655440000` |
| `phone` | VARCHAR | 20 | E.164: `+[1-3 digits][1-14 digits]` |
| `email` | VARCHAR | 254 | RFC 5321 specification |
| `full_name` | VARCHAR | 255 | Standard for human names |
| `role` | VARCHAR | 20 | Allows: ADMIN, WORKER, HIRER |
| `language` | VARCHAR | 10 | ISO 639-1 codes: 'en', 'hi', 'ta' (2-3 chars) |
| `business_name` | VARCHAR | 255 | Standard business name length |
| `city` | VARCHAR | 100 | Standard city name length |
| `state` | VARCHAR | 100 | Standard state name length |
| `address_text` | TEXT | unlimited | Full street address |
| `logo_url` | TEXT | unlimited | Full URL |
| `job_role` | VARCHAR | 100 | Job title/role name |
| `position` | VARCHAR | 200 | Full position description |

### Why These Sizes?

**Phone (20 chars)**
- E.164 format: `+{1-3 digits country}{1-14 digits number}`
- Max: `+999 99999999999` = 15 chars
- Buffer to 20 for safety

**Email (254 chars)**
- RFC 5321 specification
- Local part: 64 chars max
- `@` = 1 char
- Domain: 185 chars max
- Total: 250 chars, round to 254 for standard

**Names (255 chars)**
- MySQL standard VARCHAR(255)
- Handles longest real names with diacritics
- Matches industry standard

**Language (10 chars)**
- ISO 639-1: 2 chars minimum ('en', 'hi', 'ta')
- ISO 639-2: 3 chars maximum
- Buffer to 10 for flexibility

---

## Validation Architecture

### Three-Layer Validation

```
┌─────────────────────────────────────────────────┐
│ Layer 1: Handler (HTTP Binding/Validation)       │
│ - Uses go-playground/validator binding tags      │
│ - Returns 400 Bad Request                        │
│ - Catches: type mismatches, required fields      │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ Layer 2: Repository (Business Logic)             │
│ - Validates enum values                          │
│ - Checks foreign key relationships               │
│ - Maps database errors to app errors             │
│ - Returns 400/409/500 as appropriate             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│ Layer 3: Database (Data Constraints)             │
│ - CHECK constraints on enum fields               │
│ - UNIQUE constraints on identifiers              │
│ - NOT NULL constraints                           │
│ - FOREIGN KEY constraints                        │
└─────────────────────────────────────────────────┘
```

### Handler Layer - Struct Tags

```go
type CreateUserRequest struct {
    // Required, must match phone format
    Phone string `json:"phone" binding:"required,min=7,max=20,phone"`
    
    // Required, must be one of these exact values
    Role string `json:"role" binding:"required,oneof=ADMIN WORKER HIRER"`
    
    // Optional, if provided must be valid email
    Email string `json:"email" binding:"omitempty,email,max=254"`
    
    // Optional, if provided must be one of these
    Language string `json:"language" binding:"omitempty,oneof=en hi ta"`
}
```

### Common Validation Tags

```go
// Basic
`binding:"required"`           // Must be provided
`binding:"omitempty"`          // Optional

// Type/Format
`binding:"email"`              // Valid email format
`binding:"url"`                // Valid URL
`binding:"uuid"`               // Valid UUID
`binding:"phone"`              // Valid phone number (if validator registered)
`binding:"latitude"`           // Valid latitude (-90 to 90)
`binding:"longitude"`          // Valid longitude (-180 to 180)

// Length
`binding:"min=7,max=20"`       // String length range
`binding:"len=36"`             // Exact length

// Enum
`binding:"oneof=ADMIN WORKER HIRER"` // One of values with spaces
```

### Custom Phone Validator (if needed)

```go
// Register in main.go
func init() {
    if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
        v.RegisterValidation("phone", validatePhone)
    }
}

func validatePhone(fl validator.FieldLevel) bool {
    phone := fl.Field().String()
    // E.164 format: + followed by 1-15 digits
    // Or just digits for simple validation
    match := regexp.MustCompile(`^\+?[1-9]\d{1,14}$|^\d{7,20}$`).MatchString(phone)
    return match
}
```

---

## Error Mapping Strategy

### Error Mapping Table

| Database Error | HTTP Status | Error Code | Message |
|---|---|---|---|
| Unique constraint violation | 409 | CONFLICT | "duplicate entry already exists" |
| Check constraint violation | 400 | VALIDATION_ERROR | "invalid value for field: {field}" |
| Foreign key violation | 400 | FOREIGN_KEY_VIOLATION | "Invalid {field}: referenced {table} does not exist" |
| Not null violation | 400 | VALIDATION_ERROR | "required field missing: {field}" |
| Value too long | 400 | VALIDATION_ERROR | "value too long for field: {field}" |
| Connection error | 503 | SERVICE_UNAVAILABLE | "database connection failed" |
| Unknown error | 500 | INTERNAL_ERROR | "database operation failed" |

### Implementation

```go
// In repository
err := row.Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
if err != nil {
    // Maps to appropriate error with correct HTTP status
    return MapDatabaseError(err, "user creation")
}

// MapDatabaseError handles:
// - PostgreSQL error codes (23505, 23514, etc.)
// - String pattern matching for consistency
// - Context-aware error messages
// - Field name extraction from error messages
```

---

## API Response Standards

### Success Response (200/201)
```json
{
    "id": "aae356dd-8a2f-470b-bbee-3ebd5046c487",
    "phone": "+919876543210",
    "full_name": "Test User",
    "email": "test@example.com",
    "role": "ADMIN",
    "language": "en",
    "is_active": true,
    "created_at": "2026-02-25T08:11:42.65565Z",
    "updated_at": "2026-02-25T08:11:42.65565Z"
}
```

### Validation Error (400 Bad Request)
```json
{
    "error": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": "Key: 'CreateUserRequest.Role' Error:Field validation for 'Role' failed on the 'oneof' tag"
}
```

### Constraint Violation (400 Bad Request)
```json
{
    "error": "VALIDATION_ERROR",
    "message": "value too long for field: language",
    "details": {
        "field": "language",
        "error": "value_too_long"
    }
}
```

### Duplicate Entry (409 Conflict)
```json
{
    "error": "CONFLICT",
    "message": "duplicate entry: user creation already exists"
}
```

### Not Found (404)
```json
{
    "error": "NOT_FOUND",
    "message": "record with id 123 not found"
}
```

### Server Error (500 Internal Server Error)
```json
{
    "error": "INTERNAL_ERROR",
    "message": "database operation failed"
}
```

**Note:** Internal database errors are NOT exposed in production responses for security.

---

## Zero-Downtime Deployment

### Deployment Strategy

#### Step 1: Prepare (Take 5 minutes)
```bash
# On staging environment, test the migration
migrate -path migrations -database "postgres://..." up

# Verify no data loss
SELECT COUNT(*) FROM users;
```

#### Step 2: Blue-Green Deployment

**Blue (Old Version Running)**
```
Load Balancer → Old App (v1)
                └─ Old Schema
```

**Green (New Version Staging)**
```
Load Balancer → Old App (v1)
                New App (v2) [staged, not receiving traffic]
                └─ New Schema
```

**Cutover (Atomic)**
```
Load Balancer → New App (v2) [switched, receiving all traffic]
                └─ New Schema
```

#### Step 3: Deployment Steps

```bash
# 1. Run migration on production database
# Migrations are backward compatible, so old code can still run
migrate -path migrations -database "postgres://prod-db" up

# 2. Deploy new application code
# Old code still works with new schema (backward compatible)
docker push myapp:v2
kubectl set image deployment/myapp myapp=myapp:v2

# 3. Monitor for issues
# If anything goes wrong, can rollback:
# a) Scale down new version
# b) Fall back to old version
# c) Old version works with new schema

# 4. Clean up (optional, after 24 hours)
# Remove old version pods
kubectl scale deployment/myapp-old --replicas=0
```

### Why This Works

1. **Migrations are backward compatible**
   - Only increases column sizes
   - Only adds constraints (doesn't break old data)
   - Old code can read new schema

2. **Code is backward compatible**
   - New validation doesn't affect database layer
   - Error handling improvements are transparent
   - Old code still works with new constraints

3. **No downtime** because both versions work with new schema

### Rollback Plan (if needed)

```bash
# 1. If new version has bugs, immediately switch back to old version
kubectl set image deployment/myapp myapp=myapp:v1

# 2. Old version works fine with new schema
# (columns are bigger, constraints are looser than needed)

# 3. Fix and redeploy v2, then migrate down if needed
# But we don't recommend migrating down - just revert code
```

### Large Table Considerations

For tables with millions of rows:

```sql
-- Use CONCURRENTLY for index creation (no table lock)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone);

-- For column changes, temporary blocking is brief due to modern PostgreSQL
-- ALTER TYPE operations are fast for size increases

-- Monitor during migration:
-- SELECT * FROM pg_stat_activity WHERE state = 'active';
```

---

## Testing Strategy

### Unit Tests - Handler Layer

```go
func TestCreateUserValidation(t *testing.T) {
    tests := []struct {
        name       string
        req        models.CreateUserRequest
        wantStatus int
        wantError  string
    }{
        {
            name:       "valid request",
            req:        models.CreateUserRequest{
                Phone:    "+919876543210",
                Role:     "ADMIN",
                Language: "en",
            },
            wantStatus: 201,
        },
        {
            name:       "missing phone",
            req:        models.CreateUserRequest{
                Role: "ADMIN",
            },
            wantStatus: 400,
            wantError:  "phone is required",
        },
        {
            name:       "invalid role",
            req:        models.CreateUserRequest{
                Phone: "+919876543210",
                Role:  "INVALID",
            },
            wantStatus: 400,
            wantError:  "oneof",
        },
        {
            name:       "invalid language",
            req:        models.CreateUserRequest{
                Phone:    "+919876543210",
                Role:     "ADMIN",
                Language: "INVALID",
            },
            wantStatus: 400,
            wantError:  "oneof",
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Create request and test handler
            // Verify status code and error message
        })
    }
}
```

### Integration Tests - Database

```go
func TestCreateUserDatabaseConstraints(t *testing.T) {
    tests := []struct {
        name       string
        user       *models.User
        wantError  string
        wantStatus int
    }{
        {
            name: "duplicate phone",
            user: &models.User{
                ID:       "new-id",
                Phone:    "+919876543210", // Already exists
                Role:     "ADMIN",
            },
            wantError:  "CONFLICT",
            wantStatus: 409,
        },
        {
            name: "invalid role in database",
            user: &models.User{
                Phone: "+919876543211",
                Role:  "INVALID", // Violates CHECK constraint
            },
            wantError:  "VALIDATION_ERROR",
            wantStatus: 400,
        },
    }
}
```

### Load Tests

```bash
# Test with various phone number lengths
ab -n 1000 -c 10 -p data.json http://localhost:8080/api/v1/users

# Test error rates under load
locust -f locustfile.py --host http://localhost:8080
```

---

## Monitoring & Debugging

### Database Logs

```sql
-- Check for constraint violations
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%CHECK%' 
ORDER BY calls DESC;

-- Monitor slow queries
SELECT query, calls, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check active connections
SELECT * FROM pg_stat_activity 
WHERE state = 'active';
```

### Application Logs

```go
// Log database errors for debugging
log.Printf("DATABASE ERROR in Create: %v", err)

// Log validation failures
log.Printf("VALIDATION ERROR: %s", err.Error())

// Monitor error rates
prometheus.DBErrorCounter.Inc()
prometheus.ValidationErrorCounter.Inc()
```

### Structured Logging (Recommended)

```go
import "github.com/sirupsen/logrus"

log.WithFields(logrus.Fields{
    "operation": "create_user",
    "phone": user.Phone,
    "error": err.Error(),
    "error_code": pgErr.Code,
    "constraint": pgErr.Constraint,
}).Error("database error")
```

### Health Checks

```go
// In handlers
router.GET("/health/db", func(c *gin.Context) {
    err := db.PingContext(context.Background())
    if err != nil {
        c.JSON(500, gin.H{"status": "unhealthy", "error": err.Error()})
        return
    }
    c.JSON(200, gin.H{"status": "healthy"})
})
```

---

## Summary: Production Checklist

- [ ] Database migration files created (000007_*.sql)
- [ ] Column sizes increased appropriately
- [ ] Constraints added to database
- [ ] Request DTOs created with validation tags (models/requests.go)
- [ ] Handler updated to use DTOs (handlers/user_handler.go)
- [ ] Error mapper created (repositories/error_mapper.go)
- [ ] Repository updated to use error mapper
- [ ] Tests written for validation layer
- [ ] Integration tests for database constraints
- [ ] Load tests run and passing
- [ ] Monitoring/logging in place
- [ ] Deployment plan reviewed
- [ ] Rollback plan documented
- [ ] Feature flagged for gradual rollout (optional)
- [ ] Alert thresholds configured

---

## Questions?

Review the error handling in these files:
- [handlers/user_handler.go](../handlers/user_handler.go)
- [repositories/error_mapper.go](../repositories/error_mapper.go)
- [repositories/user.go](../repositories/user.go)
- [models/requests.go](../models/requests.go)
- [errors/errors.go](../errors/errors.go)
