# Swagger API Documentation Setup

## Overview
This project now includes comprehensive Swagger/OpenAPI documentation for all API endpoints. The documentation is automatically generated from code annotations and can be accessed via a web UI.

## Project Information
- **Title**: Indian Master API
- **Version**: 1.0
- **Base Path**: `/api/v1`
- **Schemes**: HTTP and HTTPS
- **Description**: Backend APIs for Indian Master Application - A comprehensive platform for job seekers and hirers in India

## Accessing Swagger UI

Once the application is running, you can access the interactive Swagger UI at:

```
http://localhost:8080/swagger/index.html
```

The Swagger UI provides:
- Interactive API documentation
- Test endpoints directly from the browser
- Request/response examples
- Parameter validation
- Authentication token support

## Generated Endpoints Documentation (20 Total)

### Worker Endpoints
1. **POST** `/worker/profile` - Create Worker Profile
2. **GET** `/worker/profile` - Get Worker Profile
3. **PUT** `/worker/profile` - Update Worker Profile
4. **GET** `/worker/profile/verification/{worker_id}` - Get Verification Status

### Job Endpoints
5. **POST** `/hirer/jobs` - Create Job Posting
6. **GET** `/jobs/feed` - Get Jobs Feed
7. **GET** `/jobs/{job_id}` - Get Job Details
8. **PUT** `/hirer/jobs/{job_id}` - Update Job Posting

### Application Endpoints
9. **POST** `/applications` - Apply to Job
10. **PUT** `/admin/applications/{application_id}/status` - Update Application Status
11. **GET** `/applications/my-applications` - Get My Applications

### Chat Endpoints
12. **POST** `/chat/threads` - Get or Create Chat Thread
13. **POST** `/chat/threads/{thread_id}/messages` - Send Chat Message
14. **GET** `/chat/threads/{thread_id}/messages` - Get Chat Messages

### Subscription Endpoints
15. **POST** `/subscriptions` - Create Subscription
16. **GET** `/subscriptions/active` - Get Active Subscription
17. **GET** `/subscriptions/contact-limit` - Check Contact Limit

### Notification Endpoints
18. **GET** `/notifications` - Get Notifications

### Admin Endpoints
19. **POST** `/admin/verification/approve` - Approve Verification
20. **POST** `/admin/verification/reject` - Reject Verification

## Files Generated and Modified

### New Generated Files
- **`docs/docs.go`** - Generated Go documentation file
- **`docs/swagger.json`** - OpenAPI 2.0 specification in JSON format
- **`docs/swagger.yaml`** - OpenAPI 2.0 specification in YAML format

### Modified Files
- **`cmd/main.go`** - Added Swagger annotations and route handler
- **`go.mod`** - Added swaggo dependencies
- **`internal/handlers/all_handlers.go`** - Added detailed Swagger annotations to all handler functions

### Dependencies Added
```go
github.com/swaggo/files v1.0.1
github.com/swaggo/gin-swagger v1.6.1
github.com/swaggo/swag v1.16.6
```

## Swagger Annotations Structure

Each API endpoint includes comprehensive documentation:

```go
// @Summary Create Worker Profile
// @Description Create a new worker profile for the authenticated user
// @Tags Worker
// @Accept json
// @Produce json
// @Param request body dto.CreateWorkerProfileRequest true "Worker profile details"
// @Success 201 {object} dto.APIResponse "Worker profile created successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Internal server error"
// @Router /worker/profile [post]
// @Security BearerAuth
```

## Authentication

All endpoints (except health check and Swagger UI) require Bearer token authentication:

```
Authorization: Bearer <your_jwt_token>
```

The Swagger UI includes a way to specify your authentication token for testing endpoints.

## Running the Swagger Init Command

If you make changes to the handler annotations, regenerate the Swagger documentation:

```bash
cd myapp
swag init -g cmd/main.go
```

This will:
- Parse all Go files in the project
- Extract Swagger comments
- Generate updated `docs/docs.go`, `docs/swagger.json`, and `docs/swagger.yaml`

## API Response Format

All API responses follow a standardized structure:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "id": "123",
    "name": "John Doe"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "data": [...],
    "total": 100,
    "page": 1,
    "limit": 20,
    "total_pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Operation failed",
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request body",
    "details": {...}
  }
}
```

## Testing Endpoints

1. Start the application:
   ```bash
   cd myapp
   go run cmd/main.go
   ```

2. Open Swagger UI in browser:
   ```
   http://localhost:8080/swagger/index.html
   ```

3. Use the interactive UI to:
   - View detailed API documentation
   - See request/response examples
   - Test endpoints with sample data
   - Verify authentication flows

## Best Practices

1. **Keep Annotations Updated**: When adding new endpoints, always add Swagger annotations
2. **Consistent Tags**: Use consistent tags for grouping related endpoints
3. **Clear Descriptions**: Provide clear summaries and descriptions for each endpoint
4. **Document Parameters**: Always document all path parameters, query parameters, and request body
5. **Error Codes**: Document all possible error responses with appropriate HTTP status codes
6. **Security Annotations**: Include `@Security` annotations for protected endpoints

## Troubleshooting

### Swagger UI not loading
- Ensure the Swagger files are generated: `swag init -g cmd/main.go`
- Check that `docs.go` is imported in main.go with `_ "myapp/docs"`
- Verify the route is correctly configured in `main.go`

### Annotations not picked up
- Make sure annotations are directly above the function definition
- Check for typos in the `@Router` paths
- Ensure DTO types are properly defined and exported

### Port conflicts
- Change the port in environment variables: `APP_PORT=9090`
- Access Swagger UI at the new port: `http://localhost:9090/swagger/index.html`

## Next Steps

1. **Add Integration Tests**: Test all endpoints with the Swagger documentation
2. **Set Up CI/CD**: Generate Swagger docs as part of your build pipeline
3. **API Versioning**: As APIs evolve, update the version in main.go
4. **Security Documentation**: Add OAuth2 or other security schemes as needed

## Resources

- [Swag GitHub Repository](https://github.com/swaggo/swag)
- [Gin-Swagger Package](https://github.com/swaggo/gin-swagger)
- [OpenAPI 2.0 Specification](https://swagger.io/specification/v2/)
- [Swagger Annotation Guide](https://github.com/swaggo/swag/blob/master/README.md)
