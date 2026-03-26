# Backend — Trading Orders API

API REST construida con NestJS 11 siguiendo una arquitectura por capas de Domain-Driven Design (DDD). Proporciona operaciones CRUD para órdenes de trading, autenticación basada en JWT y documentación Swagger.

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
  - [Estructura de Módulos](#estructura-de-módulos)
  - [Módulos Registrados](#módulos-registrados)
- [Endpoints API](#endpoints-api)
- [Autenticación y Autorización](#autenticación-y-autorización)
- [Base de Datos](#base-de-datos)
- [Caché](#caché)
- [Validación](#validación)
- [Interceptors y Filtros Globales](#interceptors-y-filtros-globales)
- [Alias de Rutas](#alias-de-rutas)
- [Scripts Disponibles](#scripts-disponibles)
- [Variables de Entorno](#variables-de-entorno)
- [Documentación Swagger](#documentación-swagger)
- [Testing](#testing)
- [Dependencias](#dependencias)

---

## Stack Tecnológico

| Tecnología | Versión |
|-----------|---------|
| NestJS | ^11.0.1 |
| TypeORM | ^0.3.28 |
| PostgreSQL (driver pg) | ^8.20.0 |
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

## Arquitectura

### Estructura de Módulos

Cada módulo de negocio sigue una estructura de tres capas inspirada en DDD:

```
module/
├── domain/
│   ├── entities/          # Entidades de dominio (+ decoradores TypeORM)
│   ├── repositories/      # Interfaces/contratos de repositorio (puertos)
│   └── validation/        # Reglas de negocio (pares soportados, precios)
├── application/
│   └── use-cases/         # Casos de uso (lógica de aplicación)
└── infrastructure/
    ├── controllers/       # Controladores HTTP + definición de módulo NestJS
    ├── dto/               # DTOs de request/response
    ├── mappers/           # Mapeo entre capas
    └── repositories/      # Implementación concreta de repositorios (adaptadores)
```

Los repositorios se inyectan mediante tokens (`USER_REPOSITORY`, `TRADE_ORDER_REPOSITORY`), desacoplando la capa de dominio de la infraestructura.

### Módulos Registrados

Definidos en `app.module.ts`:

| Módulo | Responsabilidad |
|--------|----------------|
| **CustomConfigModule** | Carga y validación de variables de entorno con `class-validator`. |
| **DatabaseModule** | Configuración global de TypeORM (PostgreSQL) y caché (Redis/Keyv). |
| **AuthModule** | Login y registro. Genera JWT con expiración de 60 minutos. |
| **UsersModule** | Gestión de usuarios. Casos de uso: crear usuario, buscar por email. |
| **TradeOrderModule** | CRUD completo de órdenes de trading con paginación y soft delete. |

**Providers Globales** (registrados en `AppModule`):

| Provider | Tipo | Propósito |
|----------|------|-----------|
| `AllExceptionFilter` | `APP_FILTER` | Captura todas las excepciones |
| `TimeOutInterceptor` | `APP_INTERCEPTOR` | Timeout de 3 segundos por request |
| `LoggingInterceptor` | `APP_INTERCEPTOR` | Log de request/response con UUID de correlación |
| `ResponseInterceptor` | `APP_INTERCEPTOR` | Envuelve respuestas en envelope estándar |

---

## Endpoints API

Prefijo global: `/api/v1`

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Registro de usuario |
| `POST` | `/api/v1/auth/login` | Login (retorna JWT `accessToken`) |
| `POST` | `/api/v1/trade_orders` | Crear orden de trading |
| `GET` | `/api/v1/trade_orders` | Listar órdenes (paginado: `?page=1&limit=10`) |
| `GET` | `/api/v1/trade_orders/:id` | Obtener orden por ID (UUID) |
| `PUT` | `/api/v1/trade_orders/:id` | Actualizar orden |
| `DELETE` | `/api/v1/trade_orders/:id` | Eliminar orden (soft delete) |

---

## Autenticación y Autorización

- **Estrategia**: Bearer JWT vía `passport-jwt`.
- **Firma**: `JWT_SECRET` (mínimo 12 caracteres) con expiración de 60 minutos.
- **Contraseñas**: hash con `bcrypt`.
- **Guards**:
  - `AuthGuard('jwt')` — Validación de token JWT.
  - `RolesGuard` — Verificación de roles (`admin`, `user`, `doctor`) mediante decorador `@Roles()`.

---

## Base de Datos

**Motor**: PostgreSQL 17.5

Ambas entidades extienden `CustomBaseEntity` (`id` UUID, `createdAt`, `updatedAt`, `deletedAt`):

**UserEntity** (tabla: `users`):

| Campo | Tipo | Notas |
|-------|------|-------|
| `email` | string | Único |
| `password` | string | Hash bcrypt |
| `role` | enum | `admin` \| `user` \| `doctor` |
| `firstName` | string | Opcional |
| `lastName` | string | Opcional |

**TradeOrderEntity** (tabla: `trade_order`):

| Campo | Tipo | Notas |
|-------|------|-------|
| `side` | enum | `buy` \| `sell` |
| `type` | enum | `limit` \| `market` \| `stop` |
| `amount` | decimal | — |
| `price` | decimal | — |
| `status` | enum | `open` \| `cancelled` \| `executed` |
| `pair` | varchar(32) | Par de trading (ej. BTC/USD) |

**Sincronización**: automática en desarrollo (`synchronize: true`), deshabilitada en producción. Migraciones habilitadas (`migrationsRun: true`).

---

## Caché

Redis 8.0 mediante `@keyv/redis`, configurado en `DatabaseModule` como módulo global.

---

## Validación

- **Pipe Global** (en `main.ts`): `ValidationPipe` con `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- **DTOs**: Decoradores `class-validator` en DTOs de entrada.
- **Reglas de negocio**: `assertTradeOrderConstraints` valida pares soportados y coherencia entre precios (límite/stop vs mercado).

---

## Interceptors y Filtros Globales

Orden de ejecución según registro en `AppModule`:

| Componente | Propósito |
|------------|-----------|
| `AllExceptionFilter` | Captura todas las excepciones → `{ status, data: null, errors: { error, path } }` |
| `TimeOutInterceptor` | Timeout de 3 segundos por request (hardcodeado) |
| `LoggingInterceptor` | Log de request/response con UUID de correlación, user-agent, IP y duración |
| `ResponseInterceptor` | Envuelve respuestas exitosas → `{ status, data, errors: null }` |

---

## Alias de Rutas

Configurados en `tsconfig.json` y en `moduleNameMapper` de Jest:

| Alias | Apunta a |
|-------|----------|
| `@common/*` | `src/common/*` |
| `@config/*` | `src/config/*` |
| `@database/*` | `src/database/*` |
| `@modules/*` | `src/modules/*` |

---

## Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run build` | `nest build` | Compilar a `dist/` |
| `npm run start` | `nest start` | Iniciar en modo producción |
| `npm run start:dev` | `nest start --watch` | Iniciar con hot-reload |
| `npm run start:debug` | `nest start --debug --watch` | Iniciar con debugger |
| `npm run start:prod` | `node dist/main` | Ejecutar build compilado |
| `npm run lint` | `eslint ... --fix` | Lint y auto-fix |
| `npm run format` | `prettier --write ...` | Formatear archivos fuente |
| `npm test` | `jest` | Ejecutar tests unitarios |
| `npm run test:watch` | `jest --watch` | Tests en modo watch |
| `npm run test:cov` | `jest --coverage` | Tests con cobertura |
| `npm run test:debug` | `node --inspect-brk ...` | Debug de tests |
| `npm run test:e2e` | `jest --config ./test/jest-e2e.json` | Tests end-to-end |

---

## Variables de Entorno

Se incluye un archivo `.env.example` como plantilla. Cópialo o renómbralo a `.env` antes de iniciar la aplicación:

```bash
cp .env.example .env   # Ajustar valores según sea necesario
```

Se cargan desde `.env` y se validan al iniciar la aplicación con `class-validator`:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno (`development` \| `production` \| `test`) | `development` |
| `API_PORT` | Puerto del servidor | `3000` |
| `TIMEOUT` | Timeout (configurado, no usado en interceptor) | `5000` |
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

> La contraseña de Redis en `.env` (`CACHE_PASSWORD`) debe coincidir con `requirepass` en `redis.conf`.

---

## Documentación Swagger

La documentación interactiva de la API está disponible en `/docs` una vez el servidor esté corriendo.

- **Título**: Template Service's API
- **Auth**: Bearer token (configurado con `.addBearerAuth()`)
- **Modelos extra**: `CreateTradeOrderDto`, `UpdateTradeOrderDto`, `PaginationQueryDto`, `TradeOrderResponseItemDto`, `PaginatedTradeOrdersResponseDto`, `SoftDeleteTradeOrderResponseDto`

| Entorno | URL |
|---------|-----|
| Desarrollo | http://localhost:3000/docs |
| Producción | http://localhost:3000/docs |

---

## Testing

- **Unit/Integration**: Jest 30 con `ts-jest`. Specs junto al código fuente (`*.spec.ts`).
- **E2E**: Supertest con configuración separada (`test/jest-e2e.json`).
- **Cobertura**: output en directorio `coverage/`.

```bash
npm test           # Tests unitarios
npm run test:watch # Modo watch
npm run test:cov   # Reporte de cobertura
npm run test:e2e   # Tests end-to-end
```

---

## Dependencias

<details>
<summary>Dependencias de producción</summary>

| Paquete | Versión |
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
<summary>Dependencias de desarrollo</summary>

| Paquete | Versión |
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
