# Frontend — Trading Orders UI

Single-page application built with Angular 21 using standalone components, Angular Material for the UI, and Vite as the underlying build tool. Provides a dark-themed trading interface for managing buy/sell orders.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Global Providers](#global-providers)
- [Components](#components)
- [Services](#services)
- [Routing](#routing)
- [State Management](#state-management)
- [UI & Styling](#ui--styling)
- [Proxy Configuration](#proxy-configuration)
  - [Development](#development)
  - [Production (Nginx)](#production-nginx)
- [Build Configuration](#build-configuration)
  - [Budgets](#budgets)
- [Available Scripts](#available-scripts)
- [TypeScript Configuration](#typescript-configuration)
- [Testing](#testing)
- [Dependencies](#dependencies)

---

## Tech Stack

| Technology | Version |
|-----------|---------|
| Angular | ^21.2.0 |
| Angular Material + CDK | ^21.2.4 |
| RxJS | ~7.8.0 |
| TypeScript | ~5.9.2 |
| Vitest | ^4.0.8 |
| Prettier | ^3.8.1 |
| Node.js | 24-alpine |

---

## Architecture

### Project Structure

```
src/
├── main.ts                          # Angular bootstrap
├── styles.css                       # Global styles + dark theme + shared components
├── environments/
│   └── environment.ts               # apiBasePath configuration
└── app/
    ├── app.ts                       # Root component (shell, sidebar, header)
    ├── app.html                     # Root template
    ├── app.css                      # Root styles
    ├── app.routes.ts                # Top-level routes
    ├── app.config.ts                # Global providers
    ├── core/
    │   ├── api/
    │   │   └── trade-orders-api.service.ts   # HTTP service
    │   ├── models/
    │   │   └── trade-order.model.ts          # Interfaces & types
    │   └── trade-order.constants.ts          # Supported pairs, mock prices
    ├── features/
    │   └── trades/
    │       ├── trades.routes.ts              # Feature routes
    │       ├── trade-list/                   # List with table & pagination
    │       ├── trade-new/                    # Create order form
    │       └── trade-detail/                 # View/edit order
    └── shared/
        └── confirm-dialog/                   # Reusable delete confirmation
```

All components are **standalone** (no NgModules).

### Global Providers

Configured in `app.config.ts`:

| Provider | Purpose |
|----------|---------|
| `provideBrowserGlobalErrorListeners()` | Global browser error handling |
| `provideHttpClient()` | Angular HTTP client |
| `provideAnimationsAsync()` | Async animations for Material |
| `importProvidersFrom(MatSnackBarModule)` | Snack-bar notifications |
| `provideRouter(routes)` | Application routing |

---

## Components

| Component | Selector | Route | Description |
|-----------|----------|-------|-------------|
| `App` | `app-root` | — | Main shell: sidebar navigation, header, `router-outlet` |
| `TradeListComponent` | `app-trade-list` | `/trades` | Material table with pagination, view/edit/delete actions |
| `TradeNewComponent` | `app-trade-new` | `/trades/new` | Reactive form for creating orders with price validation |
| `TradeDetailComponent` | `app-trade-detail` | `/trades/:id` | Order view/edit with update and delete |
| `ConfirmDialogComponent` | `app-confirm-dialog` | — | Reusable Material dialog for delete confirmation |

---

## Services

**`TradeOrdersApiService`** (`providedIn: 'root'`):

Base URL: `environment.apiBasePath` → `/api/v1`

| Method | HTTP | Endpoint | Returns |
|--------|------|----------|---------|
| `list(page, limit)` | GET | `/api/v1/trade_orders` | Paginated list |
| `getById(id)` | GET | `/api/v1/trade_orders/:id` | Single order |
| `create(body)` | POST | `/api/v1/trade_orders` | Created order |
| `update(id, body)` | PUT | `/api/v1/trade_orders/:id` | Updated order |
| `delete(id)` | DELETE | `/api/v1/trade_orders/:id` | Deletion response |

Responses are unwrapped from the `ApiEnvelope<T>` format by extracting `.data`. Errors are formatted via `mapError` / `formatApiErrorMessage`.

---

## Routing

**Top-level** (`app.routes.ts`):

| Path | Target |
|------|--------|
| `''` | Redirect to `trades` |
| `trades` | Lazy-loaded feature (`trades.routes.ts`) |
| `**` | Redirect to `trades` |

**Feature** (`trades.routes.ts`):

| Path | Component | Description |
|------|-----------|-------------|
| `''` | `TradeListComponent` | Order list |
| `new` | `TradeNewComponent` | New order form |
| `:id` | `TradeDetailComponent` | Detail/edit (`?edit=true` enables edit mode) |

---

## State Management

No centralized store is used (NgRx, Akita, etc.). State is managed locally within each component:

- **List**: `BehaviorSubject` for pagination + `Subject` for manual refresh, combined with RxJS `switchMap` into a reactive `state$` observable (loading/success/error).
- **Detail / New**: Angular `signal()` and `computed()` for local UI state (loading, errors, form, submitting).

---

## UI & Styling

- **Angular Material**: table, paginator, spinner, dialog, snack-bar, tooltip, icons.
- **Theme**: `azure-blue` prebuilt theme with custom dark mode overrides.
- **Fonts**: Roboto, Inter, Material Icons (Google Fonts via `index.html`).
- **Global styles** (`styles.css`): CSS custom properties (`:root`), Material overrides, shared component styles (`.btn`, `.custom-select`, `.input-with-suffix`, `.field-error`, `.pair-icon--*`).
- **Component styles**: each component has its own scoped `.css` file.

---

## Proxy Configuration

### Development

`proxy.conf.json` — used by `ng serve`:

```json
{
  "/api": {
    "target": "http://host.docker.internal:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

All `/api` requests are proxied to the backend running on the Docker host at port 3000.

### Production (Nginx)

`nginx.conf` — used in the production Docker image:

- Listens on port **80**.
- `location /api/` → `proxy_pass http://backend:3000` (Docker internal network).
- `location /` → `try_files $uri $uri/ /index.html` (SPA fallback).
- DNS resolver: `127.0.0.11` (Docker embedded DNS).

---

## Build Configuration

**Builder**: `@angular/build:application` (Vite under the hood)

| Option | Value |
|--------|-------|
| Browser entry | `src/main.ts` |
| Styles | `src/styles.css` |
| Assets | `public/**/*` |
| Output hashing (prod) | `all` |
| Source maps (dev) | `true` |
| Optimization (dev) | `false` |

### Budgets

Production build budgets configured in `angular.json`:

| Type | Warning | Error |
|------|---------|-------|
| `initial` | 500 kB | 1 MB |
| `anyComponentStyle` | 4 kB | 8 kB |

Dev server binds to `host: 0.0.0.0` for container accessibility.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `ng serve` | Start dev server with proxy |
| `npm run build` | `ng build` | Production build (default config) |
| `npm run watch` | `ng build --watch --configuration development` | Build in watch mode |
| `npm test` | `ng test` | Run unit tests with Vitest |

---

## TypeScript Configuration

**`tsconfig.json`** (base):

| Option | Value |
|--------|-------|
| `target` | ES2022 |
| `module` | preserve |
| `strict` | true |
| `isolatedModules` | true |
| `experimentalDecorators` | true |

**Angular compiler options**: `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`.

**`tsconfig.app.json`**: extends base, compiles `src/**/*.ts` excluding specs, output to `out-tsc/app`.

---

## Testing

- **Framework**: Vitest 4 with jsdom, integrated via `@angular/build:unit-test`.
- **Config**: `tsconfig.spec.json` with `vitest/globals` types.

```bash
npm test
```

---

## Dependencies

<details>
<summary>Production dependencies</summary>

| Package | Version |
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
<summary>Development dependencies</summary>

| Package | Version |
|---------|---------|
| `@angular/build` | ^21.2.3 |
| `@angular/cli` | ^21.2.3 |
| `@angular/compiler-cli` | ^21.2.0 |
| `jsdom` | ^28.0.0 |
| `prettier` | ^3.8.1 |
| `typescript` | ~5.9.2 |
| `vitest` | ^4.0.8 |

</details>
