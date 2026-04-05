# Ziele

Ziele is a social blogging platform with a React frontend and an Express backend. The backend now includes a starter tRPC layer next to the existing REST routes so the project can migrate feature-by-feature without breaking current pages.

## Project structure

- `frontend/`: React + Vite client
- `backend/`: Express MVC API, Prisma models, Clerk auth, and starter tRPC router
- `.github/workflows/ci.yml`: CI checks for formatting, linting, build, and tests

## Quick start

1. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
2. Copy env templates:
   - `backend/.env.example` -> `backend/.env`
   - `frontend/.env.example` -> `frontend/.env`
3. Fill in your real keys later for Clerk, PostgreSQL, Redis, Cloudinary, Resend, Gemini, and LibreTranslate.
4. Start the apps:
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`

## Backend setup now included

- Express MVC routes remain available under `/api/*`
- tRPC starter router is mounted at `/trpc`
- health checks:
  - `GET /api/health`
  - `GET /api/health/readiness`
- Prisma scripts:
  - `npm run db:generate`
  - `npm run db:migrate`
  - `npm run db:push`

## Quality scripts

Backend:
- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm test`

Frontend:
- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm test`
