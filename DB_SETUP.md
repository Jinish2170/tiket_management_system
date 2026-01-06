# Database Setup (PostgreSQL)

This project uses PostgreSQL via Sequelize. The project expects environment variables for DB configuration; see `src/config/config.js`.

## Environment variables

Create a `.env` file at the project root with the following variables (example):

```
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ticketdb
DB_HOST=127.0.0.1
DB_PORT=5432
```

## Create database (local)

Using `psql` (example on Windows with PostgreSQL installed):

```bash
# open psql as postgres user
psql -U postgres

# inside psql prompt run:
CREATE DATABASE ticketdb;
\q
```

If you need to create a dedicated DB user:

```sql
CREATE USER ticket_user WITH PASSWORD 'strongpassword';
ALTER ROLE ticket_user SET client_encoding TO 'utf8';
ALTER ROLE ticket_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ticket_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ticketdb TO ticket_user;
```

Update `.env` accordingly.

## Migrations and seeders

Install dependencies and run migrations/seeders:

```bash
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

To run migrations for the test environment (if configured):

```bash
# make sure DB_NAME in .env is set appropriately for tests (e.g. ticketdb_test)
npx sequelize-cli db:migrate --env test
```

## Troubleshooting

- If migrations fail, check `src/config/config.js` values and ensure Postgres is running.
- Ensure the `DB_USER` has permission to create and modify tables in the database.
