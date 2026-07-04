# C2C — Coding Club Platform (Backend)

Backend API for **C2C**, a coding club platform built for the college club at MNIT. It powers sessions, contests, camps, hackathons, a community forum, a year-wise leaderboard, and more — exposed as a documented REST API for a decoupled frontend.

![Node](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## Overview

C2C is the backend for a college coding club's platform. It manages the club's events and community: technical sessions, competitive programming contests, coding camps, hackathons with team formation, a discussion forum, and a leaderboard that aggregates contest performance.

The backend is fully decoupled from the frontend — they communicate over a REST API documented with OpenAPI/Swagger, which serves as the integration contract between the two codebases.

---

## Features

- **Authentication** — Google OAuth restricted to the college email domain, with JWT stored in HttpOnly cookies.
- **Role-based access control** — three roles (`ADMIN`, `SENIOR`, `MEMBER`) with granular permissions across resources.
- **Sessions** — technical talks and workshops with speaker info and year targeting.
- **Contests** — competitive programming contests with an access-code gate that auto-unlocks after the contest ends.
- **Camps** — winter/summer coding camps with seat limits and year-based eligibility.
- **Hackathons** — with role-differentiated data visibility, team formation via join codes, and one-team-per-user enforcement.
- **Registrations** — for camps and hackathons, with profile-completion and deadline checks.
- **Forum** — posts, comments, upvotes (toggle), soft deletes, and image support.
- **Leaderboard** — year-wise rankings aggregated across contests, cached in Redis.
- **Calendar** — a unified view merging all event types, cached and invalidated on changes.
- **HackerRank sync** — imports contest scores into the leaderboard via a source-agnostic sync.
- **Media uploads** — signed direct-to-Cloudinary uploads for forum images and avatars.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24 |
| Language | TypeScript 6 |
| Framework | Express 4 |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| Database | PostgreSQL |
| Cache | Redis (`redis` client v6) |
| Auth | Passport (Google OAuth) + JWT |
| Validation | Zod 4 |
| Media | Cloudinary (signed uploads) |
| Docs | OpenAPI / Swagger (`swagger-jsdoc` + `swagger-ui-express`) |
| Rate limiting | `express-rate-limit` + `rate-limit-redis` |
| Containerization | Docker + Docker Compose |

---

## Architecture

The codebase follows a clean **service → controller → route** separation:

- **Services** handle data access and business logic (the only layer that talks to the database).
- **Controllers** handle request validation, permissions, and orchestration.
- **Routes** wire endpoints to controllers and apply middleware (auth, rate limiting).

Key design decisions:

- **HttpOnly cookies + JWT** for auth, rather than localStorage, to reduce XSS token-theft risk.
- **Academic year derived from the college email** (e.g. `2024ucp1090@mnit.ac.in` → joined 2024), computed with a July cutoff — never asked of the user.
- **Redis caching** for read-heavy, change-rarely endpoints (leaderboard, calendar) with explicit invalidation on writes.
- **Source-agnostic leaderboard sync** — the score-import logic accepts a normalized array, so the data source (HackerRank paste, CSV, etc.) can change without touching the core logic.
- **Signed direct uploads** — the backend only signs upload requests; image files go straight from the client to Cloudinary, so the API secret never leaves the server and the server never proxies file bytes.

---

## Getting Started

### Run with Docker (recommended)

The entire stack — app, PostgreSQL, and Redis — runs with one command.

1. Clone the repo:
   ```bash
   git clone https://github.com/DevNomad26/Backend-C2C.git
   cd Backend-C2C
   ```

2. Create a `.env` file in the root (see [Environment Variables](#environment-variables) below).

3. Start everything:
   ```bash
   docker compose up --build
   ```

The app will run database migrations automatically and start on `http://localhost:5000`.

### Run locally (without Docker)

Requires Node.js 24, PostgreSQL, and Redis running locally.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env` file.

3. Run migrations and generate the Prisma client:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ALLOWED_EMAIL_DOMAIN=mnit.ac.in

DATABASE_URL=postgresql://user:password@localhost:5432/c2c
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-here

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

> When running via Docker Compose, `DATABASE_URL` and `REDIS_URL` are set automatically to point at the containerized services.

---

## API Documentation

Interactive API docs (Swagger UI) are available once the server is running:

```
http://localhost:5000/api/docs
```

Every endpoint is documented with its request/response shape, parameters, and authentication requirements. This serves as the integration contract for the frontend.

---

## Performance

The leaderboard endpoint runs an expensive aggregation across all contest scores. It was benchmarked naive (query-per-request) vs Redis-cached under load. See [BENCHMARKS.md](./Benchmarks.md) for the full methodology and results.

---

## Engineering Notes & Gotchas

A few non-obvious problems solved along the way, documented here for anyone hitting the same walls:

- **Prisma 7 + Docker migrations** — Prisma 7 moved the datasource URL from `schema.prisma` into `prisma.config.ts`. Running `prisma migrate deploy` inside a container fails with *"datasource.url is required"* unless `prisma.config.ts` is explicitly copied into the production image. The env var being present is not enough — the config file itself must be present.

- **Swagger in production builds** — `swagger-jsdoc` scans source files for `@openapi` comments. In a compiled Docker image there is no `src/`, only `dist/`, so the spec comes up empty unless the glob also points at `./dist/routes/*.js` (and TypeScript is configured to preserve comments).

- **HackerRank score import** — the unofficial leaderboard REST endpoint works from a browser but returns `403` from a server (bot protection). Rather than store personal session credentials server-side (a security risk), scores are imported by pasting the leaderboard JSON, which the backend parses through a source-agnostic sync. The data source can be swapped without changing the core import logic.

- **Contest access gating** — contests can be gated behind an access code that acts as a soft "commitment filter" during the event, then automatically opens the link to everyone once the contest ends (practice mode).

---

## Project Structure

```
src/
├── config/        # env, db, redis, passport, cloudinary, swagger
├── controllers/   # request handling, validation, permissions
├── services/      # business logic and data access
├── routes/        # endpoint definitions + middleware
├── middleware/    # auth, error handling, rate limiting
├── utils/         # jwt, academic year, code generation
└── types/         # type augmentation
prisma/
├── schema.prisma  # data model
└── migrations/    # migration history
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
