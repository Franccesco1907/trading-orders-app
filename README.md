# Trading Orders App

Full-stack application for managing trading orders. It allows creating, listing, editing, and deleting buy/sell orders with market price validation, pagination, and soft delete.

---

## Table of Contents

- [General Architecture](#general-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Backend](#backend)
  - [Layered Architecture (DDD)](#layered-architecture-ddd)
  - [Modules](#modules)
  - [API Endpoints](#api-endpoints)
  - [Authentication & Authorization](#authentication--authorization)
  - [Database](#database)
  - [Cache](#cache)
  - [Validation](#validation)
  - [Global Interceptors & Filters](#global-interceptors--filters)
  - [Testing](#backend-testing)
- [Frontend](#frontend)
  - [Components](#components)
  - [Services](#services)
  - [Routes](#routes)
  - [State Management](#state-management)
  - [UI & Styling](#ui--styling)
  - [Testing](#frontend-testing)
- [Environment Variables](#environment-variables)
- [Docker](#docker)
  - [Local Development](#local-development)
  - [Production](#production)
- [Dev Containers](#dev-containers)

---

## General Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Docker Compose                  │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  Frontend    │  │  Backend    │  │  PostgreSQL │  │
│  │  Angular 21  │──│  NestJS 11  │──│  17.5       │  │
│  │  :4200/:80   │  │  :3000      │  │  :5432      │  │
│  └─────────────┘  └──────┬──────┘  └────────────┘  │
│                          │                          │
│                    ┌─────┴──────┐                   │
│                    │   Redis    │                   │
│                    │   8.0      │                   │
│                    │   :6379    │                   │
│                    └────────────┘                   │
└─────────────────────────────────────────────────────┘
```

The project consists of two independent applications orchestrated with Docker Compose:

- **Frontend**: Angular 21 (standalone components, Vite)
- **Backend**: NestJS 11 with DDD architecture
- **Database**: PostgreSQL 17.5 with TypeORM
- **Cache**: Redis 8.0 via Keyv

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Angular | ^21.2.0 |
| UI Components | Angular Material + CDK | ^21.2.4 |
| Backend | NestJS | ^11.0.1 |
| ORM | TypeORM | ^0.3.28 |
| Database | PostgreSQL | 17.5-alpine |
| Cache | Redis (Keyv) | 8.0-alpine |
| Auth | JWT (Passport) | ^11.0.2 |
| Validation | class-validator / class-transformer | ^0.15.1 / ^0.5.1 |
| API Docs | Swagger | ^11.2.6 |
| Backend Testing | Jest | ^30.0.0 |
| Frontend Testing | Vitest | ^4.0.8 |
| Runtime | Node.js | 24-alpine |
| Language | TypeScript | ~5.7 (back) / ~5.9 (front) |

---

## Project Structure

```
trading-orders-app/
├── docker-compose.local.yml        # Development orchestration
├── docker-compose.prod.yml         # Production orchestration
├── README.md
│
├── backend/
│   ├── Dockerfile                   # Development image
│   ├── Dockerfile.prod              # Production image (multi-stage)
│   ├── .devcontainer/               # Dev Container config
│   ├── .env                         # Environment variables
│   ├── redis.conf                   # Redis configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts                  # Bootstrap (/api/v1 prefix, Swagger, CORS)
│       ├── app.module.ts            # Root module
│       ├── common/                  # Guards, interceptors, filters, base DTOs
│       ├── config/                  # Configuration module & .env validation
│       ├── database/                # TypeORM, Redis cache, base entity
│       └── modules/
│           ├── auth/                # Authentication (JWT, login, registration)
│           ├── users/               # User management
│           └── trade-orders/        # Trading orders (CRUD)
│
└── frontend/
    ├── Dockerfile                   # Development image
    ├── Dockerfile.prod              # Production image (Nginx)
    ├── .devcontainer/               # Dev Container config
    ├── nginx.conf                   # Nginx config (prod: proxy /api → backend)
    ├── proxy.conf.json              # Dev proxy (ng serve → backend)
    ├── package.json
    ├── angular.json
    ├── tsconfig.json
    └── src/
        ├── main.ts                  # Angular bootstrap
        ├── styles.css               # Global styles + dark theme
        └── app/
            ├── app.ts               # Root component (shell, sidebar, header)
            ├── app.routes.ts        # Main routes
            ├── app.config.ts        # Global providers
            ├── core/
            │   ├── api/             # TradeOrdersApiService
            │   └── models/          # Interfaces & types
            ├── features/
            │   └── trades/          # Trade list, detail, new
            └── shared/
                └── confirm-dialog/  # Confirmation dialog
```

---

## Backend

### Layered Architecture (DDD)

Each business module follows a three-layer structure inspired by Domain-Driven Design:

```
module/
├── domain/
│   ├── entities/          # Domain entities (+ TypeORM decorators)
│   ├── repositories/      # Repository interfaces/contracts (ports)
│   └── validation/        # Business rules (supported pairs, prices)
├── application/
│   └── use-cases/         # Use cases (application logic)
└── infrastructure/
    ├── controllers/       # HTTP controllers + NestJS module
    ├── dto/               # Request/response DTOs
    ├── mappers/           # Cross-layer mapping
    └── repositories/      # Concrete repository implementations
```

Repositories are injected via tokens (`USER_REPOSITORY`, `TRADE_ORDER_REPOSITORY`), allowing the domain to be decoupled from infrastructure.

### Modules

| Module | Responsibility |
|--------|---------------|
| **AuthModule** | Login and registration. Issues JWT with 60-minute expiration. |
| **UsersModule** | User management. Use cases: create user, find by email. |
| **TradeOrderModule** | Full CRUD for trading orders with pagination and soft delete. |
| **CustomConfigModule** | Loading and validation of environment variables with `class-validator`. |
| **DatabaseModule** | Global TypeORM (PostgreSQL) and cache (Redis/Keyv) configuration. |

### API Endpoints

Global prefix: `/api/v1` — Swagger documentation available at `/docs`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | Login (returns JWT `accessToken`) |
| `POST` | `/api/v1/trade_orders` | Create a trading order |
| `GET` | `/api/v1/trade_orders` | List orders (paginated: `?page=1&limit=10`) |
| `GET` | `/api/v1/trade_orders/:id` | Get order by ID (UUID) |
| `PUT` | `/api/v1/trade_orders/:id` | Update order |
| `DELETE` | `/api/v1/trade_orders/:id` | Delete order (soft delete) |

### Authentication & Authorization

- **Strategy**: Bearer JWT via `passport-jwt`.
- **Signing**: `JWT_SECRET` (minimum 12 characters) with 60-minute expiration.
- **Passwords**: hashed with `bcrypt`.
- **Available guards**:
  - `AuthGuard('jwt')` — JWT token validation.
  - `RolesGuard` — Role verification (`admin`, `user`, `doctor`) via `@Roles()` decorator.

### Database

**Engine**: PostgreSQL 17.5

**Entities** (both extend `CustomBaseEntity` with `id` UUID, `createdAt`, `updatedAt`, `deletedAt`):

**UserEntity** (`users`):

| Field | Type | Notes |
|-------|------|-------|
| `email` | string | Unique |
| `password` | string | bcrypt hash |
| `role` | enum | `admin` \| `user` \| `doctor` |
| `firstName` | string | Optional |
| `lastName` | string | Optional |

**TradeOrderEntity** (`trade_order`):

| Field | Type | Notes |
|-------|------|-------|
| `side` | enum | `buy` \| `sell` |
| `type` | enum | `limit` \| `market` \| `stop` |
| `amount` | decimal | — |
| `price` | decimal | — |
| `status` | enum | `open` \| `cancelled` \| `executed` |
| `pair` | varchar(32) | Trading pair (e.g. BTC/USD) |

**Synchronization**: automatic in development (`synchronize: true`), disabled in production. Migrations enabled (`migrationsRun: true`).

### Cache

Redis 8.0 via `@keyv/redis`. Configured in `DatabaseModule` as a global module.

### Validation

- **Global Pipe**: `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`.
- **DTOs**: `class-validator` decorators on input DTOs.
- **Business rules**: `assertTradeOrderConstraints` validates supported pairs and price coherence (limit/stop vs market).

### Global Interceptors & Filters

| Component | Purpose |
|-----------|---------|
| `TimeOutInterceptor` | 3-second timeout per request |
| `LoggingInterceptor` | Request/response logging with correlation UUID, user-agent, IP, and duration |
| `ResponseInterceptor` | Wraps successful responses in `{ status, data, errors: null }` |
| `AllExceptionFilter` | Catches all exceptions and returns `{ status, data: null, errors: { error, path } }` |

### Backend Testing

- **Unit/Integration**: Jest 30 with `ts-jest`. Specs in each module (`*.spec.ts`).
- **E2E**: Supertest with separate configuration (`test/jest-e2e.json`).
- **Running tests**:

```bash
cd backend
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run test:cov   # Coverage
```

---

## Frontend

### Components

All components are **standalone** (no NgModules).

| Component | Route | Description |
|-----------|-------|-------------|
| `App` | — | Main shell: navigation sidebar, header, and `router-outlet` |
| `TradeListComponent` | `/trades` | Material table with pagination, view/edit/delete actions |
| `TradeNewComponent` | `/trades/new` | Reactive form for creating orders with price validation |
| `TradeDetailComponent` | `/trades/:id` | Order view/edit with update and delete |
| `ConfirmDialogComponent` | — | Reusable Material dialog for delete confirmation |

### Services

**`TradeOrdersApiService`** (`providedIn: 'root'`):

| Method | HTTP | Endpoint |
|--------|------|----------|
| `list(page, limit)` | GET | `/api/v1/trade_orders` |
| `getById(id)` | GET | `/api/v1/trade_orders/:id` |
| `create(body)` | POST | `/api/v1/trade_orders` |
| `update(id, body)` | PUT | `/api/v1/trade_orders/:id` |
| `delete(id)` | DELETE | `/api/v1/trade_orders/:id` |

Responses are unwrapped from the `ApiEnvelope<T>` format by extracting `.data`.

### Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | — | Redirect to `/trades` |
| `/trades` | `TradeListComponent` | Order list |
| `/trades/new` | `TradeNewComponent` | New order |
| `/trades/:id` | `TradeDetailComponent` | Detail/edit (`?edit=true` for edit mode) |
| `**` | — | Redirect to `/trades` |

### State Management

No centralized store is used (NgRx, Akita, etc.). State is managed locally within each component:

- **List**: `BehaviorSubject` for pagination + `Subject` for refresh, combined with RxJS `switchMap`.
- **Detail / New**: Angular `signal()` and `computed()` for local UI state.

### UI & Styling

- **Angular Material**: table, paginator, spinner, dialog, snack-bar, tooltip, icons.
- **Theme**: `azure-blue` (prebuilt) with custom overrides for a dark theme.
- **Fonts**: Roboto, Inter, Material Icons (Google Fonts).
- **Component styles**: each component has its own `.css` file.

### Frontend Testing

- **Framework**: Vitest 4 with jsdom.
- **Running tests**:

```bash
cd frontend
npm test
```

---

## Environment Variables

The backend loads its variables from `backend/.env`. All are validated at application startup.

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment (`development` \| `production` \| `test`) | `development` |
| `API_PORT` | Server port | `3000` |
| `TIMEOUT` | Timeout (configured but unused in interceptor) | `5000` |
| `DATABASE_HOST` | PostgreSQL host | `postgres` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USERNAME` | PostgreSQL user | `postgres` |
| `DATABASE_PASSWORD` | PostgreSQL password | `secret` |
| `DATABASE_NAME` | Database name | `trading_orders` |
| `CORS_ORIGINS` | Allowed origins (CSV) | `http://localhost:4200` |
| `CORS_METHODS` | Allowed HTTP methods | `GET,POST,PUT,DELETE` |
| `CORS_ALLOWED_HEADERS` | Allowed headers | `Content-Type,Authorization` |
| `CORS_EXPOSED_HEADERS` | Exposed headers | — |
| `CORS_CREDENTIALS` | Allow credentials | `true` |
| `CACHE_HOST` | Redis host | `redis` |
| `CACHE_PORT` | Redis port | `6379` |
| `CACHE_PASSWORD` | Redis password | `secret` |
| `JWT_SECRET` | JWT signing secret (min. 12 characters) | `my_jwt_secret_key` |

> The Redis password in `.env` (`CACHE_PASSWORD`) must match `requirepass` in `backend/redis.conf`.

---

## Docker

### Local Development

Starts all services with hot-reload and source code bind mounts:

```bash
docker-compose -f docker-compose.local.yml up -d
```

| Service | Port | Description |
|---------|------|-------------|
| **frontend** | `4200` | Angular dev server (`ng serve`) with proxy to backend |
| **backend** | `3000` | NestJS in watch mode (`start:dev`) |
| **postgres** | `5432` | PostgreSQL with persistent volume |
| **redis** | `6379` | Redis with custom configuration |

**Local environment features**:
- Bind mounts of `./frontend` and `./backend` for hot-reload.
- Anonymous volumes for `node_modules` (avoids conflicts between host and container).
- Frontend proxies `/api` to `http://host.docker.internal:3000`.

### Production

Builds optimized images with multi-stage builds:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

| Service | Port | Description |
|---------|------|-------------|
| **frontend** | `80` | Nginx serving static assets + reverse proxy to backend |
| **backend** | `3000` | Compiled NestJS (`node dist/main.js`) |
| **postgres** | `5432` | PostgreSQL with persistent volume |
| **redis** | `6379` | Redis with custom configuration |

**Production environment features**:
- **Frontend**: Multi-stage build (Node → Nginx). Nginx handles SPA routes with `try_files` and proxies `/api/` to the backend via Docker internal network.
- **Backend**: 3-stage multi-stage build (install → build → production) with unprivileged `node` user and production-only dependencies.
- No source code bind mounts.

---

## Dev Containers

The project includes Dev Container configurations for both services:

- `backend/.devcontainer/devcontainer.json` → `backend` service at `/workspace/backend`
- `frontend/.devcontainer/devcontainer.json` → `frontend` service at `/workspace/frontend`

Both point to the root `docker-compose.local.yml`, enabling development directly inside the container with VS Code or Cursor.

---

## Quick Start

1. **Clone the repository**:

```bash
git clone <repository-url>
cd trading-orders-app
```

2. **Configure environment variables**:

```bash
cp backend/.env.example backend/.env   # Adjust values as needed
```

3. **Start the development environment**:

```bash
docker-compose -f docker-compose.local.yml up -d
```

4. **Access the application**:

| Resource | URL |
|----------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/docs |

5. **Start the production environment**:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

| Resource | URL |
|----------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost/api/v1 |
| Swagger Docs | http://localhost:3000/docs |
