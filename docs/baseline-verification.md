# Baseline Verification

Verified on 2026-10-25. Nothing in the application, dependencies or configuration was changed; findings are reported, not fixed.

## Environment

| Item             | Value                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Node.js          | `20.20.2` (CI uses `20.x`), npm `10.9.9`. The host default is Node 24, so Node 20 was run via `npm exec --package=node@20 --package=npm@10` with an isolated npm cache (`~/.npm` is root-owned). |
| MySQL            | `8.0.40` (official macOS arm64 build, throwaway data directory, port 3307). Docker was not available; CI uses the `mysql:8.0` service.                                                           |
| Database env     | Same variables as `.github/workflows/ci.yml` (`NODE_ENV=test`, `TZ=UTC`, `DB_USER=root`, `DB_DATABASE=DB_NAME=shopcore_test`), except `DB_PORT=3307`.                                            |
| `better-sqlite3` | Present in `devDependencies` (`^12.2.0`, locked `12.2.0`) although `config/database.ts` is MySQL-only. Noted only; not touched.                                                                  |

## Command Results

| Command                  | Result             | Key output                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`                 | Pass               | 661 packages installed; 31 audit findings. Warns that install scripts of `@swc/core` and `better-sqlite3` are not covered by `allowScripts`.                                                                                                                                                                                                           |
| `npm run lint`           | Pass with warnings | 0 errors, 3 warnings: unused `error` in `app/services/order_status_validator_service.ts:203`; `any` in `app/types/token.ts:12` and `tests/functional/orders/order_status_validator.spec.ts:399`.                                                                                                                                                       |
| `npm run typecheck`      | Pass               | `tsc --noEmit` succeeded.                                                                                                                                                                                                                                                                                                                              |
| `npm run build`          | Pass               | Adonis build succeeded.                                                                                                                                                                                                                                                                                                                                |
| `npm run format:check`   | Pass               | All files formatted.                                                                                                                                                                                                                                                                                                                                   |
| `node ace migration:run` | Pass               | `--force`; all 20 migrations applied on an empty MySQL 8.0.40 database in about 250 ms. `migration:status` shows all 20 completed.                                                                                                                                                                                                                     |
| `node ace db:seed`       | Pass               | `database/seeders/stock_seeder` completed.                                                                                                                                                                                                                                                                                                             |
| `npm test`               | Pass               | 51 of 51 tests passed in about 3 s (migrate and seed in bootstrap, rollback at the end). No failing tests. Suites: Customers invoice (create, show, update, null values), Edit user, Invoices create, Items create and show, OrderStatusValidatorService, Orders create (3 plus stock update), Show Order Details, Show Order Summaries, Users create. |
| `npm run test:coverage`  | Pass               | 51 of 51 passed. All files: 81.13% statements, 83.03% branches, 88.14% functions, 81.13% lines. `examples/order_status_validator_example.ts` and `server.ts` are at 0%.                                                                                                                                                                                |
| `npm audit`              | Fail (exit 1)      | 31 vulnerabilities: 1 low, 16 moderate, 12 high, 2 critical. No fixes applied.                                                                                                                                                                                                                                                                         |
| `npm outdated`           | Updates (exit 1)   | See the next section.                                                                                                                                                                                                                                                                                                                                  |

## `@adonisjs/*` Versions

"Current" and "Wanted" come from `npm outdated` (npm 10.9.9). "npm `latest` tag" is the dist-tag queried separately with `npm view <pkg> version`. `npm outdated` reports a "Latest" that stays within the installed major for some packages, so the two differ.

| Package                     | Current | Wanted | `npm outdated` Latest | npm `latest` tag |
| --------------------------- | ------- | ------ | --------------------- | ---------------- |
| `@adonisjs/auth`            | 9.5.1   | 9.6.0  | 9.6.0                 | 10.1.0           |
| `@adonisjs/bouncer`         | 3.1.6   | 3.1.6  | not listed            | 4.0.1            |
| `@adonisjs/core`            | 6.19.1  | 6.21.0 | 6.21.0                | 7.6.0            |
| `@adonisjs/cors`            | 2.2.1   | 2.2.1  | 3.0.0                 | 3.0.0            |
| `@adonisjs/lucid`           | 21.8.1  | 21.8.2 | 21.8.2                | 22.4.2           |
| `@adonisjs/assembler`       | 7.8.2   | 7.8.2  | not listed            | 8.6.0            |
| `@adonisjs/eslint-config`   | 2.1.2   | 2.1.2  | 3.1.0                 | 3.1.0            |
| `@adonisjs/prettier-config` | 1.4.5   | 1.5.0  | 1.5.0                 | 1.5.0            |
| `@adonisjs/tsconfig`        | 1.4.1   | 1.4.1  | 2.0.0                 | 2.0.0            |

`package.json` also pins `strtok3` `8.0.1` through overrides/resolutions.

## Assumptions

### a) Money column types: partly true

Confirmed with `information_schema` on MySQL 8.0.40:

| Table.column                                                  | MySQL type                      | Migration                                                                                   |
| ------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `stocks.price`, `stocks.vat_amount`, `stocks.vat_rate`        | `float(8,2)`                    | `1732819733082_create_stocks_table.ts`, `1756052725445_alter_stocks_table.ts`               |
| `order_details.item_price`, `vat_amount`, `vat_rate`          | `float(8,2)`                    | `1724865403735_create_order_details_table.ts`, `1756043893151_alter_order_details_table.ts` |
| `order_invoice_details.price_gross`, `vat_amount`, `vat_rate` | `float(8,2)`                    | `1753030696323_create_order_invoice_details_table.ts`                                       |
| `orders.delivery_price`, `orders.delivery_vat_rate`           | `decimal(10,2)`, `decimal(5,2)` | `1763240436065_alter_orders_table.ts`                                                       |

Item, VAT and invoice amounts are approximate floating point. Only delivery price and delivery VAT rate are exact decimals. `order_invoices` and `invoice_customers` have no amount columns.

### b) Foreign keys, unique constraints, indexes: partly true

Taken from `SHOW CREATE TABLE` on MySQL (full list of FKs from `information_schema.referential_constraints`).

Existing foreign keys (all `ON DELETE CASCADE`):

- `auth_access_tokens.tokenable_id` to `users.id`
- `order_details.order_id` to `orders.order_id`
- `order_delivery_addresses.order_id` to `orders.order_id`
- `order_invoice_details.invoice_id` to `order_invoices.invoice_id`
- `stock_photos.item_id` to `stocks.item_id`

Existing unique constraints:

- `users.email`, `users.uuid`
- `orders.order_id`
- `stocks.item_id`
- `order_invoices.invoice_id`
- `order_invoice_details (invoice_id, item_id)`

Other indexes:

- `orders.order_id`, `orders.user_id`
- `stocks.item_id` (duplicate of the unique key)
- `users.email` (duplicate of the unique key)
- `stock_photos.item_id`
- `order_invoice_details.invoice_id` and `item_id`
- `order_invoices (invoice_id, order_id)`
- `order_status_updates (order_id, status, created_at)` named `order_status_idx`
- InnoDB auto-created FK indexes on `order_details.order_id`, `order_delivery_addresses.order_id` and `auth_access_tokens.tokenable_id`

Gaps (no FK or constraint), each with the migration that defines the table:

- `orders.user_id` is a nullable `varchar(255)` with an index but no FK to `users.uuid` (`1763240436065_alter_orders_table.ts`; the earlier FK was dropped when the column became a UUID string).
- `orders.order_id` is nullable (unique, but NULL is allowed).
- `order_status_updates.order_id` has no FK (`1761481759958_create_order_status_updates_table.ts`).
- `order_invoices.order_id` has no FK or index of its own (`1753030696323` and later alter migrations; only the composite `invoice_order_idx` with `invoice_id` leading).
- `invoice_customers` has no FK and no index besides the primary key.
- `order_details.item_id` has no FK to `stocks.item_id`, and `(order_id, item_id)` is not unique.
- `stocks.available_qty` is a nullable `int` with no non-negative check.

### c) `OrderStatusUpdate` `beforeFetch` hook: confirmed

`app/models/order_status_update.ts:22-24` registers `@beforeFetch()` that calls `query.max('created_at')` on every model fetch query. That turns a model query into an aggregate that selects only `max(created_at)`, so rows are not returned as full `id` / `order_id` / `status` records, and a `where` with multiple orders collapses to one value. Verified on MySQL that `select max(created_at) from order_status_updates where order_id = 'o1'` returns a single timestamp even with two status rows. The model is not referenced anywhere else in `app/`, `tests/`, `start/` or `database/`, so the bug is latent and untested.

### d) `GET /api/auth/users`: refuted as "public listing"

- `start/routes.ts` (users resource, `index` only, under `/api/auth`) applies `middleware.user()`: authentication is required.
- `app/controllers/users_controller.ts` `index` runs `UserPolicy.view`, which allows any authenticated user, then calls `UserService.fetchUserData(auth.user.uuid)` (`app/services/user_service.ts`).
- The response is the caller's own profile only: `userId`, `email`, `firstName`, `lastName`, `createdAt`, `updatedAt`. No password, no list of other users.
- Related, unchanged: `POST /api/auth/token` (login) and `POST /api/auth/users` (registration) are unauthenticated, and no rate limiter is configured (`start/kernel.ts`).

### e) Node version in `.github/workflows`: confirmed

Every `setup-node` step in `.github/workflows/ci.yml` (lint, test, build) and `.github/workflows/code-quality.yml` uses `node-version: '20.x'`. `package.json` has no `engines` field. Node 20 is end-of-life.

### f) `OrdersController.store` uses separate transactions: confirmed

`app/controllers/orders_controller.ts` `store` calls `stockService.updateStock(...)` and then `orderService.createOrder(...)`:

- `StockService.updateStock` (`app/services/stock_service.ts:48`) first calls `isStockAvailable`, which reads stock with no transaction and no lock (`stock_service.ts:15`). It then opens its own `db.transaction` that decrements `availableQty` (a read-modify-write on a model loaded without `forUpdate`).
- `OrderService.createOrder` (`app/services/order_service.ts:29`) opens a second, independent `db.transaction`.
- If order creation fails after stock was decremented, the stock is not restored. Two concurrent requests can both pass the availability check.

## Not Verified

- Concurrency behavior in (f) was established by reading the code, not by a concurrent test.
- Coverage numbers come from one run.
- MySQL was 8.0.40 rather than the exact `mysql:8.0` image used by CI at the time of the run.
