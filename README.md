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

Copy `.env.example` to `.env`, then generate a secure application key:

```
cp .env.example .env
node ace generate:key
```

## Preparing the MySQL database

The application requires MySQL 8.0. Start a local database with Docker:

```
docker run --name shopcore-mysql \
  -e MYSQL_ROOT_PASSWORD=local_dev_password \
  -e MYSQL_DATABASE=shopcore_test \
  -p 3306:3306 \
  -d mysql:8.0
```

Configure the MySQL connection in `.env` using `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, and `DB_DATABASE`. For the Docker command above, use
`127.0.0.1`, `3306`, `root`, `local_dev_password`, and `shopcore_test`,
respectively. Wait until MySQL is ready before running database commands:

```
docker exec shopcore-mysql mysqladmin ping -h 127.0.0.1 -uroot -plocal_dev_password --silent
```

## Preparing Redis

Rate-limit counters are stored in Redis. Start a local Redis instance:

```
docker run --name shopcore-redis -p 6379:6379 -d redis:7-alpine
```

Configure `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, and
`REDIS_KEY_PREFIX` in `.env`. The application defaults to `LIMITER_STORE=redis`,
uses `LIMITER_KEY_PREFIX` to namespace limiter keys, and sets counter expiry from
`LIMITER_WINDOW_SECONDS` (60 seconds by default). On Redis connection failures,
requests to ordinary endpoints are logged at fatal level and continue without
rate limiting. Endpoints that require an `Idempotency-Key` must opt into the
fail-closed limiter policy and return a logged `503` during Redis outages,
preventing duplicate non-idempotent operations.

The Redis limiter clears its selected database in functional-test setup. Use a
dedicated Redis database for tests (for example, `REDIS_DB=1`) and do not point
the test environment at a Redis database shared with other applications.

Run migrations to create the tables, then seed the example stock items:

```
node ace migration:run
node ace db:seed
```

## Running tests locally

Use the MySQL and Redis instances above and set their connection variables in
`.env`. Set `REDIS_DB=1` for the functional tests so their limiter cleanup is
isolated from application data. The test bootstrap runs migrations and seeders
before the suite:

```
npm test
```

The CI workflow runs `npm test` against MySQL and Redis services. To remove the
local database containers when finished, run
`docker rm -f shopcore-mysql shopcore-redis`.

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
