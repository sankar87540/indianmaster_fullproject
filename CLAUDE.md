# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Project Overview

This is a **restaurant / hospitality job hiring platform** built with three main sub-projects:

* **IndianMasterApp-Frontend/** — React Native + Expo mobile/web application for Workers and Hirers
* **IndianMasterApp-Backend/** — Go + Gin REST API backend
* **admin-web/** — React + Vite admin dashboard SPA

The **Go backend API is the single source of truth** for business logic, authentication, and database access.

Both **Mobile App** and **Admin Web** communicate with the **same backend API**.

```
Mobile App (Expo)
        │
        ▼
Go Backend (Gin API)
        │
        ▼
PostgreSQL + Redis
        ▲
        │
Admin Web (React + Vite)
```

---

# Backend (Go + Gin)

All commands run from:

```
IndianMasterApp-Backend/
```

## Development Commands

```bash
make dev           # Run with live reload (requires `air`)
make run           # Run backend normally
make build         # Compile binary
make test          # Run tests
make lint          # Run linter
make format        # Format Go code
make docker-up     # Start PostgreSQL + Redis + API via Docker Compose
make docker-down   # Stop Docker containers
make db-migrate    # Run database migrations
make db-reset      # Reset database
make health        # Check API health
make setup         # Initial setup (install deps, copy .env)
```

## Backend Runtime

* Entry point: `cmd/main.go`
* Default API port: **8080**
* PostgreSQL port (Docker): **5433**
* Redis port: **6379**

Before running locally:

```
cp .env.example .env
```

Then update environment variables.

Swagger documentation is available when the API is running.

---

# Backend Architecture

The backend follows a **Clean Architecture pattern** inside the `internal/` directory.

| Directory       | Purpose                       |
| --------------- | ----------------------------- |
| `handlers/`     | HTTP request handlers         |
| `services/`     | Business logic                |
| `repositories/` | Database queries              |
| `models/`       | Domain models                 |
| `dto/`          | Request / response structures |
| `routes/`       | API route registration        |
| `middleware/`   | JWT auth, CORS, logging       |
| `database/`     | DB connection & pooling       |
| `config/`       | Environment config            |
| `i18n/`         | Internationalization          |
| `logger/`       | Zap structured logging        |

Database migrations are located in:

```
migrations/
```

Format:

```
000001_create_users.up.sql
000001_create_users.down.sql
```

---

# API Structure

All APIs follow this base path:

```
/api/v1/
```

## Auth

```
POST /api/v1/auth/send-otp
POST /api/v1/auth/verify-otp
```

## User

```
GET /api/v1/profile
PUT /api/v1/profile
```

## Jobs

```
GET /api/v1/jobs
POST /api/v1/jobs
GET /api/v1/jobs/:id
POST /api/v1/jobs/apply
```

## Admin

```
POST /api/v1/admin/login
GET /api/v1/admin/users
GET /api/v1/admin/jobs
PUT /api/v1/admin/jobs/:id
```

---

# Database

Primary database:

```
PostgreSQL
```

Caching / rate limiting:

```
Redis
```

Example core tables:

```
users
companies
jobs
applications
messages
notifications
admin_users
```

---

# Frontend (React Native + Expo)

Run commands from:

```
IndianMasterApp-Frontend/
```

## Development Commands

```bash
npm run dev        # Start Expo dev server
npm run android    # Run Android build
npm run ios        # Run iOS build
npm run build:web  # Production web build
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```

## Frontend Architecture

* Uses **Expo Router** (file-based routing)
* Project routes located in:

```
app/
```

### Example structure

```
app/
  index.tsx
  admin/
  hirer/
  worker/
  chat/
  profile/
```

### State & Services

```
store/       → global state
services/    → API calls
components/  → shared UI
```

### API Communication

The frontend communicates with the backend using **REST API calls**.

Example:

```
POST /api/v1/auth/send-otp
GET /api/v1/jobs
```

---

# Admin Web (React + Vite)

Run commands from:

```
admin-web/
```

## Development Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Admin Routes

```
/login
/
/users
/jobs
/settings
```

Admin authentication uses the **same backend JWT authentication system**.

Protected routes redirect unauthenticated users.

Admin API examples:

```
GET /api/v1/admin/users
GET /api/v1/admin/jobs
```

---

# Environment Variables

Example `.env` values:

```
APP_PORT=8080

DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=indianmaster

JWT_SECRET=change-this-secret

REDIS_HOST=localhost
REDIS_PORT=6379
```

---

# Development Workflow

1. Start backend infrastructure

```
make docker-up
```

2. Run backend API

```
make dev
```

3. Start mobile app

```
cd IndianMasterApp-Frontend
npm run dev
```

4. Start admin panel

```
cd admin-web
npm run dev
```

---

# Key Architecture Decisions

### Role-based Access

Three user roles:

```
Worker
Hirer
Admin
```

Each role has its own UI flow.

---

### Authentication

Authentication is handled entirely by the **Go backend API using JWT tokens**.

Mobile and admin clients authenticate using backend endpoints.

---

### Internationalization

The platform supports multiple languages:

```
English
Tamil
Hindi
```

Tamil is the **primary market language**.

---

### Docker-first Backend

The backend uses **Docker Compose** to start:

```
PostgreSQL
Redis
Backend API
```

This ensures consistent development environments.

---

# Important Development Rule

The **mobile frontend is the source of truth for API contracts**.

Backend APIs should match the request and response formats used by the frontend.

Do not change frontend API contracts unless absolutely necessary.
