# TicketFlow — Ticket Management System

A lightweight ticket management system built with Node.js, Express, Sequelize (Postgres) and a React frontend.

## Features
- User authentication and authorization
- Ticket creation, assignment, and status updates
- Comments, tags, activity logs, and assignments
- Sequelize migrations and seeders included

## Quick Start

Prerequisites:
- Node.js (16+ recommended)
- PostgreSQL

1. Install dependencies

```bash
npm install
cd frontend && npm install
```

2. Create a `.env` file in the project root (see `DB_SETUP.md` for details)

3. Run database migrations and seeders

```bash
# from project root
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

4. Start the backend and frontend

```bash
# backend
npm start

# in another terminal: frontend
cd frontend
npm start
```

## Project Structure (important files)
- `index.js` — backend entry point
- `src/config/config.js` — Sequelize DB config
- `src/controllers` — route handlers
- `src/models` — Sequelize models
- `migrations/`, `seeders/` — DB migrations and seeders
- `frontend/` — React app

## Database Setup
See `DB_SETUP.md` for step-by-step database setup and example `.env` values.

## Development notes
- To run migrations for a specific environment set `NODE_ENV` or set the `--env` flag with `sequelize-cli`.
- Tests: none configured by default. Add tests to `src/` and `frontend/` as needed.

## Contributing
Please open issues or pull requests. Follow repository style and run linters before submitting.

## License
This project does not include a license file. Add a license if you intend to make it public.
