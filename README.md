# Trading Orders

Angular UI and NestJS API for creating, listing, editing and soft-deleting trading orders. PostgreSQL stores data; Redis backs the cache. [Español](README_ES.md).

## Local development

Use Docker Compose, or Node.js 24 for host-side checks.

```sh
cp backend/.env.example backend/.env
docker compose -f docker-compose.local.yml up --build
```

Open `http://localhost:4200`; API: `http://localhost:3000/api/v1`; Swagger: `http://localhost:3000/docs`.

Keep `DATABASE_*` and `POSTGRES_*` credentials/database names consistent. `CACHE_PASSWORD` must match `requirepass` in `backend/redis.conf`. Replace sample credentials and `JWT_SECRET` before exposing the app.

The frontend development proxy targets `host.docker.internal:3000` (Docker Desktop). For host-only development, point `frontend/proxy.conf.json` at localhost and set database/cache hosts in `backend/.env` to localhost. For Linux containers, configure a resolvable backend target.

## Checks and contracts

Run commands from the indicated directory:

| Directory | Commands |
| --- | --- |
| `backend` | `npm ci`, `npm test -- --runInBand`, `npm run build`; `npm run test:e2e` needs configured PostgreSQL/Redis |
| `frontend` | `npm ci`, `npm test -- --watch=false`, `npm run build` |

- API contracts are in Swagger and `backend/src/modules/trade-orders/infrastructure/dto`; responses use `{ status, data, errors }`.
- Backend modules separate domain, use cases and infrastructure. Keep repository interfaces/injection tokens at that boundary.
- Frontend features live in `frontend/src/app/features`; state is local via signals/RxJS. `core/api` unwraps response envelopes.
- JWT login/registration infrastructure exists; inspect controller guards before assuming an endpoint is protected.

## Production configuration

`docker-compose.prod.yml` serves the frontend on port 80 and proxies `/api` through Nginx. The backend Dockerfile copies `backend/.env` into the image: treat it as sensitive and rebuild after configuration changes. Set `NODE_ENV=production` to disable TypeORM schema synchronization. No schema migration is supplied; provision the database schema before startup. Do not expose the sample setup as a hardened production service.

[License](LICENSE).
