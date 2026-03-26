# Backend — Trading Orders API

REST API built with NestJS 11 following a Domain-Driven Design (DDD) layered architecture. Provides CRUD operations for trading orders, JWT-based authentication, and Swagger documentation.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Module Structure](#module-structure)
  - [Registered Modules](#registered-modules)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Database](#database)
- [Cache](#cache)
- [Validation](#validation)
- [Global Interceptors & Filters](#global-interceptors--filters)
- [Path Aliases](#path-aliases)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Swagger Documentation](#swagger-documentation)
- [Testing](#testing)
- [Dependencies](#dependencies)

---

## Tech Stack

| Technology | Version |
|-----------|---------|
| NestJS | ^11.0.1 |
| TypeORM | ^0.3.28 |
| PostgreSQL (pg driver) | ^8.20.0 |
| Redis (Keyv) | ^5.1.6 |
| Passport JWT | ^4.0.1 |
| class-validator | ^0.15.1 |
| class-transformer | ^0.5.1 |
| Swagger | ^11.2.6 |
| bcrypt | ^6.0.0 |
| TypeScript | ^5.7.3 |
| Jest | ^30.0.0 |
| Node.js | 24-alpine |

---

## Architecture

### Module Structure

Each business module follows a three-layer structure inspired by DDD:

```
module/
├── domain/
│   ├── entities/          # Domain entities (+ TypeORM decorators)
│   ├── repositories/      # Repository interfaces/contracts (ports)
│   └── validation/        # Business rules (supported pairs, prices)
├── application/
│   └── use-cases/         # Use cases (application logic)
└── infrastructure/
    ├── controllers/       # HTTP controllers + NestJS module definition
    ├── dto/               # Request/response DTOs
    ├── mappers/           # Cross-layer mapping
    └── repositories/      # Concrete repository implementations (adapters)
```

Repositories are injected via tokens (`USER_REPOSITORY`, `TRADE_ORDER_REPOSITORY`), decoupling the domain layer from infrastructure.

### Registered Modules

Defined in `app.module.ts`:

| Module | Responsibility |
|--------|---------------|
| **CustomConfigModule** | Loads and validates environment variables with `class-validator`. |
| **DatabaseModule** | Global TypeORM (PostgreSQL) and cache (Redis/Keyv) configuration. |
| **AuthModule** | Login and registration. Issues JWT with 60-minute expiration. |
| **UsersModule** | User management. Use cases: create user, find by email. |
| **TradeOrderModule** | Full CRUD for trading orders with pagination and soft delete. |

**Global Providers** (registered in `AppModule`):

| Provider | Type | Purpose |
|----------|------|---------|
| `AllExceptionFilter` | `APP_FILTER` | Catches all exceptions |
| `TimeOutInterceptor` | `APP_INTERCEPTOR` | 3-second timeout per request |
| `LoggingInterceptor` | `APP_INTERCEPTOR` | Request/response logging with correlation UUID |
| `ResponseInterceptor` | `APP_INTERCEPTOR` | Wraps responses in standard envelope |

---

## API Endpoints

Global prefix: `/api/v1`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | User registration |
| `POST` | `/api/v1/auth/login` | Login (returns JWT `accessToken`) |
| `POST` | `/api/v1/trade_orders` | Create a trading order |
| `GET` | `/api/v1/trade_orders` | List orders (paginated: `?page=1&limit=10`) |
| `GET` | `/api/v1/trade_orders/:id` | Get order by ID (UUID) |
| `PUT` | `/api/v1/trade_orders/:id` | Update order |
| `DELETE` | `/api/v1/trade_orders/:id` | Delete order (soft delete) |

---

## Authentication & Authorization

- **Strategy**: Bearer JWT via `passport-jwt`.
- **Signing**: `JWT_SECRET` (minimum 12 characters) with 60-minute expiration.
- **Passwords**: hashed with `bcrypt`.
- **Guards**:
  - `AuthGuard('jwt')` — JWT token validation.
  - `RolesGuard` — Role verification (`admin`, `user`, `doctor`) via `@Roles()` decorator.

---

## Database

**Engine**: PostgreSQL 17.5

Both entities extend `CustomBaseEntity` (`id` UUID, `createdAt`, `updatedAt`, `deletedAt`):

**UserEntity** (table: `users`):

| Field | Type | Notes |
|-------|------|-------|
| `email` | string | Unique |
| `password` | string | bcrypt hash |
| `role` | enum | `admin` \| `user` \| `doctor` |
| `firstName` | string | Optional |
| `lastName` | string | Optional |

**TradeOrderEntity** (table: `trade_order`):

| Field | Type | Notes |
|-------|------|-------|
| `side` | enum | `buy` \| `sell` |
| `type` | enum | `limit` \| `market` \| `stop` |
| `amount` | decimal | — |
| `price` | decimal | — |
| `status` | enum | `open` \| `cancelled` \| `executed` |
| `pair` | varchar(32) | Trading pair (e.g. BTC/USD) |

**Synchronization**: automatic in development (`synchronize: true`), disabled in production. Migrations enabled (`migrationsRun: true`).

---

## Cache

Redis 8.0 via `@keyv/redis`, configured in `DatabaseModule` as a global module.

---

## Validation

- **Global Pipe** (in `main.ts`): `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **DTOs**: `class-validator` decorators on input DTOs.
- **Business rules**: `assertTradeOrderConstraints` validates supported pairs and price coherence (limit/stop vs market).

---

## Global Interceptors & Filters

Execution order as registered in `AppModule`:

| Component | Purpose |
|-----------|---------|
| `AllExceptionFilter` | Catches all exceptions → `{ status, data: null, errors: { error, path } }` |
| `TimeOutInterceptor` | 3-second timeout per request (hardcoded) |
| `LoggingInterceptor` | Logs request/response with correlation UUID, user-agent, IP, and duration |
| `ResponseInterceptor` | Wraps successful responses → `{ status, data, errors: null }` |

---

## Path Aliases

Configured in both `tsconfig.json` and Jest's `moduleNameMapper`:

| Alias | Maps to |
|-------|---------|
| `@common/*` | `src/common/*` |
| `@config/*` | `src/config/*` |
| `@database/*` | `src/database/*` |
| `@modules/*` | `src/modules/*` |

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run build` | `nest build` | Compile to `dist/` |
| `npm run start` | `nest start` | Start in production mode |
| `npm run start:dev` | `nest start --watch` | Start with hot-reload |
| `npm run start:debug` | `nest start --debug --watch` | Start with debugger |
| `npm run start:prod` | `node dist/main` | Run compiled output |
| `npm run lint` | `eslint ... --fix` | Lint and auto-fix |
| `npm run format` | `prettier --write ...` | Format source files |
| `npm test` | `jest` | Run unit tests |
| `npm run test:watch` | `jest --watch` | Tests in watch mode |
| `npm run test:cov` | `jest --coverage` | Tests with coverage |
| `npm run test:debug` | `node --inspect-brk ...` | Debug tests |
| `npm run test:e2e` | `jest --config ./test/jest-e2e.json` | End-to-end tests |

---

## Environment Variables

An `.env.example` file is provided as a template. Copy or rename it to `.env` before starting the application:

```bash
cp .env.example .env   # Adjust values as needed
```

Loaded from `.env` and validated at startup with `class-validator`:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment (`development` \| `production` \| `test`) | `development` |
| `API_PORT` | Server port | `3000` |
| `TIMEOUT` | Timeout value (configured, not used in interceptor) | `5000` |
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

> The Redis password in `.env` (`CACHE_PASSWORD`) must match `requirepass` in `redis.conf`.

---

## Swagger Documentation

Interactive API documentation is available at `/docs` once the server is running.

- **Title**: Template Service's API
- **Auth**: Bearer token (configured via `.addBearerAuth()`)
- **Extra models**: `CreateTradeOrderDto`, `UpdateTradeOrderDto`, `PaginationQueryDto`, `TradeOrderResponseItemDto`, `PaginatedTradeOrdersResponseDto`, `SoftDeleteTradeOrderResponseDto`

| Environment | URL |
|-------------|-----|
| Development | http://localhost:3000/docs |
| Production | http://localhost:3000/docs |

---

## Testing

- **Unit/Integration**: Jest 30 with `ts-jest`. Specs colocated with source (`*.spec.ts`).
- **E2E**: Supertest with separate config (`test/jest-e2e.json`).
- **Coverage**: output to `coverage/` directory.

```bash
npm test           # Unit tests
npm run test:watch # Watch mode
npm run test:cov   # Coverage report
npm run test:e2e   # End-to-end tests
```

---

## Dependencies

<details>
<summary>Production dependencies</summary>

| Package | Version |
|---------|---------|
| `@keyv/redis` | ^5.1.6 |
| `@nestjs/common` | ^11.0.1 |
| `@nestjs/config` | ^4.0.3 |
| `@nestjs/core` | ^11.0.1 |
| `@nestjs/jwt` | ^11.0.2 |
| `@nestjs/passport` | ^11.0.5 |
| `@nestjs/platform-express` | ^11.0.1 |
| `@nestjs/swagger` | ^11.2.6 |
| `@nestjs/typeorm` | ^11.0.0 |
| `bcrypt` | ^6.0.0 |
| `class-transformer` | ^0.5.1 |
| `class-validator` | ^0.15.1 |
| `passport-jwt` | ^4.0.1 |
| `pg` | ^8.20.0 |
| `reflect-metadata` | ^0.2.2 |
| `rxjs` | ^7.8.1 |
| `typeorm` | ^0.3.28 |

</details>

<details>
<summary>Development dependencies</summary>

| Package | Version |
|---------|---------|
| `@nestjs/cli` | ^11.0.0 |
| `@nestjs/schematics` | ^11.0.0 |
| `@nestjs/testing` | ^11.0.1 |
| `@types/express` | ^5.0.0 |
| `@types/jest` | ^30.0.0 |
| `@types/node` | ^22.10.7 |
| `@types/supertest` | ^6.0.2 |
| `eslint` | ^9.18.0 |
| `eslint-config-prettier` | ^10.0.1 |
| `eslint-plugin-prettier` | ^5.2.2 |
| `jest` | ^30.0.0 |
| `prettier` | ^3.4.2 |
| `supertest` | ^7.0.0 |
| `ts-jest` | ^29.2.5 |
| `ts-loader` | ^9.5.2 |
| `ts-node` | ^10.9.2 |
| `tsconfig-paths` | ^4.2.0 |
| `typescript` | ^5.7.3 |
| `typescript-eslint` | ^8.20.0 |

</details>
