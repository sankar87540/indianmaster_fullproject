# Quick Reference: Error Handling & Validation

## For API Users

### Creating a User - Valid Examples

```bash
# ✅ Correct
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "full_name": "Rajesh Kumar",
    "role": "WORKER",
    "language": "hi",
    "email": "rajesh@example.com"
  }'

# Response 201 Created
{
    "id": "aae356dd-8a2f-470b-bbee-3ebd5046c487",
    "phone": "+919876543210",
    "full_name": "Rajesh Kumar",
    "role": "WORKER",
    "language": "hi",
    "email": "rajesh@example.com",
    "is_active": true,
    "created_at": "2026-02-25T08:11:42.655Z",
    "updated_at": "2026-02-25T08:11:42.655Z"
}
```

### Common Errors & Fixes

#### Error 400: Missing Required Field
```bash
# ❌ This fails
{
    "full_name": "Test User",
    "role": "WORKER"
}

# 📝 Response
{
    "error": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": "Key: 'CreateUserRequest.Phone' Error:Field validation for 'Phone' failed on the 'required' tag"
}

# ✅ Fix: Add required field
{
    "phone": "+919876543210",
    "full_name": "Test User",
    "role": "WORKER"
}
```

#### Error 400: Invalid Enum Value
```bash
# ❌ This fails (role must be ADMIN, WORKER, or HIRER)
{
    "phone": "+919876543210",
    "role": "admin"
}

# 📝 Response
{
    "error": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": "Key: 'CreateUserRequest.Role' Error:Field validation for 'Role' failed on the 'oneof' tag"
}

# ✅ Fix: Use uppercase
{
    "phone": "+919876543210",
    "role": "ADMIN"
}
```

#### Error 400: Value Too Long
```bash
# ❌ Before fix (would fail with 500)
{
    "phone": "+919876543210",
    "language": "this_is_a_very_long_language_code"
}

# 📝 Response (now returns 400)
{
    "error": "VALIDATION_ERROR",
    "message": "value too long for field: language",
    "details": {
        "field": "language",
        "error": "value_too_long"
    }
}

# ✅ Fix: Use valid language codes
{
    "phone": "+919876543210",
    "language": "en"  // or "hi" or "ta"
}
```

#### Error 409: Duplicate Phone
```bash
# ❌ Phone already exists
{
    "phone": "+919876543210",  // Already in database
    "role": "WORKER"
}

# 📝 Response
{
    "error": "CONFLICT",
    "message": "duplicate entry: user creation already exists"
}

# ✅ Fix: Use a different phone
{
    "phone": "+919876543211",
    "role": "WORKER"
}
```

#### Error 500: Unknown Database Error
```json
{
    "error": "INTERNAL_ERROR",
    "message": "database operation failed"
}
```
- This indicates an unexpected database issue
- Check application logs for details
- Contact development team

---

## For Developers

### Adding New Validation

#### Step 1: Update the DTO (models/requests.go)
```go
type CreateUserRequest struct {
    Phone string `json:"phone" binding:"required,min=7,max=20"`
    Role  string `json:"role" binding:"required,oneof=ADMIN WORKER HIRER"`
}
```

#### Step 2: Available Validation Tags
```go
// Required vs Optional
`binding:"required"`           // Must be present
`binding:"omitempty"`          // Optional

// Length constraints
`binding:"min=7"`              // Minimum
`binding:"max=255"`            // Maximum
`binding:"len=36"`             // Exact length

// Format validation
`binding:"email"`              // Email format
`binding:"url"`                // URL format
`binding:"uuid"`               // UUID format
`binding:"numeric"`            // Numbers only
`binding:"alpha"`              // Letters only
`binding:"phone"`              // Phone format (custom)

// Enum validation
`binding:"oneof=en hi ta"`     // One of these values (space separated)

// Combining multiple
`binding:"required,email,max=254"`
`binding:"omitempty,oneof=ADMIN WORKER HIRER"`
```

#### Step 3: Test It
```bash
curl -X POST http://localhost:8080/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "invalid",
    "role": "INVALID"
  }'

# Should return 400 (not 500)
```

### Handling Database Errors

#### In Repository
```go
err := row.Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
if err != nil {
    // Maps to appropriate HTTP status
    return MapDatabaseError(err, "user creation")
}
```

#### Error Mapping Behavior
| Database Error | Maps To | HTTP Status |
|---|---|---|
| `value too long for type` | VALIDATION_ERROR | 400 |
| `violates check constraint` | VALIDATION_ERROR | 400 |
| `violates unique constraint` | CONFLICT | 409 |
| `violates foreign key` | FOREIGN_KEY_VIOLATION | 400 |
| `null value in column` | VALIDATION_ERROR | 400 |
| Connection error | SERVICE_UNAVAILABLE | 503 |
| Unknown | INTERNAL_ERROR | 500 |

### Adding New Database Constraint

#### Step 1: Create Migration (NEVER modify old ones!)
```bash
# File: migrations/000008_add_status_constraint.up.sql
ALTER TABLE jobs 
  ADD CONSTRAINT chk_jobs_status_enum 
  CHECK (status IN ('OPEN', 'CLOSED', 'FILLED'));
```

#### Step 2: Create Rollback
```bash
# File: migrations/000008_add_status_constraint.down.sql
ALTER TABLE jobs 
  DROP CONSTRAINT IF EXISTS chk_jobs_status_enum;
```

#### Step 3: Add to DTO
```go
type CreateJobRequest struct {
    Status string `json:"status" binding:"oneof=OPEN CLOSED FILLED"`
}
```

#### Step 4: Add to Repository Validation
```go
if status != "" {
    validStatuses := []string{"OPEN", "CLOSED", "FILLED"}
    // Check if status is in validStatuses
}
```

### Structure of Error Responses

#### Handler returns error
```go
if err := h.userService.CreateUser(c.Request.Context(), user); err != nil {
    handleError(c, err)  // Converts AppError to JSON
    return
}
```

#### HandlerError function
```go
func handleError(c *gin.Context, err error) {
    appErr, ok := err.(*errors.AppError)
    if !ok {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
        return
    }

    c.JSON(appErr.StatusCode(), gin.H{
        "error": appErr.Code,
        "message": appErr.Message,
        "details": appErr.Details,
    })
}
```

### Debugging Tips

#### Enable Database Logging
```go
// In database initialization
db.SetConnMaxLifetime(time.Minute * 3)
log.Printf("Connected to database")
```

#### Check Migration Status
```bash
# Run migrations
./scripts/migrate.sh

# Check current migration
SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;
```

#### Test Queries in psql
```bash
# Connect to database
psql -h localhost -p 5433 -U postgres -d myapp

# Check constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'CHECK';

# Test constraint
INSERT INTO users (id, phone, role) 
VALUES ('test-id', '+919876543210', 'INVALID_ROLE');
-- Should fail with: violates check constraint
```

---

## Deployment Checklist

```bash
# 1. Test locally
go test ./...

# 2. Run integration tests
go test -tags=integration ./...

# 3. Test API endpoints
./test_api.sh

# 4. Deploy to staging
docker build -t myapp:dev .
docker run ... myapp:dev

# 5. Run migrations on staging
migrate -path migrations -database "postgres://staging-db" up

# 6. Test on staging
curl -X POST http://staging.example.com/api/v1/users ...

# 7. Deploy to production
# Use your CI/CD pipeline
# (Blue-green deployment recommended)

# 8. Monitor
# Check logs and metrics
# Verify error rates are not elevated
```

---

## Key Files Modified

| File | Change | Why |
|------|--------|-----|
| `migrations/000007_*.sql` | New migration | Fix column lengths safely |
| `models/requests.go` | New file | Input validation DTOs |
| `handlers/user_handler.go` | Updated | Use validation DTOs |
| `repositories/error_mapper.go` | New file | Map DB errors to HTTP |
| `repositories/user.go` | Updated | Use error mapper |
| `.env` | Updated | Use localhost for dev |

---

## Common Questions

**Q: Why 400 instead of 500 for database errors?**
A: 400 (Bad Request) = client's fault. If data validation fails at database tier, it means client sent invalid data.

**Q: Can I modify old migrations?**
A: NO. This breaks reproducibility. Always create new migration files.

**Q: What about existing data that violates new constraints?**
A: The migration safely checks existing data before adding constraints. If violation found, migration fails (use ON CONFLICT strategy).

**Q: How long does migration take?**
A: For column increases: seconds to minutes depending on table size. For constraint additions: seconds.

**Q: Can I rollback the migration?**
A: Yes, use `.down.sql` files. But we recommend keeping migrations and just fixing code if needed.

---

**Need help?** Check:
- `PRODUCTION_ERROR_HANDLING.md` - Complete guide
- `models/requests.go` - Validation examples
- `repositories/error_mapper.go` - Error mapping logic
- Database logs for constraint violation details
