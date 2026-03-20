# Multi-stage build for Go application

# Stage 1: Build
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum (if exists)
COPY go.mod .

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o myapp ./cmd/main.go

# Stage 2: Runtime
FROM alpine:3.19

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates

# Copy binary from builder
COPY --from=builder /app/myapp .

# Expose port (default is 8080, can be overridden via APP_PORT env var)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Note: Environment variables should be provided via:
# 1. Docker compose environment section
# 2. Docker run -e ENV_VAR=value
# 3. .env file in the container root (if copied)
# The application will use godotenv to load from .env if present,
# and fallback to system environment variables
CMD ["./myapp"]
