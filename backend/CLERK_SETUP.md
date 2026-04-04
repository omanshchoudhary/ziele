# Clerk Backend Setup Guide

This guide explains how to configure Clerk for the backend in this project, including:

- required environment variables
- webhook setup for syncing users
- which routes are protected
- how to test authentication behavior

---

## 1) Install dependencies

Already added in backend:

- `@clerk/express`
- `svix`

These power:

- request authentication middleware
- Clerk webhook verification

---

## 2) Environment variables (backend)

Create/update your backend environment file (for example `backend/.env`) with:

```env
PORT=3001

# Clerk backend secret (from Clerk dashboard)
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxx

# Clerk webhook signing secret (from Clerk webhook endpoint settings)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxxxxxxxxxxxxxx
```

### Where to get values

1. Go to **Clerk Dashboard**.
2. Open your application.
3. Copy **Secret key** -> `CLERK_SECRET_KEY`.
4. Create a webhook endpoint (details below), then copy its **Signing secret** -> `CLERK_WEBHOOK_SIGNING_SECRET`.

---

## 3) Webhook endpoint for user sync

Backend endpoint added:

- `POST /api/webhooks/clerk`

Purpose:

- sync Clerk users into local backend data store (`appData.json`)
- keep local profiles aligned with Clerk account lifecycle

Supported events:

- `user.created`
- `user.updated`
- `user.deleted`

### Configure in Clerk Dashboard

1. Go to **Webhooks** in Clerk.
2. Add endpoint URL:
   - Local dev: `http://localhost:3001/api/webhooks/clerk`
   - If using tunneling (recommended): `https://<your-tunnel-domain>/api/webhooks/clerk`
3. Subscribe to:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret and set `CLERK_WEBHOOK_SIGNING_SECRET`.

---

## 4) Middleware behavior

Global Clerk middleware is mounted early in the app, so auth context is available to routes.

Two patterns are used:

1. **Optional auth parsing**  
   Route can be used without login, but if token exists it is parsed.

2. **Required auth guard**  
   Route returns `401`/unauthorized behavior unless valid Clerk auth is present.

---

## 5) Protected route behavior in backend

Current protections:

- `POST /api/posts` -> requires authenticated user
- `POST /api/posts/:id/comments` -> requires authenticated user
- `DELETE /api/comments/:id` -> requires authenticated user
- `GET /api/notifications` -> requires authenticated user
- `GET /api/profiles/current` -> requires authenticated user
- `GET /api/auth/me` -> requires authenticated user

Public examples:

- `GET /api/posts`
- `GET /api/posts/:id`
- `GET /api/meta/discover`
- `GET /api/health`
- `GET /api/auth/status` (debug-friendly auth status endpoint)

---

## 6) New auth endpoints

### `GET /api/auth/status`
Public debug endpoint.  
Returns whether request is authenticated and basic auth context.

### `GET /api/auth/me`
Protected endpoint.  
Returns the local synced profile for authenticated Clerk user.

If user is authenticated in Clerk but not yet synced locally, this route can return a not-found style response until webhook sync runs.

---

## 7) Local data sync model

A Clerk sync model is included to:

- create local user + profile on `user.created`
- update local user/profile metadata on `user.updated`
- remove local user/profile on `user.deleted`

The local JSON store now includes a `users` array.

---

## 8) Important dev note (frontend -> backend auth)

Backend protection is active.  
Your frontend must send valid Clerk auth context when calling protected backend endpoints.

Common approaches:

- use Clerk session token in `Authorization: Bearer <token>`
- or use same-site cookie flow (if applicable with matching domain/cors strategy)

If protected requests fail with unauthorized responses, verify token forwarding from frontend API calls.

---

## 9) Quick verification checklist

1. Start backend:
   - `npm run dev` or `npm start`
2. Check health:
   - `GET /api/health`
3. Check auth status (unauthenticated):
   - `GET /api/auth/status`
4. Trigger Clerk user creation (sign up in frontend).
5. Confirm webhook delivery success in Clerk dashboard.
6. Call protected endpoint with valid auth:
   - `GET /api/auth/me`
7. Create post/comment through authenticated flow.

---

## 10) Troubleshooting

### Webhook verification failed
- Ensure `CLERK_WEBHOOK_SIGNING_SECRET` exactly matches endpoint signing secret.
- Ensure webhook sends to correct backend URL.
- Ensure endpoint is reachable from Clerk (use tunnel for local development).

### Protected routes return unauthorized
- Confirm `CLERK_SECRET_KEY` is present in backend env.
- Confirm frontend is actually passing Clerk auth token/session for API requests.
- Confirm request is sent to the same backend instance configured with Clerk secret.

### Authenticated user has no local profile
- Check webhook deliveries for `user.created` and `user.updated`.
- Re-deliver event from Clerk dashboard if needed.

---

## 11) Security reminders

- Never commit real Clerk secrets to source control.
- Keep `CLERK_SECRET_KEY` and webhook signing secrets only in environment variables.
- In production, use HTTPS and locked CORS origins.