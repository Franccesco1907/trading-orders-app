# Trading Orders App

Aplicación full-stack para la gestión de órdenes de trading. Permite crear, listar, editar y eliminar órdenes de compra/venta con validación de precios de mercado, paginación y soft delete.

---

## Tabla de Contenidos

- [Arquitectura General](#arquitectura-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Backend](#backend)
  - [Arquitectura por Capas (DDD)](#arquitectura-por-capas-ddd)
  - [Módulos](#módulos)
  - [Endpoints API](#endpoints-api)
  - [Autenticación y Autorización](#autenticación-y-autorización)
  - [Base de Datos](#base-de-datos)
  - [Caché](#caché)
  - [Validación](#validación)
  - [Interceptors y Filtros Globales](#interceptors-y-filtros-globales)
  - [Testing](#testing-backend)
- [Frontend](#frontend)
  - [Componentes](#componentes)
  - [Servicios](#servicios)
  - [Rutas](#rutas)
  - [Estado](#estado)
  - [UI y Estilos](#ui-y-estilos)
  - [Testing](#testing-frontend)
- [Variables de Entorno](#variables-de-entorno)
- [Docker](#docker)
  - [Desarrollo Local](#desarrollo-local)
  - [Producción](#producción)
- [Dev Containers](#dev-containers)

---

## Arquitectura General

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

El proyecto está compuesto por dos aplicaciones independientes orquestadas con Docker Compose:

- **Frontend**: Angular 21 (standalone components, Vite)
- **Backend**: NestJS 11 con arquitectura DDD
- **Base de datos**: PostgreSQL 17.5 con TypeORM
- **Caché**: Redis 8.0 vía Keyv

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend | Angular | ^21.2.0 |
| UI Components | Angular Material + CDK | ^21.2.4 |
| Backend | NestJS | ^11.0.1 |
| ORM | TypeORM | ^0.3.28 |
| Base de Datos | PostgreSQL | 17.5-alpine |
| Caché | Redis (Keyv) | 8.0-alpine |
| Auth | JWT (Passport) | ^11.0.2 |
| Validación | class-validator / class-transformer | ^0.15.1 / ^0.5.1 |
| Documentación API | Swagger | ^11.2.6 |
| Testing Backend | Jest | ^30.0.0 |
| Testing Frontend | Vitest | ^4.0.8 |
| Runtime | Node.js | 24-alpine |
| Lenguaje | TypeScript | ~5.7 (back) / ~5.9 (front) |

---

## Estructura del Proyecto

```
trading-orders-app/
├── docker-compose.local.yml        # Orquestación para desarrollo
├── docker-compose.prod.yml         # Orquestación para producción
├── README.md
│
├── backend/
│   ├── Dockerfile                   # Imagen de desarrollo
│   ├── Dockerfile.prod              # Imagen de producción (multi-stage)
│   ├── .devcontainer/               # Dev Container config
│   ├── .env                         # Variables de entorno
│   ├── redis.conf                   # Configuración de Redis
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts                  # Bootstrap (prefijo /api/v1, Swagger, CORS)
│       ├── app.module.ts            # Módulo raíz
│       ├── common/                  # Guards, interceptors, filtros, DTOs base
│       ├── config/                  # Módulo de configuración y validación .env
│       ├── database/                # TypeORM, caché Redis, entidad base
│       └── modules/
│           ├── auth/                # Autenticación (JWT, login, registro)
│           ├── users/               # Gestión de usuarios
│           └── trade-orders/        # Órdenes de trading (CRUD)
│
└── frontend/
    ├── Dockerfile                   # Imagen de desarrollo
    ├── Dockerfile.prod              # Imagen de producción (Nginx)
    ├── .devcontainer/               # Dev Container config
    ├── nginx.conf                   # Nginx config (prod: proxy /api → backend)
    ├── proxy.conf.json              # Proxy dev (ng serve → backend)
    ├── package.json
    ├── angular.json
    ├── tsconfig.json
    └── src/
        ├── main.ts                  # Bootstrap Angular
        ├── styles.css               # Estilos globales + tema oscuro
        └── app/
            ├── app.ts               # Componente raíz (shell, sidebar, header)
            ├── app.routes.ts        # Rutas principales
            ├── app.config.ts        # Providers globales
            ├── core/
            │   ├── api/             # TradeOrdersApiService
            │   └── models/          # Interfaces y tipos
            ├── features/
            │   └── trades/          # Trade list, detail, new
            └── shared/
                └── confirm-dialog/  # Diálogo de confirmación
```

---

## Backend

### Arquitectura por Capas (DDD)

Cada módulo de negocio sigue una estructura de tres capas inspirada en Domain-Driven Design:

```
module/
├── domain/
│   ├── entities/          # Entidades de dominio (+ decoradores TypeORM)
│   ├── repositories/      # Interfaces/contratos de repositorio (puertos)
│   └── validation/        # Reglas de negocio (pares soportados, precios)
├── application/
│   └── use-cases/         # Casos de uso (lógica de aplicación)
└── infrastructure/
    ├── controllers/       # Controladores HTTP + módulo NestJS
    ├── dto/               # DTOs de request/response
    ├── mappers/           # Mapeo entre capas
    └── repositories/      # Implementación concreta de repositorios
```

Los repositorios se inyectan mediante tokens (`USER_REPOSITORY`, `TRADE_ORDER_REPOSITORY`), permitiendo desacoplar el dominio de la infraestructura.

### Módulos

| Módulo | Responsabilidad |
|--------|----------------|
| **AuthModule** | Login y registro. Genera JWT con expiración de 60 minutos. |
| **UsersModule** | Gestión de usuarios. Casos de uso: crear usuario, buscar por email. |
| **TradeOrderModule** | CRUD completo de órdenes de trading con paginación y soft delete. |
| **CustomConfigModule** | Carga y validación de variables de entorno con `class-validator`. |
| **DatabaseModule** | Configuración global de TypeORM (PostgreSQL) y caché (Redis/Keyv). |

### Endpoints API

Prefijo global: `/api/v1` — Documentación Swagger disponible en `/docs`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Registro de usuario |
| `POST` | `/api/v1/auth/login` | Login (retorna `accessToken` JWT) |
| `POST` | `/api/v1/trade_orders` | Crear orden de trading |
| `GET` | `/api/v1/trade_orders` | Listar órdenes (paginado: `?page=1&limit=10`) |
| `GET` | `/api/v1/trade_orders/:id` | Obtener orden por ID (UUID) |
| `PUT` | `/api/v1/trade_orders/:id` | Actualizar orden |
| `DELETE` | `/api/v1/trade_orders/:id` | Eliminar orden (soft delete) |

### Autenticación y Autorización

- **Estrategia**: Bearer JWT vía `passport-jwt`.
- **Firma**: `JWT_SECRET` (mínimo 12 caracteres) con expiración de 60 minutos.
- **Contraseñas**: hash con `bcrypt`.
- **Guards disponibles**:
  - `AuthGuard('jwt')` — Validación de token JWT.
  - `RolesGuard` — Verificación de roles (`admin`, `user`, `doctor`) mediante decorador `@Roles()`.

### Base de Datos

**Motor**: PostgreSQL 17.5

**Entidades** (ambas extienden `CustomBaseEntity` con `id` UUID, `createdAt`, `updatedAt`, `deletedAt`):

**UserEntity** (`users`):

| Campo | Tipo | Notas |
|-------|------|-------|
| `email` | string | Único |
| `password` | string | Hash bcrypt |
| `role` | enum | `admin` \| `user` \| `doctor` |
| `firstName` | string | Opcional |
| `lastName` | string | Opcional |

**TradeOrderEntity** (`trade_order`):

| Campo | Tipo | Notas |
|-------|------|-------|
| `side` | enum | `buy` \| `sell` |
| `type` | enum | `limit` \| `market` \| `stop` |
| `amount` | decimal | — |
| `price` | decimal | — |
| `status` | enum | `open` \| `cancelled` \| `executed` |
| `pair` | varchar(32) | Par de trading (e.g. BTC/USD) |

**Sincronización**: automática en desarrollo (`synchronize: true`), deshabilitada en producción. Migraciones habilitadas (`migrationsRun: true`).

### Caché

Redis 8.0 mediante `@keyv/redis`. Configurado en `DatabaseModule` como módulo global.

### Validación

- **Global Pipe**: `ValidationPipe` con `whitelist`, `forbidNonWhitelisted` y `transform`.
- **DTOs**: Decoradores `class-validator` en DTOs de entrada.
- **Reglas de negocio**: `assertTradeOrderConstraints` valida pares soportados y coherencia entre precios (límite/stop vs mercado).

### Interceptors y Filtros Globales

| Componente | Función |
|------------|---------|
| `TimeOutInterceptor` | Timeout de 3 segundos por request |
| `LoggingInterceptor` | Log de request/response con UUID de correlación, user-agent, IP y duración |
| `ResponseInterceptor` | Envuelve respuestas exitosas en `{ status, data, errors: null }` |
| `AllExceptionFilter` | Captura todas las excepciones y retorna `{ status, data: null, errors: { error, path } }` |

### Testing Backend

- **Unit/Integration**: Jest 30 con `ts-jest`. Specs en cada módulo (`*.spec.ts`).
- **E2E**: Supertest con configuración separada (`test/jest-e2e.json`).
- **Ejecución**:

```bash
cd backend
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run test:cov   # Cobertura
```

---

## Frontend

### Componentes

Todos los componentes son **standalone** (sin NgModules).

| Componente | Ruta | Descripción |
|------------|------|-------------|
| `App` | — | Shell principal: sidebar de navegación, header y `router-outlet` |
| `TradeListComponent` | `/trades` | Tabla Material con paginación, acciones de ver/editar/eliminar |
| `TradeNewComponent` | `/trades/new` | Formulario reactivo para crear órdenes con validación de precios |
| `TradeDetailComponent` | `/trades/:id` | Vista/edición de orden con actualización y eliminación |
| `ConfirmDialogComponent` | — | Diálogo Material reutilizable para confirmación de borrado |

### Servicios

**`TradeOrdersApiService`** (`providedIn: 'root'`):

| Método | HTTP | Endpoint |
|--------|------|----------|
| `list(page, limit)` | GET | `/api/v1/trade_orders` |
| `getById(id)` | GET | `/api/v1/trade_orders/:id` |
| `create(body)` | POST | `/api/v1/trade_orders` |
| `update(id, body)` | PUT | `/api/v1/trade_orders/:id` |
| `delete(id)` | DELETE | `/api/v1/trade_orders/:id` |

Las respuestas se desenvuelven del formato `ApiEnvelope<T>` extrayendo `.data`.

### Rutas

| Path | Componente | Descripción |
|------|-----------|-------------|
| `/` | — | Redirect a `/trades` |
| `/trades` | `TradeListComponent` | Lista de órdenes |
| `/trades/new` | `TradeNewComponent` | Nueva orden |
| `/trades/:id` | `TradeDetailComponent` | Detalle/edición (`?edit=true` para modo edición) |
| `**` | — | Redirect a `/trades` |

### Estado

No se utiliza un store centralizado (NgRx, Akita, etc.). El estado se gestiona localmente en cada componente:

- **Lista**: `BehaviorSubject` para paginación + `Subject` para refresco, combinados con `switchMap` de RxJS.
- **Detalle / Nuevo**: Angular `signal()` y `computed()` para estado local de UI.

### UI y Estilos

- **Angular Material**: tabla, paginator, spinner, diálogo, snack-bar, tooltip, iconos.
- **Tema**: `azure-blue` (prebuilt) con overrides personalizados para tema oscuro.
- **Fuentes**: Roboto, Inter, Material Icons (Google Fonts).
- **Estilos por componente**: cada componente tiene su propio archivo `.css`.

### Testing Frontend

- **Framework**: Vitest 4 con jsdom.
- **Ejecución**:

```bash
cd frontend
npm test
```

---

## Variables de Entorno

El backend carga sus variables desde `backend/.env`. Todas se validan al iniciar la aplicación.

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno (`development` \| `production` \| `test`) | `development` |
| `API_PORT` | Puerto del servidor | `3000` |
| `TIMEOUT` | Timeout (configurado pero no usado en interceptor) | `5000` |
| `DATABASE_HOST` | Host de PostgreSQL | `postgres` |
| `DATABASE_PORT` | Puerto de PostgreSQL | `5432` |
| `DATABASE_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `DATABASE_PASSWORD` | Contraseña de PostgreSQL | `secret` |
| `DATABASE_NAME` | Nombre de la base de datos | `trading_orders` |
| `CORS_ORIGINS` | Orígenes permitidos (CSV) | `http://localhost:4200` |
| `CORS_METHODS` | Métodos HTTP permitidos | `GET,POST,PUT,DELETE` |
| `CORS_ALLOWED_HEADERS` | Headers permitidos | `Content-Type,Authorization` |
| `CORS_EXPOSED_HEADERS` | Headers expuestos | — |
| `CORS_CREDENTIALS` | Permitir credenciales | `true` |
| `CACHE_HOST` | Host de Redis | `redis` |
| `CACHE_PORT` | Puerto de Redis | `6379` |
| `CACHE_PASSWORD` | Contraseña de Redis | `secret` |
| `JWT_SECRET` | Secreto para firmar JWT (mín. 12 caracteres) | `my_jwt_secret_key` |

> La contraseña de Redis en `.env` (`CACHE_PASSWORD`) debe coincidir con `requirepass` en `backend/redis.conf`.

---

## Docker

### Desarrollo Local

Levanta todos los servicios con hot-reload y bind mounts del código fuente:

```bash
docker-compose -f docker-compose.local.yml up -d
```

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **frontend** | `4200` | Angular dev server (`ng serve`) con proxy a backend |
| **backend** | `3000` | NestJS en modo watch (`start:dev`) |
| **postgres** | `5432` | PostgreSQL con volumen persistente |
| **redis** | `6379` | Redis con configuración personalizada |

**Características del entorno local**:
- Bind mounts de `./frontend` y `./backend` para hot-reload.
- Volúmenes anónimos para `node_modules` (evita conflictos entre host y contenedor).
- El frontend hace proxy de `/api` hacia `http://host.docker.internal:3000`.

### Producción

Construye imágenes optimizadas con builds multi-stage:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **frontend** | `80` | Nginx sirviendo assets estáticos + proxy reverso a backend |
| **backend** | `3000` | NestJS compilado (`node dist/main.js`) |
| **postgres** | `5432` | PostgreSQL con volumen persistente |
| **redis** | `6379` | Redis con configuración personalizada |

**Características del entorno de producción**:
- **Frontend**: Build multi-stage (Node → Nginx). Nginx maneja rutas SPA con `try_files` y redirige `/api/` al backend via red Docker interna.
- **Backend**: Build multi-stage de 3 etapas (install → build → production) con usuario `node` sin privilegios y solo dependencias de producción.
- Sin bind mounts de código fuente.

---

## Dev Containers

El proyecto incluye configuraciones de Dev Container para ambos servicios:

- `backend/.devcontainer/devcontainer.json` → servicio `backend` en `/workspace/backend`
- `frontend/.devcontainer/devcontainer.json` → servicio `frontend` en `/workspace/frontend`

Ambos apuntan al `docker-compose.local.yml` de la raíz, permitiendo desarrollo directo dentro del contenedor con VS Code o Cursor.

---

## Inicio Rápido

1. **Clonar el repositorio**:

```bash
git clone <url-del-repositorio>
cd trading-orders-app
```

2. **Configurar variables de entorno**:

```bash
cp backend/.env.example backend/.env   # Ajustar valores según sea necesario
```

3. **Levantar el entorno de desarrollo**:

```bash
docker-compose -f docker-compose.local.yml up -d
```

4. **Acceder a la aplicación**:

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/docs |

5. **Levantar el entorno de producción**:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost/api/v1 |
| Swagger Docs | http://localhost:3000/docs |
