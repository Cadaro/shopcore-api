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

# Upcoming Features

- 🚚 Multiple courier gateway integrations
- 💳 Multiple payment gateway integrations
- 📦 Multi-step order processing
- 📨 Order notifications
- 🔐 Advanced user roles and permissions
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

Run migrations to create the tables, then seed the example stock items:

```
node ace migration:run
node ace db:seed
```

## Running tests locally

Use the MySQL database above (or another MySQL 8.0 instance) and set the five
database variables in `.env` to its connection details. The test bootstrap
runs migrations and seeders before the suite:

```
npm test
```

The CI workflow uses the same `mysql:8.0` image and runs `npm test` against it.
To remove the local test database container when finished, run
`docker rm -f shopcore-mysql`.

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
