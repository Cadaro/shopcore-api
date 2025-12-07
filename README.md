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

```
git clone https://github.com/Cadaro/shopcore-api.git
npm install
```

When installation packages via NPM, copy `.env.example` and name it to `.env`.
After that, generate new secure key.

```
node ace generate:key
```

## Preparing database

Migrate database to create tables in SQLite database.

```
node ace migration:run
```

Next run

```
node ace db:seed
```

to seed `stocks` table with example items.

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
