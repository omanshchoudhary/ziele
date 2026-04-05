# Manual Setup Report (Post Coding Completion)

## 1) What is now completed in code

- Post lifecycle is now end-to-end: create, read, update, delete, with owner checks.
- Bookmark system is now backend-persisted and API-backed in UI.
- Comment delete now enforces delete-own behavior.
- Reactions and bookmarks now update live counters consistently.
- Discover now uses recommendation logic (tag affinity + follows + engagement).
- Trending endpoint is implemented with engagement + recency scoring.
- Communities endpoint is implemented from real tag/activity aggregation.
- Analytics endpoint is implemented with 7/30/90 day filters, totals, series, and top posts.
- Daily streak auto-touch for current user is implemented (once per UTC day).
- Content safety added: sanitization + spam-pattern enforcement on write paths.
- Validation added via Zod for post/comment/reaction/media/AI endpoints.
- Rate limiting added on sensitive routes (posts/comments/reactions/AI), Redis-backed with memory fallback.
- Notifications API now includes unread count + mark-all-read.
- Frontend pages wired to live APIs for bookmarks, trending, communities, and analytics.

## 2) Manual keys and secrets you must provide

Update these files with real values:
- [backend/.env.example](C:/Coding/ziele/backend/.env.example)
- [frontend/.env.example](C:/Coding/ziele/frontend/.env.example)

Required backend values:
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SIGNING_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `GEMINI_API_KEY`
- `LIBRETRANSLATE_API_URL` (and `LIBRETRANSLATE_API_KEY` if your host requires it)
- `CRON_SHARED_SECRET` (for reminder trigger hardening)

Required frontend values:
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL`
- `VITE_USE_MOCK_FALLBACK` (`false` in production, `true` for offline/dev fallback)

## 3) Database and schema actions (manual)

Run these in `backend/` after setting `DATABASE_URL`:
1. `npm run db:generate`
2. `npm run db:migrate`

Notes:
- Schema now includes new fields/models (`Bookmark`, `Profile.lastActiveAt`, new indexes).
- Existing databases must apply migration before runtime.

## 4) Third-party dashboard actions (manual)

Clerk:
- Create app, copy keys.
- Configure allowed origins for frontend.
- Add Clerk webhook endpoint: `POST /api/webhooks/clerk` with signing secret.

PostgreSQL:
- Provision DB (local/cloud).
- Ensure connectivity from backend deployment target.

Redis:
- Provision Redis and set `REDIS_URL`.
- Validate notifications pub/sub and rate limits in staging/prod.

Cloudinary:
- Create unsigned/signed upload setup (current code uses signed server upload).
- Confirm image/video upload limits and allowed formats.

Resend:
- Verify sender domain.
- Use verified `RESEND_FROM_EMAIL`.
- Trigger `/api/jobs/reminders` in staging to verify send path.

Gemini:
- Create API key and enable model access (`gemini-1.5-flash`).

LibreTranslate:
- Configure provider URL (self-hosted or hosted endpoint).

## 5) Deployment tasks you still need to do manually

- Configure env vars in deployment platforms (Vercel/Railway or equivalent).
- Configure backend CORS via `CORS_ORIGIN`.
- Expose backend URL and set frontend `VITE_API_BASE_URL`.
- Run Prisma migration in production before traffic.
- Validate production Clerk auth + webhook sync.
- Validate Socket.io connectivity in production network/proxy config.
- Schedule reminder trigger job (cron/serverless) with `x-cron-secret`.

## 6) Final manual QA checklist

- Create/edit/delete post from account A.
- Like/dislike/comment/bookmark from account B.
- Verify live notifications arrive for account A.
- Verify translation/summarize/fact-check responses (including fallback behavior).
- Verify bookmarks page persists after refresh.
- Verify trending/communities/analytics pages load real API data.
- Verify rate limits return `429` under burst traffic.
