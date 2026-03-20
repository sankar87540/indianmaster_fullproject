# JHB API Documentation

JHB (Job Holder/Staff) Management API built with Go, Gin Framework, and PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Running with Docker](#running-with-docker)
- [Database Schema](#database-schema)

---

## Overview

The JHB API provides a complete REST interface for managing staff/employee records. It includes:

- ✅ Create new staff records with validation
- ✅ Fetch all staff records with automatic sorting
- ✅ Proper error handling and HTTP status codes
- ✅ JSON request/response binding with Gin
- ✅ PostgreSQL database integration
- ✅ CORS support for frontend integration
- ✅ Production-ready Docker setup
- ✅ Database migrations

---

## Prerequisites

### Local Development
- Go 1.23 or higher
- PostgreSQL 13+
- curl or Postman for API testing

### Docker
- Docker
- Docker Compose

---

## Project Structure

```
myapp/
├── cmd/
│   └── main.go                 # Application entry point
├── internal/
│   ├── models/
│   │   └── jhb.go              # Data models & structs
│   ├── handlers/
│   │   └── jhb_handler.go       # Request handlers & business logic
│   └── routes/
│       └── routes.go            # Gin router setup
├── pkg/
│   └── database/
│       └── postgres.go          # Database connection
├── migrations/
│   └── 000004_create_jhb_table.up.sql   # Database migrations
├── go.mod                       # Go module dependencies
├── Dockerfile                   # Docker build configuration
├── docker-compose.yml           # Docker Compose configuration
├── .env.example                 # Environment variables template
└── README.md                    # Project documentation
```

---

## Setup & Installation

### Option 1: Local Development

1. **Clone/Navigate to project:**
   ```bash
   cd /workspaces/Indian_Master.app/myapp
   ```

2. **Install dependencies:**
   ```bash
   go mod download
   go mod tidy
   ```

3. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

4. **Ensure PostgreSQL is running:**
   - Edit `.env` with your database credentials
   - Database must be initialized with migrations (already done)

5. **Run application:**
   ```bash
   go run cmd/main.go
   ```

   Server will start on `http://localhost:8080`

### Option 2: Docker Setup (Recommended)

1. **Build and start containers:**
   ```bash
   docker-compose up -d
   ```

2. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

3. **Check application logs:**
   ```bash
   docker-compose logs -f app
   ```

4. **Stop containers:**
   ```bash
   docker-compose down
   ```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost           # For local dev; use "myapp-postgres" in Docker
DB_PORT=5432              # PostgreSQL port
DB_USER=postgres          # Database user
DB_PASSWORD=postgres      # Database password
DB_NAME=myapp             # Database name
DB_SSLMODE=disable        # SSL mode (disable for local dev)

# Server Configuration
APP_PORT=8080             # Server port

# Gin Mode
GIN_MODE=release          # Options: debug, release, test
```

---

## API Endpoints

### 1. Health Check
Verify server is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy"
}
```

---

### 2. Create Staff Record
Create a new JHB (staff) record.

**Endpoint:** `POST /jhb`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "phone_number": "9876543210",
  "role": "Senior Chef",
  "salary": 50000.00,
  "joining_date": "2024-02-23",
  "status": "ACTIVE"
}
```

**Request Validation:**
- `full_name`: Required, 2-150 characters
- `phone_number`: Required, 10-20 characters (must be unique)
- `role`: Required, 2-100 characters
- `salary`: Optional, must be >= 0
- `joining_date`: Required, valid date format
- `status`: Optional, only "ACTIVE" or "INACTIVE" (defaults to "ACTIVE")

**Success Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Doe",
  "phone_number": "9876543210",
  "role": "Senior Chef",
  "salary": 50000,
  "joining_date": "2024-02-23",
  "status": "ACTIVE",
  "created_at": "2024-02-23T10:30:00Z",
  "message": "Staff record created successfully"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Invalid request body",
  "details": "Key: 'CreateJHBRequest.FullName' Error:Field validation for 'FullName' failed on the 'required' tag"
}
```

**Error Response:** `409 Conflict` (Duplicate phone number)
```json
{
  "success": false,
  "error": "Phone number already exists"
}
```

---

### 3. Get All Staff Records
Fetch all JHB records sorted by creation date (newest first).

**Endpoint:** `GET /jhb`

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Staff records fetched successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "full_name": "John Doe",
      "phone_number": "9876543210",
      "role": "Senior Chef",
      "salary": 50000,
      "joining_date": "2024-02-23",
      "status": "ACTIVE",
      "created_at": "2024-02-23T10:30:00Z",
      "updated_at": "2024-02-23T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "full_name": "Jane Smith",
      "phone_number": "9876543211",
      "role": "Restaurant Manager",
      "salary": 60000,
      "joining_date": "2024-02-20",
      "status": "ACTIVE",
      "created_at": "2024-02-20T09:15:00Z",
      "updated_at": "2024-02-20T09:15:00Z"
    }
  ],
  "count": 2
}
```

**Empty Response:** `200 OK`
```json
{
  "success": true,
  "message": "Staff records fetched successfully",
  "data": [],
  "count": 0
}
```

---

## Request/Response Examples

### Using cURL

**Create Staff Record:**
```bash
curl -X POST http://localhost:8080/jhb \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone_number": "9876543210",
    "role": "Senior Chef",
    "salary": 50000,
    "joining_date": "2024-02-23",
    "status": "ACTIVE"
  }'
```

**Get All Staff:**
```bash
curl http://localhost:8080/jhb
```

**Check Health:**
```bash
curl http://localhost:8080/health
```

### Using Postman

1. **Import Collection:**
   - Create new POST request to `http://localhost:8080/jhb`
   - Set header: `Content-Type: application/json`
   - Add raw JSON body from examples above
   - Click "Send"

2. **Get Request:**
   - Create new GET request to `http://localhost:8080/jhb`
   - Click "Send"

---

## Error Handling

The API returns consistent error responses:

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### HTTP Status Codes

| Status Code | Meaning | When Used |
|---|---|---|
| 200 OK | Successful GET request | Fetching records |
| 201 Created | Resource created successfully | POST successful |
| 204 No Content | Successful OPTIONS request | CORS preflight |
| 400 Bad Request | Invalid request data | Validation errors |
| 409 Conflict | Duplicate phone number | Phone already exists |
| 500 Internal Server Error | Server error | Database connection failed |

---

## Running with Docker

### Build and Run
```bash
# Build and start services in background
docker-compose up -d

# View real-time logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v
```

### Access Services

- **Application:** http://localhost:8080
- **Database:** localhost:5433 (PostgreSQL)
- **Health Check:** http://localhost:8080/health

### Docker Environment

Inside Docker containers, database host is `myapp-postgres` (Docker DNS resolution).
The docker-compose.yml is pre-configured for this.

---

## Database Schema

### JHB Table Structure

```sql
CREATE TABLE jhb (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    salary NUMERIC(10,2),
    joining_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_jhb_phone_number ON jhb(phone_number);
CREATE INDEX idx_jhb_status ON jhb(status);
```

### Key Features

- **UUID Primary Key:** Unique identifier for each record
- **Phone Unique Constraint:** Prevents duplicate phone numbers
- **Status Enum:** Only ACTIVE or INACTIVE values allowed
- **Auto Timestamps:** created_at and updated_at managed by database
- **Auto Update Trigger:** Updates updated_at on record modification

---

## Development Notes

### Adding New Endpoints

1. **Add handler method** in `internal/handlers/jhb_handler.go`
2. **Register route** in `internal/routes/routes.go`
3. **Test endpoint** with cURL or Postman
4. **Update documentation**

### Code Structure

- **Models:** Data structures and validation tags
- **Handlers:** Business logic and HTTP responses
- **Routes:** Endpoint definitions and middleware
- **Database:** Connection pooling and queries

### Database Connection

The app uses connection pooling:
- **Max Open Connections:** 25
- **Max Idle Connections:** 5
- **Connection Lifetime:** 5 minutes

Adjust in `pkg/database/postgres.go` if needed.

---

## Troubleshooting

### Database Connection Error
```
Error: failed to connect to database
```
**Solution:** Check DB_HOST, DB_PORT, and credentials in `.env`

### Port Already in Use
```
Error: listen tcp :8080: bind: address already in use
```
**Solution:** Change APP_PORT in `.env` or kill process using port 8080

### Phone Number Duplicate Error
```
Error: Phone number already exists
```
**Solution:** Use a unique phone number or delete existing record

### Docker Connection Issues
```
Error: Network myapp-network not found
```
**Solution:** Run `docker-compose down -v && docker-compose up -d`

---

## Performance Tips

1. **Indexes:** Phone number is already indexed for fast lookups
2. **Pagination:** Consider adding pagination for large datasets
3. **Caching:** Implement Redis for frequently accessed data
4. **Connection Pool:** Already optimized in database setup

---

## Future Enhancements

- [ ] GET /jhb/:id - Fetch single staff record
- [ ] PUT /jhb/:id - Update staff record
- [ ] DELETE /jhb/:id - Delete staff record
- [ ] API pagination and filtering
- [ ] Advanced search and sorting
- [ ] Authentication & authorization
- [ ] Rate limiting
- [ ] API versioning

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs app`
2. Review environment variables
3. Verify database connection
4. Check API endpoint format

