.PHONY: help build run test docker-up docker-down docker-logs clean

# Variables
APP_NAME=myapp
DOCKER_COMPOSE=docker-compose

help: ## Display this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build the Go application
	@echo "🔨 Building application..."
	go build -o bin/$(APP_NAME) ./cmd/main.go
	@echo "✅ Build complete. Binary at: bin/$(APP_NAME)"

run: ## Run the application locally
	@echo "🚀 Starting application..."
	go run cmd/main.go

dev: ## Run with live reload (requires air installed)
	@echo "⚡ Running with live reload..."
	air

install-deps: ## Install Go dependencies
	@echo "📦 Installing dependencies..."
	go mod download
	go mod tidy
	@echo "✅ Dependencies installed"

test: ## Run tests
	@echo "🧪 Running tests..."
	go test -v ./...

docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	$(DOCKER_COMPOSE) build
	@echo "✅ Docker image built"

docker-up: ## Start Docker containers
	@echo "🚀 Starting Docker containers..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Services started"
	@echo "📍 API: http://localhost:8080"
	@echo "💾 Database: localhost:5433"

docker-down: ## Stop Docker containers
	@echo "🛑 Stopping Docker containers..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Services stopped"

docker-logs: ## View Docker logs
	$(DOCKER_COMPOSE) logs -f app

docker-clean: ## Stop containers and remove volumes
	@echo "🧹 Cleaning Docker..."
	$(DOCKER_COMPOSE) down -v
	@echo "✅ Docker cleaned"

db-migrate: ## Run database migrations
	@echo "📊 Running migrations..."
	migrate -path ./migrations -database "postgres://postgres:postgres@localhost:5433/myapp?sslmode=disable" up
	@echo "✅ Migrations complete"

db-reset: ## Reset database (drop all migrations)
	@echo "⚠️  Resetting database..."
	migrate -path ./migrations -database "postgres://postgres:postgres@localhost:5433/myapp?sslmode=disable" down
	@echo "✅ Database reset"

lint: ## Run linter
	@echo "🔍 Linting code..."
	golangci-lint run ./...

format: ## Format code
	@echo "✨ Formatting code..."
	go fmt ./...
	goimports -w .

clean: ## Clean build artifacts
	@echo "🧹 Cleaning..."
	rm -rf bin/
	go clean
	@echo "✅ Cleaned"

health: ## Check API health
	@echo "🏥 Checking API health..."
	curl http://localhost:8080/health || echo "API unavailable"

create-staff: ## Create test staff record
	@echo "👤 Creating test staff record..."
	curl -X POST http://localhost:8080/jhb \
	  -H "Content-Type: application/json" \
	  -d '{ \
	    "full_name": "Test User", \
	    "phone_number": "9876543210", \
	    "role": "Chef", \
	    "salary": 50000, \
	    "joining_date": "2024-02-23", \
	    "status": "ACTIVE" \
	  }'
	@echo ""

list-staff: ## List all staff records
	@echo "📋 Fetching staff records..."
	curl http://localhost:8080/jhb | jq '.'

setup: install-deps ## Initial project setup
	@echo "⚙️  Setting up project..."
	cp .env.example .env
	@echo "✅ Setup complete"
	@echo "📝 Customize .env if needed"

.DEFAULT_GOAL := help
