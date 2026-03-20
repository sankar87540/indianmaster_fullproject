# JHB API - Quick Start Guide

## 🚀 Get Running in 2 Minutes

### With Docker (Easiest)

```bash
# 1. Navigate to project
cd /workspaces/Indian_Master.app/myapp

# 2. Start services
docker-compose up -d

# 3. Wait 10 seconds for database to be ready

# 4. Test the API
curl http://localhost:8080/health
```

### Local Development

```bash
# 1. Install dependencies
cd /workspaces/Indian_Master.app/myapp
go mod download

# 2. Create .env file
cp .env.example .env
# Edit .env if your database isn't at localhost:5432

# 3. Ensure PostgreSQL is running and migrations applied

# 4. Run application
go run cmd/main.go
```

Server runs on **http://localhost:8080**

---

## 📝 Test the API

### Create a Staff Record

```bash
curl -X POST http://localhost:8080/jhb \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Raj Kumar",
    "phone_number": "9876543210",
    "role": "Head Chef",
    "salary": 75000,
    "joining_date": "2024-02-20",
    "status": "ACTIVE"
  }'
```

### Fetch All Staff

```bash
curl http://localhost:8080/jhb
```

### Check Health

```bash
curl http://localhost:8080/health
```

---

## 📂 Project Files Created

```
✅ internal/models/jhb.go                 - Data models
✅ internal/handlers/jhb_handler.go       - API handlers  
✅ internal/routes/routes.go              - Gin router setup
✅ pkg/database/postgres.go               - Database connection
✅ cmd/main.go                            - Application entry point
✅ .env.example                           - Environment template
✅ docs/JHB_API.md                        - Full API documentation
```

---

## 🔧 Project Structure

```
myapp/
├── cmd/main.go                         # Server startup
├── internal/
│   ├── models/jhb.go                   # Structs with validation
│   ├── handlers/jhb_handler.go         # Business logic
│   └── routes/routes.go                # Gin routes
├── pkg/database/postgres.go            # Database setup
├── migrations/                         # Database migrations
├── docker-compose.yml                  # Docker setup
├── Dockerfile                          # Build configuration
├── go.mod                              # Dependencies
└── .env.example                        # Config template
```

---

## 🎯 Key Features Implemented

✅ **Gin Framework** - Modern, fast web framework  
✅ **PostgreSQL** - Robust database with connection pooling  
✅ **Models** - Struct with JSON binding & validation tags  
✅ **Error Handling** - Consistent error responses  
✅ **CORS** - Cross-origin requests supported  
✅ **Docker** - Production-ready containerization  
✅ **Validation** - Request data validation  
✅ **UUID** - Unique identifiers for all records  

---

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check if server is running |
| POST | `/jhb` | Create new staff record |
| GET | `/jhb` | Get all staff records |

---

## 🔐 Validation Rules

**Create Staff Validation:**
- `full_name`: 2-150 characters (required)
- `phone_number`: 10-20 chars, must be unique (required)
- `role`: 2-100 characters (required)
- `salary`: >= 0 (optional)
- `joining_date`: Valid date string (required)
- `status`: "ACTIVE" or "INACTIVE" (defaults to ACTIVE)

---

## 🐳 Docker Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Stop services (keep data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove everything including database
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

---

## 📋 Response Examples

### Success - Create Record
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "Raj Kumar",
  "phone_number": "9876543210",
  "role": "Head Chef",
  "salary": 75000,
  "joining_date": "2024-02-20",
  "status": "ACTIVE",
  "created_at": "2024-02-23T10:30:00Z",
  "message": "Staff record created successfully"
}
```

### Success - Fetch Records
```json
{
  "success": true,
  "message": "Staff records fetched successfully",
  "data": [...],
  "count": 5
}
```

### Error Response
```json
{
  "success": false,
  "error": "Phone number already exists"
}
```

---

## ⚙️ Environment Variables

```env
DB_HOST=localhost          # Database host
DB_PORT=5432              # Database port
DB_USER=postgres          # Database user
DB_PASSWORD=postgres      # Database password
DB_NAME=myapp             # Database name
APP_PORT=8080             # Server port
GIN_MODE=release          # Gin mode
```

---

## 🔍 Troubleshooting

**Q: "Database connection failed"**  
A: Check DB_HOST, DB_PORT in .env, ensure PostgreSQL is running

**Q: "Port 8080 already in use"**  
A: Change APP_PORT in .env or kill process using port 8080

**Q: "Phone number already exists"**  
A: Use different phone number, records must have unique phone numbers

**Q: Docker containers won't start**  
A: Run `docker-compose down -v && docker-compose up -d`

---

## 📖 For More Details

See **[docs/JHB_API.md](docs/JHB_API.md)** for:
- Complete API documentation
- Full request/response examples
- Database schema details
- Development guidelines
- Future enhancements

---

## ✨ What's Next

Your Go backend is ready! You can now:

1. ✅ Start the server
2. ✅ Create staff records via API
3. ✅ Fetch all staff records
4. ✅ Connect frontend to these endpoints
5. ✅ Deploy with Docker

---

**Happy coding! 🎉**

