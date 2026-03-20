# Swagger Documentation - Quick Reference

## ✅ What's Been Done

Your Go backend now has comprehensive Swagger API documentation with:

✓ **20 API endpoints** fully documented
✓ **Interactive Swagger UI** for testing endpoints
✓ **Complete request/response specifications**
✓ **Authentication support** with Bearer tokens
✓ **Error response documentation**
✓ **Pagination support** documentation
✓ **Auto-generated docs** from code annotations

## 📍 How to Access

1. **Start the application:**
   ```bash
   cd myapp
   go run cmd/main.go
   ```

2. **Open in browser:**
   ```
   http://localhost:8080/swagger/index.html
   ```

## 🔧 Swagger Integration Points

### Files Modified
1. **`cmd/main.go`**
   - Added Swagger annotations with API metadata
   - Imported `myapp/docs` package
   - Added Swagger UI routes

2. **`go.mod`**
   - Added three Swagger dependencies

3. **`internal/handlers/all_handlers.go`**
   - Added comprehensive Swagger annotations to all 20 handler functions

### Files Generated
- `docs/docs.go` - Embedded documentation (DO NOT EDIT)
- `docs/swagger.json` - OpenAPI specification
- `docs/swagger.yaml` - OpenAPI specification
- `SWAGGER_SETUP.md` - Complete documentation guide

## 📝 Annotation Pattern Used

Every handler function follows this pattern:

```go
// FunctionName godoc
// @Summary Brief description
// @Description Detailed description
// @Tags CategoryName
// @Accept json
// @Produce json
// @Param paramName path/query string true "Description"
// @Success 200 {object} dto.APIResponse "Success message"
// @Failure 400 {object} dto.APIResponse "Error message"
// @Router /path/{param} [method]
// @Security BearerAuth
func (h *Handler) FunctionName(c *gin.Context) {
    // implementation
}
```

## 🚀 Adding New Endpoints

When adding new endpoints:

1. **Create handler function with annotations:**
   ```go
   // GetUser godoc
   // @Summary Get User Information
   // @Description Retrieve user profile
   // @Tags User
   // @Accept json
   // @Produce json
   // @Param id path string true "User ID"
   // @Success 200 {object} dto.APIResponse "User retrieved"
   // @Failure 404 {object} dto.APIResponse "User not found"
   // @Router /users/{id} [get]
   // @Security BearerAuth
   func (h *UserHandler) GetUser(c *gin.Context) {
       // implementation
   }
   ```

2. **Regenerate docs:**
   ```bash
   cd myapp
   swag init -g cmd/main.go
   ```

3. **Rebuild and test:**
   ```bash
   go build -o bin/app cmd/main.go
   go run cmd/main.go
   ```

4. **View in Swagger UI:** `http://localhost:8080/swagger/index.html`

## 📊 Documented Endpoints Summary

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/worker/profile` | Create worker profile |
| GET | `/worker/profile` | Get worker profile |
| PUT | `/worker/profile` | Update worker profile |
| GET | `/worker/profile/verification/{id}` | Get verification status |
| POST | `/hirer/jobs` | Create job posting |
| GET | `/jobs/feed` | Get jobs feed with filters |
| GET | `/jobs/{id}` | Get job details |
| PUT | `/hirer/jobs/{id}` | Update job posting |
| POST | `/applications` | Apply to job |
| PUT | `/admin/applications/{id}/status` | Update application status |
| GET | `/applications/my-applications` | Get user's applications |
| POST | `/chat/threads` | Create/get chat thread |
| POST | `/chat/threads/{id}/messages` | Send message |
| GET | `/chat/threads/{id}/messages` | Get messages |
| POST | `/subscriptions` | Create subscription |
| GET | `/subscriptions/active` | Get active subscription |
| GET | `/subscriptions/contact-limit` | Check contact limit |
| GET | `/notifications` | Get notifications |
| POST | `/admin/verification/approve` | Approve verification |
| POST | `/admin/verification/reject` | Reject verification |

## 🔐 Authentication

All endpoints (except `/health` and `/swagger/*`) require:

```
Authorization: Bearer <JWT_TOKEN>
```

In Swagger UI:
1. Click the "Authorize" button at the top
2. Enter: `Bearer <your_token>`
3. Click "Authorize"

## 💡 Common Swagger Annotations

```go
// Basic endpoint
// @Router /users [get]

// Path parameters
// @Param id path string true "User ID"

// Query parameters
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)

// Request body
// @Param request body dto.CreateUserRequest true "User details"

// Responses
// @Success 200 {object} dto.APIResponse "Success response"
// @Failure 400 {object} dto.APIResponse "Bad request"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Server error"

// Security
// @Security BearerAuth
// @Security ApiKeyAuth

// Tags for grouping
// @Tags User
// @Tags Job
// @Tags Admin
```

## ⚙️ Configuration

Swagger metadata is defined in `cmd/main.go`:

```go
// @title Indian Master API
// @version 1.0
// @description Backend APIs for Indian Master Application
// @basePath /api/v1
// @schemes http https
// @securityDefinitions.apikey Bearer
//     @in header
//     @name Authorization
```

To update:
- API Title: Change `@title`
- API Version: Change `@version`
- Description: Change `@description`
- Base Path: Change `@basePath`

Then run: `swag init -g cmd/main.go`

## 🧪 Testing Example

Using curl to test an endpoint:

```bash
# Get worker profile
curl -X GET "http://localhost:8080/api/v1/worker/profile" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Create application
curl -X POST "http://localhost:8080/api/v1/applications" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id": "123"}'
```

## 📚 Documentation References

- **Swagger Setup**: See `SWAGGER_SETUP.md` for complete details
- **Swagger Docs**: `https://swagger.io`
- **Swag GitHub**: `https://github.com/swaggo/swag`
- **Gin-Swagger**: `https://github.com/swaggo/gin-swagger`

## ✨ Features Included

✓ **Interactive API Testing** - Test requests directly from UI
✓ **Request/Response Examples** - See exact formats
✓ **Parameter Validation** - Ensure correct data types
✓ **Error Documentation** - Understand possible failures
✓ **Search Functionality** - Find endpoints quickly
✓ **Authentication UI** - Include bearer tokens easily
✓ **Export Options** - Download as JSON/YAML

## 🛠️ Troubleshooting

**Issue**: Swagger UI returns 404
- Solution: Check that `docs.go` is imported with `_ "myapp/docs"`

**Issue**: Endpoints not showing in UI
- Solution: Run `swag init -g cmd/main.go` to regenerate, then rebuild

**Issue**: Wrong request body format
- Solution: Check the DTO struct definition in `internal/dto/`

**Issue**: Authentication not working
- Solution: Ensure `@Security BearerAuth` is in the annotation

## 📋 Checklist for Production

- [ ] Swagger documentation is up to date
- [ ] All endpoints have proper annotations
- [ ] Error responses are documented
- [ ] Security annotations are correct
- [ ] Version number reflects API version
- [ ] Base path matches your API structure
- [ ] All examples are accurate
- [ ] Response types are correct DTOs

---

**Last Updated**: March 5, 2026
**Swagger Version**: OpenAPI 2.0 (Swagger 2.0)
**Total Endpoints Documented**: 20
