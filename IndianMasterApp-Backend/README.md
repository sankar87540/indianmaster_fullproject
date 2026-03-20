# MyApp - Go Backend Service

A production-ready Go backend application with a clean, idiomatic project structure.

## Project Structure

```
myapp/
├── cmd/                      # Application entry points
│   └── main.go              # Main application
├── internal/                 # Private application code
│   ├── config/              # Configuration and environment handling
│   ├── database/            # Database connections and queries
│   ├── handlers/            # HTTP request handlers
│   ├── routes/              # Route definitions
│   └── services/            # Business logic layer
├── migrations/              # Database migration files
├── scripts/                 # Utility scripts
│   ├── start.sh            # Start the application
│   └── migrate.sh          # Run database migrations
├── .env                     # Environment variables (local development)
├── Dockerfile               # Docker image configuration
├── docker-compose.yml       # Docker Compose setup with PostgreSQL
├── go.mod                   # Go module file
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Go 1.23 or higher
- Docker and Docker Compose (optional)

### Local Development

1. **Clone the repository** (if applicable)

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Run the application**
   ```bash
   bash scripts/start.sh
   ```
   Or directly:
   ```bash
   go run ./cmd/main.go
   ```

4. **Test the health endpoint**
   ```bash
   curl http://localhost:8080/health
   ```

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   ```bash
   curl http://localhost:8080/health
   ```

3. **Stop the application**
   ```bash
   docker-compose down
   ```

## Configuration

Environment variables are defined in `.env`:

- `APP_ENV` - Application environment (development/production)
- `APP_PORT` - Server port (default: 8080)
- `DB_HOST` - Database host
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `DB_SSLMODE` - SSL mode for database connection

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

## Database Migrations

Run migrations using the provided script:

```bash
bash scripts/migrate.sh up    # Apply migrations
bash scripts/migrate.sh down  # Rollback migrations
```

## Development Guidelines

- **Config**: Place configuration logic in `internal/config/`
- **Database**: Keep database queries and setup in `internal/database/`
- **Handlers**: HTTP request handlers in `internal/handlers/`
- **Routes**: API route definitions in `internal/routes/`
- **Services**: Business logic layer in `internal/services/`
- **Main**: Keep `cmd/main.go` lightweight, delegate to internal packages

## Building for Production

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o myapp ./cmd/main.go
```

## License

MIT License

## Support

For issues or questions, please open an issue in the repository.
