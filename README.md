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

# Guest sessions and rate limits

Anonymous stock requests require a guest session. Create one with `POST /api/v1/guests`, then send its `guest_token` as the `X-Guest-Token` header on anonymous stock requests. Guest tokens are stored in Redis and expire after 24 hours by default. The guest-session endpoint is limited by client IP; business endpoint limits use customer access tokens or guest tokens, with separate read and write buckets. Defaults are 600 customer reads and 120 customer writes per five minutes, and 300 guest reads and 80 guest writes per five minutes. These values, the guest-session TTL, and guest creation IP limit can be configured through environment variables. Throttled responses do not disclose retry timing in a `Retry-After` header; requests are accepted again after the applicable rate-limit window expires.

# Stock SKU generation

When creating stock, the API generates a 10-character uppercase alphanumeric SKU from the product name, required `color`, optional `size`, and a random suffix. The format is three characters for the name, two for color, two for size, and three random characters. `NO-SIZE` uses `NS`; an omitted or empty size uses `XX`. Any supplied `sku` is ignored, and updates preserve the existing SKU.

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

The API listens on port 3333. MySQL and Redis use ports 3306 and 6379.
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
`LIMITER_WINDOW_SECONDS`. Login requests are also limited per normalized email
using a SHA-256 Redis key; `AUTH_LOGIN_ACCOUNT_LIMIT` and
`AUTH_LOGIN_ACCOUNT_WINDOW_SECONDS` default to 5 failed attempts per 15 minutes.
A successful login clears that account's failed-attempt counter.

### Reverse proxy deployments

AdonisJS trusts only the proxy addresses listed in `TRUSTED_PROXIES`. The
default `loopback` value is suitable for local development; set this variable to
the exact proxy addresses or CIDRs used by the deployment (for example,
`172.18.0.0/16,127.0.0.1,::1` for a known Docker network). Inspect the actual
Docker network subnet rather than copying that example blindly. Do not use
`true` or trust all addresses: clients could forge forwarded IP headers.

Configure Nginx to pass the client and scheme information to the API:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host $host;
```

AdonisJS resolves `request.ip()` from `X-Forwarded-For` when the connecting
proxy is trusted. If Cloudflare is in front of Nginx, configure Nginx's real-IP
module to use `CF-Connecting-IP` and trust only Cloudflare's published proxy
CIDRs; Nginx can then forward the resolved address using the headers above.
Do not have the API trust `CF-Connecting-IP` directly from arbitrary clients.

On Redis connection failures, ordinary endpoints log at fatal level and
continue without rate limiting. Endpoints requiring an `Idempotency-Key` must
opt into the fail-closed policy.

## Running tests locally

Tests use separate MySQL and Redis instances on ports 3307 and 6380, and a
test HTTP server on port 3334. They can run while the development API is
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
curl --location --request POST 'localhost:3333/api/v1/guests'
```

Use the returned `guest_token` to list items:

```
curl --location 'localhost:3333/api/stocks' \
--header 'X-Guest-Token: <guest_token>'
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
