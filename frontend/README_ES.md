# Frontend — Trading Orders UI

Aplicación de página única construida con Angular 21 usando componentes standalone, Angular Material para la UI, y Vite como herramienta de build subyacente. Proporciona una interfaz de trading con tema oscuro para gestionar órdenes de compra/venta.

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
  - [Estructura del Proyecto](#estructura-del-proyecto)
  - [Providers Globales](#providers-globales)
- [Componentes](#componentes)
- [Servicios](#servicios)
- [Rutas](#rutas)
- [Gestión de Estado](#gestión-de-estado)
- [UI y Estilos](#ui-y-estilos)
- [Configuración de Proxy](#configuración-de-proxy)
  - [Desarrollo](#desarrollo)
  - [Producción (Nginx)](#producción-nginx)
- [Configuración de Build](#configuración-de-build)
  - [Budgets](#budgets)
- [Scripts Disponibles](#scripts-disponibles)
- [Configuración TypeScript](#configuración-typescript)
- [Testing](#testing)
- [Dependencias](#dependencias)

---

## Stack Tecnológico

| Tecnología | Versión |
|-----------|---------|
| Angular | ^21.2.0 |
| Angular Material + CDK | ^21.2.4 |
| RxJS | ~7.8.0 |
| TypeScript | ~5.9.2 |
| Vitest | ^4.0.8 |
| Prettier | ^3.8.1 |
| Node.js | 24-alpine |

---

## Arquitectura

### Estructura del Proyecto

```
src/
├── main.ts                          # Bootstrap de Angular
├── styles.css                       # Estilos globales + tema oscuro + componentes compartidos
├── environments/
│   └── environment.ts               # Configuración de apiBasePath
└── app/
    ├── app.ts                       # Componente raíz (shell, sidebar, header)
    ├── app.html                     # Template raíz
    ├── app.css                      # Estilos raíz
    ├── app.routes.ts                # Rutas principales
    ├── app.config.ts                # Providers globales
    ├── core/
    │   ├── api/
    │   │   └── trade-orders-api.service.ts   # Servicio HTTP
    │   ├── models/
    │   │   └── trade-order.model.ts          # Interfaces y tipos
    │   └── trade-order.constants.ts          # Pares soportados, precios mock
    ├── features/
    │   └── trades/
    │       ├── trades.routes.ts              # Rutas del feature
    │       ├── trade-list/                   # Lista con tabla y paginación
    │       ├── trade-new/                    # Formulario de nueva orden
    │       └── trade-detail/                 # Vista/edición de orden
    └── shared/
        └── confirm-dialog/                   # Diálogo de confirmación reutilizable
```

Todos los componentes son **standalone** (sin NgModules).

### Providers Globales

Configurados en `app.config.ts`:

| Provider | Propósito |
|----------|-----------|
| `provideBrowserGlobalErrorListeners()` | Manejo global de errores del navegador |
| `provideHttpClient()` | Cliente HTTP de Angular |
| `provideAnimationsAsync()` | Animaciones asíncronas para Material |
| `importProvidersFrom(MatSnackBarModule)` | Notificaciones snack-bar |
| `provideRouter(routes)` | Enrutamiento de la aplicación |

---

## Componentes

| Componente | Selector | Ruta | Descripción |
|------------|----------|------|-------------|
| `App` | `app-root` | — | Shell principal: sidebar de navegación, header, `router-outlet` |
| `TradeListComponent` | `app-trade-list` | `/trades` | Tabla Material con paginación, acciones de ver/editar/eliminar |
| `TradeNewComponent` | `app-trade-new` | `/trades/new` | Formulario reactivo para crear órdenes con validación de precios |
| `TradeDetailComponent` | `app-trade-detail` | `/trades/:id` | Vista/edición de orden con actualización y eliminación |
| `ConfirmDialogComponent` | `app-confirm-dialog` | — | Diálogo Material reutilizable para confirmación de borrado |

---

## Servicios

**`TradeOrdersApiService`** (`providedIn: 'root'`):

URL base: `environment.apiBasePath` → `/api/v1`

| Método | HTTP | Endpoint | Retorna |
|--------|------|----------|---------|
| `list(page, limit)` | GET | `/api/v1/trade_orders` | Lista paginada |
| `getById(id)` | GET | `/api/v1/trade_orders/:id` | Orden individual |
| `create(body)` | POST | `/api/v1/trade_orders` | Orden creada |
| `update(id, body)` | PUT | `/api/v1/trade_orders/:id` | Orden actualizada |
| `delete(id)` | DELETE | `/api/v1/trade_orders/:id` | Respuesta de eliminación |

Las respuestas se desenvuelven del formato `ApiEnvelope<T>` extrayendo `.data`. Los errores se formatean con `mapError` / `formatApiErrorMessage`.

---

## Rutas

**Nivel principal** (`app.routes.ts`):

| Path | Destino |
|------|---------|
| `''` | Redirect a `trades` |
| `trades` | Feature lazy-loaded (`trades.routes.ts`) |
| `**` | Redirect a `trades` |

**Feature** (`trades.routes.ts`):

| Path | Componente | Descripción |
|------|-----------|-------------|
| `''` | `TradeListComponent` | Lista de órdenes |
| `new` | `TradeNewComponent` | Formulario de nueva orden |
| `:id` | `TradeDetailComponent` | Detalle/edición (`?edit=true` activa modo edición) |

---

## Gestión de Estado

No se utiliza un store centralizado (NgRx, Akita, etc.). El estado se gestiona localmente en cada componente:

- **Lista**: `BehaviorSubject` para paginación + `Subject` para refresco manual, combinados con `switchMap` de RxJS en un observable reactivo `state$` (loading/success/error).
- **Detalle / Nuevo**: Angular `signal()` y `computed()` para estado local de UI (carga, errores, formulario, submitting).

---

## UI y Estilos

- **Angular Material**: tabla, paginator, spinner, diálogo, snack-bar, tooltip, iconos.
- **Tema**: `azure-blue` prebuilt con overrides personalizados para tema oscuro.
- **Fuentes**: Roboto, Inter, Material Icons (Google Fonts vía `index.html`).
- **Estilos globales** (`styles.css`): propiedades CSS custom (`:root`), overrides de Material, estilos de componentes compartidos (`.btn`, `.custom-select`, `.input-with-suffix`, `.field-error`, `.pair-icon--*`).
- **Estilos por componente**: cada componente tiene su propio archivo `.css` encapsulado.

---

## Configuración de Proxy

### Desarrollo

`proxy.conf.json` — usado por `ng serve`:

```json
{
  "/api": {
    "target": "http://host.docker.internal:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Todas las peticiones a `/api` se redirigen al backend en el host Docker en el puerto 3000.

### Producción (Nginx)

`nginx.conf` — usado en la imagen Docker de producción:

- Escucha en puerto **80**.
- `location /api/` → `proxy_pass http://backend:3000` (red interna Docker).
- `location /` → `try_files $uri $uri/ /index.html` (fallback SPA).
- Resolver DNS: `127.0.0.11` (DNS embebido de Docker).

---

## Configuración de Build

**Builder**: `@angular/build:application` (Vite internamente)

| Opción | Valor |
|--------|-------|
| Entrada browser | `src/main.ts` |
| Estilos | `src/styles.css` |
| Assets | `public/**/*` |
| Output hashing (prod) | `all` |
| Source maps (dev) | `true` |
| Optimización (dev) | `false` |

### Budgets

Budgets del build de producción configurados en `angular.json`:

| Tipo | Warning | Error |
|------|---------|-------|
| `initial` | 500 kB | 1 MB |
| `anyComponentStyle` | 4 kB | 8 kB |

El servidor de desarrollo se enlaza a `host: 0.0.0.0` para accesibilidad desde contenedores.

---

## Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm start` | `ng serve` | Iniciar servidor dev con proxy |
| `npm run build` | `ng build` | Build de producción (config por defecto) |
| `npm run watch` | `ng build --watch --configuration development` | Build en modo watch |
| `npm test` | `ng test` | Ejecutar tests con Vitest |

---

## Configuración TypeScript

**`tsconfig.json`** (base):

| Opción | Valor |
|--------|-------|
| `target` | ES2022 |
| `module` | preserve |
| `strict` | true |
| `isolatedModules` | true |
| `experimentalDecorators` | true |

**Opciones del compilador Angular**: `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`.

**`tsconfig.app.json`**: extiende la base, compila `src/**/*.ts` excluyendo specs, output en `out-tsc/app`.

---

## Testing

- **Framework**: Vitest 4 con jsdom, integrado vía `@angular/build:unit-test`.
- **Config**: `tsconfig.spec.json` con tipos `vitest/globals`.

```bash
npm test
```

---

## Dependencias

<details>
<summary>Dependencias de producción</summary>

| Paquete | Versión |
|---------|---------|
| `@angular/animations` | ^21.2.6 |
| `@angular/cdk` | ^21.2.4 |
| `@angular/common` | ^21.2.0 |
| `@angular/compiler` | ^21.2.0 |
| `@angular/core` | ^21.2.0 |
| `@angular/forms` | ^21.2.0 |
| `@angular/material` | ^21.2.4 |
| `@angular/platform-browser` | ^21.2.0 |
| `@angular/router` | ^21.2.0 |
| `rxjs` | ~7.8.0 |
| `tslib` | ^2.3.0 |

</details>

<details>
<summary>Dependencias de desarrollo</summary>

| Paquete | Versión |
|---------|---------|
| `@angular/build` | ^21.2.3 |
| `@angular/cli` | ^21.2.3 |
| `@angular/compiler-cli` | ^21.2.0 |
| `jsdom` | ^28.0.0 |
| `prettier` | ^3.8.1 |
| `typescript` | ~5.9.2 |
| `vitest` | ^4.0.8 |

</details>
