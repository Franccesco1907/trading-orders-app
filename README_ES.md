# Trading Orders

Interfaz Angular y API NestJS para crear, listar, editar y eliminar lógicamente órdenes. PostgreSQL persiste datos; Redis respalda la caché. [English](README.md).

## Desarrollo local

Usa Docker Compose, o Node.js 24 para las verificaciones fuera de contenedores.

```sh
cp backend/.env.example backend/.env
docker compose -f docker-compose.local.yml up --build
```

Interfaz: `http://localhost:4200`; API: `http://localhost:3000/api/v1`; Swagger: `http://localhost:3000/docs`.

Mantén consistentes las credenciales y bases de `DATABASE_*` y `POSTGRES_*`. `CACHE_PASSWORD` debe coincidir con `requirepass` en `backend/redis.conf`. Sustituye credenciales de ejemplo y `JWT_SECRET` antes de exponer servicios.

El proxy de desarrollo apunta a `host.docker.internal:3000` (Docker Desktop). Para ejecutar fuera de Docker, cambia `frontend/proxy.conf.json` a localhost y los hosts de base/caché en `backend/.env` a localhost. En contenedores Linux, configura un destino backend resoluble.

## Verificaciones y contratos

Ejecuta los comandos desde el directorio indicado:

| Directorio | Comandos |
| --- | --- |
| `backend` | `npm ci`, `npm test -- --runInBand`, `npm run build`; `npm run test:e2e` necesita PostgreSQL/Redis configurados |
| `frontend` | `npm ci`, `npm test -- --watch=false`, `npm run build` |

- Los contratos están en Swagger y `backend/src/modules/trade-orders/infrastructure/dto`; las respuestas usan `{ status, data, errors }`.
- Los módulos backend separan dominio, casos de uso e infraestructura; conserva las interfaces y tokens de repositorio en ese límite.
- Las pantallas están en `frontend/src/app/features` y usan estado local con signals/RxJS; `core/api` extrae los datos de las respuestas.
- Hay infraestructura de registro/login JWT; revisa los guards del controlador antes de asumir que un endpoint está protegido.

## Configuración de producción

`docker-compose.prod.yml` publica la interfaz en el puerto 80 y redirige `/api` mediante Nginx. El Dockerfile backend copia `backend/.env` a la imagen: trátala como sensible y reconstruye tras cambiar configuración. Usa `NODE_ENV=production` para desactivar la sincronización de esquema TypeORM. No se incluye una migración de esquema; prepara la base antes de arrancar. La configuración de ejemplo requiere revisión antes de exponerse como servicio de producción.

[Licencia](LICENSE).
