# Transition Backend

`transition-backend` is a TypeScript + Express + Prisma backend for a simple ledger and account-transfer system backed by PostgreSQL.

This project was rebuilt from an older JavaScript + MongoDB codebase, but the current implementation is fully aligned with:

- TypeScript
- PostgreSQL
- Prisma ORM
- Express
- JWT-based authentication

## Features

- User registration and login
- JWT-protected routes
- Logout with token blacklisting
- Account creation per user
- Account balance lookup from ledger entries
- Transfer transactions with idempotency support
- System-user-only initial funding endpoint
- Health check endpoint

## Tech Stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- bcrypt
- jsonwebtoken

## Project Structure

```text
transition-backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app.ts
│   ├── index.ts
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── types/
│   └── utils/
├── package.json
└── README.md
```

## Environment Variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL="postgresql://postgres:1234@localhost:5432/bank_backend?schema=public"
MY_SECRET_KEY="my_secret_key"
PORT=5000
```

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `MY_SECRET_KEY`: JWT secret used to sign and verify tokens

### Optional Variables

- `PORT`: Server port. Defaults to `5000` in `src/db/env.ts`

## How To Run Locally

### 1. Prerequisites

Make sure you have installed:

- Node.js 18+ recommended
- npm
- PostgreSQL

### 2. Clone or open the project

```bash
cd transition-backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create the database

Create a PostgreSQL database named `bank_backend`, or update `DATABASE_URL` to point to your own database.

Example local database:

```text
Database name: bank_backend
Username: postgres
Password: 1234
Port: 5432
```

### 5. Add your `.env` file

Use the example above and make sure `DATABASE_URL` matches your local PostgreSQL setup.

### 6. Generate the Prisma client

```bash
npx prisma generate
```

### 7. Sync the database schema

If you are setting up the project for the first time locally, run:

```bash
npx prisma db push
```

This will create/update the tables in PostgreSQL based on `prisma/schema.prisma`.

### 8. Start the development server

```bash
npm run dev
```

By default the app will be available at:

```text
http://localhost:5000
```

## Useful Endpoints

### Base

- `GET /` - basic server check
- `GET /health` - health status

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Accounts

- `POST /api/accounts`
- `GET /api/accounts`
- `GET /api/accounts/balance/:accountId`

### Transactions

- `POST /api/transactions`
- `POST /api/transactions/system/initial-funds`

## Authentication

Protected routes expect a JWT token in the `Authorization` header:

```text
Authorization: Bearer <your_token>
```

Logout stores the token in a blacklist table so it can no longer be used.

## Data Model Overview

The main Prisma models are:

- `User`
- `Account`
- `Ledger`
- `Transaction`
- `TokenBlacklist`

### Important domain behavior

- Account balance is derived from ledger entries
- `CREDIT - DEBIT = current balance`
- Transactions use an `idempotencyKey` to avoid duplicate processing
- Only users marked as `systemUser = true` can access the initial funding route

## Example Development Flow

### Register a user

`POST /api/auth/register`

```json
{
  "name": "Shivam",
  "email": "shivam@example.com",
  "password": "123456"
}
```

### Login

`POST /api/auth/login`

```json
{
  "email": "shivam@example.com",
  "password": "123456"
}
```

Use the returned token for protected routes.

## Common Commands

```bash
npm run dev
npx prisma generate
npx prisma db push
npx tsc --noEmit
```

## Notes

- This repository uses PostgreSQL, not MongoDB
- This repository uses Prisma models, not Mongoose models
- The original source project was JavaScript + MongoDB, but this version is intentionally adapted for TypeScript + Postgres
- The email service is currently a lightweight stub/logging integration point

## Future Improvements

- Add request validation with Zod or Joi
- Add test coverage
- Add refresh token flow
- Add production-ready email provider integration
- Add Docker support
- Add migration scripts and seed data

## License

ISC
