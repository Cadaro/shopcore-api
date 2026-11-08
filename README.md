[![Node.js CI](https://github.com/Cadaro/shopcore-api/actions/workflows/ci.yml/badge.svg)](https://github.com/Cadaro/shopcore-api/actions/workflows/ci.yml)
[![Code Quality](https://github.com/Cadaro/shopcore-api/actions/workflows/code-quality.yml/badge.svg)](https://github.com/Cadaro/shopcore-api/actions/workflows/code-quality.yml)

# Description

**ShopCore API** is a modern, lightweight e-commerce API platform built with [AdonisJs](https://adonisjs.com). It provides essential functionalities for running an online store, including:

- Product inventory management
- User authentication and accounts
- Order processing
- RESTful API architecture
- Scalable and maintainable codebase

This platform is actively developed and expanding with new features to meet various e-commerce needs. Perfect for small to medium-sized businesses looking for a customizable, API-first e-commerce solution.

# Roles and permissions

The API supports `customer`, `staff`, and `admin` roles. Customers can access customer-facing order, product, profile, and invoice-data operations. Staff can also manage products and orders. Admins have all permissions, including assigning roles with `PATCH /api/auth/users/{userId}/role`. Route permissions are documented in the OpenAPI specification.

# Upcoming Features

- 🚚 Multiple courier gateway integrations
- 💳 Multiple payment gateway integrations
- 📦 Multi-step order processing
- 📨 Order notifications
- 📦 Product variants and attributes
- 🏷️ Dynamic pricing rules
- 🌐 Multi-language support
- 🛒 Advanced shopping cart with saved items
- 📊 Sales analytics and reporting

## Installation

Requires Node.js 24 or newer.

```
git clone https://github.com/Cadaro/shopcore-api.git
npm ci
```

Create separate local configuration files, then generate an application key:

```
cp .env.example .env
cp .env.example .env.development.local
cp .env.test.example .env.test
node ace generate:key
```

Copy the generated `APP_KEY` from `.env` into both local configuration files.
Set your own local database and Redis passwords in those files. These files are
ignored by Git. Docker Compose v2 with support for `up --wait` is required.

## Local development

Start the development MySQL and Redis containers and the API:

```
npm run dev
```

The API listens on port 3334. MySQL and Redis use ports 3306 and 6379.
On the first run, leave the containers running and run migrations and the
development seed in another terminal:

```
NODE_ENV=development node ace migration:run
NODE_ENV=development node ace db:seed
```

Stop the API with Ctrl+C. To stop the containers without deleting their data:

```
npm run dev:stop
```

Compose initializes MySQL credentials and the database only when a volume is
first created. Changing credentials later requires updating the existing MySQL
instance or explicitly recreating its volume. The `shopcore-dev` and
`shopcore-test` projects have separate volumes. Volumes from older Compose
project names are not deleted or automatically migrated.

Rate-limit counters use Redis, `LIMITER_KEY_PREFIX`, and
`LIMITER_WINDOW_SECONDS`. On Redis connection failures, ordinary endpoints log
at fatal level and continue without rate limiting. Endpoints requiring an
`Idempotency-Key` must opt into the fail-closed policy.

## Running tests locally

Tests use separate MySQL and Redis instances on ports 3307 and 6380, and a
test HTTP server on port 3333. They can run while the development API is
running:

```
npm test
```

The command starts the test services, waits for health checks, and runs tests.
The test bootstrap deletes **all tables and views** in the dedicated
`shopcore_test` database and flushes Redis database 1 before running migrations
and seeders. Cleanup runs again after the suite. If the process is interrupted,
the next run resets the services before testing. The reset refuses unexpected
hosts, ports, database names, and Redis databases. Never use these test
databases for other data.

Use `npm run test:watch` for watch mode or `npm run test:coverage` for coverage.
To stop the test containers without deleting volumes, run `npm run test:stop`.
To explicitly remove the test containers **and their volumes**, run
`npm run test:clean`.

In CI, `npm run test:ci` and `npm run test:coverage:ci` use separately provided
services instead of starting Compose. The CI configuration uses MySQL on 3306
and Redis on 6379, with the same test database names.

### Rate-limit rollback

The `rate_limits` table migration remains available for rollback. To switch back
to database-backed counters, set `LIMITER_STORE=database` and restart the
application. The limiter does not copy active Redis counters into MySQL, so
requests receive a fresh database-backed window after the switch. Redis keys
expire automatically according to the configured limiter window.

### Money storage migration

Stop application writes while running or rolling back migrations: MySQL schema changes
commit implicitly. Monetary columns use `DECIMAL(14,0)` minor units; API amounts remain
major-unit JSON numbers with at most two decimal places. Conversion and VAT calculations
round to the nearest minor unit, with ties away from zero. VAT rates are decimal fractions.
The migration converts legacy two-decimal values; precision already lost in old float
columns cannot be recovered. Rollback is rejected if amounts exceed the original column
ranges. Back up the database before migrating.

## Launch development mode

To start server in development mode, run

```
npm run dev
```

## List of available routes

To list all available routes, run

```
node ace list:routes
```

## Examples

1. List all items in online-shop

```
curl --location 'localhost:3333/api/stocks' \
```

2. Create user account

```
curl --location 'localhost:3333/api/auth/users' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test@exampleemail.com",
    "password": "testpassword1"
}'
```

3. Authenticate user to fetch bearer token

```
curl --location 'localhost:3333/api/auth/token' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "test@exampleemail.com",
    "password": "testpassword1"
}'
```

## Additional documentation

API documentation follows OpenAPI 3.1.0 specification and is available at:

- Repository URL: `https://github.com/Cadaro/shopcore-api/blob/master/docs/openapi.yaml` [openapi.yaml](https://github.com/Cadaro/shopcore-api/blob/master/docs/openapi.yaml)
- Interactive documentation: Import the OpenAPI specification from `docs/openapi.yaml` into [Swagger Editor Next](https://editor-next.swagger.io)

For implementation examples and best practices, refer to our [Wiki](https://github.com/Cadaro/shopcore-api/wiki) (coming soon).
