# PRD: AI-Powered Social Blogging Platform

## 1. Project Overview

### 1.1 Project Name
InkFlow (working name)

### 1.2 Vision
Build a modern social blogging platform where users can write, discover, and engage with multilingual blogs, enhanced by AI utilities (translation, summaries, fact-check/spam detection), real-time interactions, and gamification.

### 1.3 Problem Statement
Most student-level blogging systems only support create/read posts and basic comments. This project targets a richer ecosystem: social graph (follow/follower), discovery (recommendations, trending, random post), trust/safety (fact check + spam control + rate limiting), and retention (daily streaks, notifications, reminders).

### 1.4 Objectives
- Deliver an end-to-end full-stack web application using the mandated stack.
- Ship all listed features in usable form with clear MVP behavior.
- Ensure production-style quality: auth, rate limiting, caching, file uploads, notifications, analytics, deployment.
- Provide demo-ready flows for college evaluation.

### 1.5 Target Users
- Students and casual writers.
- Readers interested in quick content discovery.
- Community members around tags/topics.

## 2. Scope

### 2.1 In Scope (from provided feature list)
1. Write and read blog posts.
2. Follow and followers.
3. Bookmark posts.
4. Like and dislike interactions.
5. Comment section.
6. Blog translation.
7. Email reminders.
8. Share blogs via links.
9. Daily streaks.
10. Tags on blogs.
11. Fact checker / spam blogs.
12. Blog recommendations (manual logic).
13. Magic button for random post.
14. Summarize button in different languages.
15. Live notifications.
16. Rate limiting on blogs/actions.
17. Analytics board.
18. Premium badge.
19. Media upload from local or URL.
20. Communities and trending.
21. Theme toggle.

### 2.2 Out of Scope (for DA submission unless extra time)
- Native mobile apps.
- Paid subscription billing integration.
- Full ML model training pipelines.
- Advanced moderation dashboard with human review workflows.

## 3. Tech Stack (Confirmed)

### 3.1 Frontend
- React
- Quill.js (rich text editor)
- Chart.js (analytics visualization)

### 3.2 Backend
- Express + tRPC
- Prisma ORM
- PostgreSQL

### 3.3 Auth
- Clerk

### 3.4 AI and Language
- Gemini API (summarization, fact-check aid)
- LibreTranslate (translation)

### 3.5 Async / Realtime / Messaging
- Socket.io
- Redis Pub/Sub

### 3.6 Caching / Rate Limit
- Redis

### 3.7 Media & Email
- Cloudinary (media storage)
- Resend + React Email (email reminders)
- Upstash serverless (email scheduling/trigger path)

### 3.8 Deployment
- Vercel (frontend + possibly serverless endpoints)
- Railway (API/worker/DB components as needed)

## 4. Core User Journeys

### 4.1 Writer Journey
1. Sign up/login with Clerk.
2. Create blog with Quill editor + tags + media upload/link media.
3. Publish and share link.
4. Receive engagement notifications (likes/comments/follows).
5. View analytics for own posts.

### 4.2 Reader Journey
1. Login and land on personalized feed.
2. Explore trending/community/tag-based posts.
3. Like/dislike, comment, bookmark, follow author.
4. Translate or summarize post in preferred language.
5. Use Magic Button for random discovery.

### 4.3 Retention Journey
1. Daily login updates streak.
2. Receive email reminder for unread bookmarks/followed creators.
3. Get live notifications for social interactions.

## 5. Functional Requirements

### 5.1 Authentication & Profiles
- Clerk-based auth (signup/login/logout/social if enabled).
- User profile page: bio, avatar, premium badge state, streak count.

### 5.2 Blog CRUD
- Create/edit/delete own blogs.
- Read all public blogs.
- Rich content via Quill.js.
- Attach media from local device and external URL.

### 5.3 Social Graph
- Follow/unfollow user.
- Followers/following counts.
- Optional followers list page.

### 5.4 Engagement
- Like/dislike per post (mutually exclusive per user).
- Comment create/read/delete (own delete minimum).
- Bookmark add/remove and saved list.

### 5.5 Discovery
- Recommendation feed (manual logic examples):
  - Same tags as user history/bookmarks.
  - Popular posts from followed users.
  - Recent + high engagement weighted score.
- Magic button returns random eligible post.
- Communities/trending based on tags + engagement velocity.

### 5.6 AI Features
- Translate post content with LibreTranslate to selected language.
- Summarize blog with Gemini in selected language.
- Fact-check/spam flag service (heuristic + Gemini prompt assistance).

### 5.7 Notifications
- Live notifications via Socket.io for:
  - New follower
  - New comment on user post
  - Like/dislike on user post
- Notification center with unread count.

### 5.8 Email Reminders
- Scheduled reminder emails for inactive users or unread bookmarks.
- React Email templates + Resend delivery.

### 5.9 Gamification
- Daily streak increments once per day per user.
- Premium badge visible on profile/posts when enabled by admin flag.

### 5.10 Rate Limiting
- Redis-backed limits on:
  - Blog create/update
  - Comments
  - Likes/dislikes
  - AI endpoints (summary/translation/fact-check)

### 5.11 Analytics Board
- Per-user dashboard metrics:
  - Total posts
  - Total views
  - Likes/dislikes counts
  - Comment counts
  - Engagement by day/week
- Chart.js rendering.

### 5.12 Theming
- Light/dark mode toggle.
- Persist preference in local storage or DB user settings.

## 6. Non-Functional Requirements
- Security: input validation, auth guards, sanitized rich text output.
- Performance: Redis cache for hot feed and trending endpoints.
- Reliability: graceful fallback if external AI/translation API fails.
- Scalability: stateless API + Redis pub/sub for realtime fanout.
- Usability: responsive UI desktop + mobile.

## 7. High-Level Architecture

### 7.1 Frontend (React)
- Auth screens (Clerk widgets)
- Home/feed
- Blog editor (Quill)
- Blog detail page (translate, summarize, comments)
- Profile + analytics dashboard
- Bookmarks, notifications, communities/trending pages

### 7.2 Backend (Express + tRPC)
- tRPC routers/modules:
  - `auth/profile`
  - `posts`
  - `comments`
  - `reactions`
  - `bookmarks`
  - `follows`
  - `notifications`
  - `recommendations`
  - `ai`
  - `analytics`
  - `communities`
- Middleware:
  - Clerk session verification
  - rate limiter (Redis)
  - request validation (zod)

### 7.3 Data Layer
- PostgreSQL + Prisma schema
- Redis for cache, rate limit counters, pub/sub channels

### 7.4 Integrations
- Cloudinary upload API
- Gemini API
- LibreTranslate API
- Resend email API

### 7.5 Deployment
- Vercel: React app (and optional edge/serverless handlers)
- Railway: Express+tRPC server, Redis, PostgreSQL, socket service

## 8. Suggested Database Model (Entities)
- `User`
- `Profile`
- `Post`
- `PostMedia`
- `Tag`
- `PostTag`
- `Comment`
- `Reaction` (like/dislike enum)
- `Bookmark`
- `Follow`
- `Notification`
- `Community`
- `CommunityMembership`
- `PostView`
- `DailyStreak`
- `FactCheckLog`
- `EmailReminderLog`
- `PremiumStatus`

## 9. Milestone Roadmap (8 Weeks)

### Week 1: Foundation
- Finalize requirements and wireframes.
- Setup monorepo/app structure, env files, linting.
- Configure Clerk, PostgreSQL, Prisma, base Express+tRPC.

### Week 2: Core Blog + Auth
- Implement post CRUD with Quill content.
- Tagging and post detail pages.
- Basic feed and profile pages.

### Week 3: Social + Engagement
- Follow/follower system.
- Like/dislike, comments, bookmarks.
- Shareable blog links.

### Week 4: Discovery + Communities
- Trending, communities, recommendation logic.
- Magic random post endpoint.

### Week 5: AI & Language
- Translation flow via LibreTranslate.
- Summarization via Gemini.
- Fact-check/spam detection pipeline.

### Week 6: Notifications + Email + Streaks
- Socket.io live notifications.
- Redis pub/sub integration.
- Email reminder scheduling with Resend + React Email.
- Daily streak logic.

### Week 7: Analytics + Rate Limiting + Theme
- Custom analytics APIs + dashboard charts.
- Redis-based rate limits on sensitive endpoints.
- Theme toggle and preference persistence.

### Week 8: Hardening + Deployment + Demo
- Testing, bug fixes, seed/demo data.
- Deploy on Vercel + Railway.
- Prepare final report, architecture diagram, and viva demo script.

## 10. Detailed Task Checklist (Start to End)

Status snapshot (April 5, 2026): Frontend routing, theme support, Clerk UI integration, the profile/create/discover/notifications experiences, Express MVC routes, a starter tRPC layer, Prisma-backed post/comment/profile data access, Clerk webhook-based local user sync, integration/env scaffolding, and CI lint/build/test checks are in place. Realtime, AI feature implementation, live service credentials, production infrastructure, and several product features are still pending.

### 10.1 Planning and Setup
- [x] Freeze project name, scope, and acceptance criteria.
- [x] Create Git repository and branch strategy (`main`, `dev`, feature branches).
- [x] Initialize React frontend structure.
- [x] Initialize Express+tRPC backend structure (Current: Express MVC backend remains in place and a starter tRPC layer is mounted alongside it).
- [x] Configure TypeScript (Vite + tsconfig base).
- [x] Configure ESLint, Prettier.
- [x] Create `.env.example` with all required keys.
- [ ] Setup Clerk project and keys (Current: Clerk frontend/backend wiring, docs, and env placeholders are set; live keys still need to be added and verified).
- [ ] Setup PostgreSQL instance and Prisma connection (Current: Prisma config/client/adapter and health/readiness checks are wired; a real database instance and migrations still need to be run).
- [ ] Setup Redis (cache + pub/sub + rate limit store) (Current: Redis env/config/client scaffolding is added; live Redis provisioning and feature wiring are pending).
- [ ] Setup Cloudinary, Resend, Gemini, LibreTranslate credentials (Current: env placeholders and starter client modules are added; real credentials still need to be supplied).
- [x] Setup CI checks (lint/build/test).

### 10.2 Database and Prisma
- [ ] Design ER model for all entities (Current: a partial model is implemented in Prisma, but not the full PRD entity set).
- [ ] Implement Prisma schema models and relations (Current: `User`, `Profile`, `Post`, `Comment`, and `Notification` are modeled).
- [ ] Add migrations for initial schema.
- [ ] Add seed script for demo users/posts/tags (Current: local seed data files exist, but not a Prisma seed runner).
- [ ] Add indexes on hot queries (post createdAt, tags, reactions, follow relations).

### 10.3 Authentication and User Module
- [x] Integrate Clerk on frontend.
- [x] Add backend middleware for authenticated routes.
- [x] Sync Clerk user to local DB on first login/signup path (via Clerk webhook sync).
- [x] Build profile page (avatar, bio, badge, streak) (UI Done).

### 10.4 Blog Editor and Post Management
- [x] Integrate Quill.js editor.
- [x] Build create post form UI (title, content, tags, cover/media).
- [ ] Implement post create/read/update/delete APIs (Current: create + list/detail + related/random APIs exist; update/delete are missing).
- [ ] Add slug/link generation for shareable URLs (Current: share links use `/post/:id`; no slug generation yet).
- [ ] Sanitize/validate rich text payload before storing (Current: required-field validation exists; sanitization is still missing).

### 10.5 Media Handling
- [ ] Implement local image/video upload to Cloudinary.
- [ ] Implement “paste media URL” validation and storage (Current: cover URL is collected/stored, but not validated/rendered as a finished feature).
- [ ] Render media safely in post detail.

### 10.6 Social Features
- [ ] Implement follow/unfollow APIs.
- [ ] Show follower/following counts and lists (Current: counts are visible on profile; dedicated lists page is still a placeholder).
- [ ] Add follow CTA on profile/post cards (Current: profile/discover/sidebar CTAs exist, but post-card actions/backend wiring are not done).

### 10.7 Engagement Features
- [x] Implement like/dislike toggle (Frontend-only state is present in feed/post detail).
- [ ] Build comment CRUD (minimum create/read/delete-own) (Current: create/read/delete flow exists, but delete-own enforcement is not complete).
- [ ] Implement bookmark toggle and bookmarks page (Current: frontend-only toggle exists; `/bookmarks` is still a placeholder).
- [ ] Update counts in UI in near real-time.

### 10.8 Discovery and Communities
- [ ] Build trending algorithm (engagement + recency score) (Current: sidebar topic ranking exists, but not the full trending flow).
- [ ] Build recommendations endpoint (manual logic) (Current: discover filtering/search API exists, but not personalized recommendations).
- [x] Implement magic random post endpoint.
- [x] Build communities/discover pages based on tags/topics (Discover is API-backed; Communities is still using mock data).

### 10.9 AI Features
- [ ] Implement translation endpoint with LibreTranslate.
- [ ] Implement summarize endpoint with Gemini + language option.
- [ ] Implement fact-check/spam endpoint (rules + Gemini prompt).
- [ ] Show confidence/flag labels in UI for moderation hints.
- [ ] Add graceful fallback messaging when AI service fails.

### 10.10 Notifications (Realtime)
- [ ] Setup Socket.io server and client integration.
- [ ] Setup Redis pub/sub channels for distributed notifications.
- [ ] Trigger notifications on follow/comment/reaction.
- [x] Build notifications panel and unread count UI.

### 10.11 Email Reminders
- [ ] Create React Email templates.
- [ ] Integrate Resend send API.
- [ ] Add reminder scheduler logic (cron/serverless trigger).
- [ ] Log delivery status and failures.

### 10.12 Gamification
- [ ] Implement daily streak updater (once per calendar day).
- [ ] Show streak count and milestones (e.g., 7-day/30-day) (Current: streak count is shown on profile; milestone logic is pending).
- [ ] Implement premium badge visibility logic (Current: badge can render from profile data, but business/admin logic is not implemented).

### 10.13 Analytics Dashboard
- [ ] Track post views and engagements.
- [ ] Create aggregate analytics APIs.
- [ ] Implement Chart.js graphs (daily views, engagement trend, top posts) (Current: analytics page is a static Recharts prototype).
- [ ] Add time filters (7/30/90 days) (Current: filter chips exist in the UI, but are not data-backed).

### 10.14 Rate Limiting, Cache, and Security
- [ ] Apply Redis rate limiting middleware on sensitive routes.
- [ ] Cache hot feeds/trending endpoints.
- [ ] Add request validation with Zod/tRPC input parsers.
- [ ] Add HTML/content sanitization to prevent XSS.
- [ ] Add abuse checks for comments and post spam.

### 10.15 UI/UX and Theme
- [x] Implement responsive layouts (mobile + desktop).
- [x] Build light/dark theme toggle.
- [x] Persist theme preference (Local Storage).
- [ ] Polish loading states, error states, empty states (Current: several core pages have these states, but coverage is not complete app-wide).

### 10.16 Testing
- [ ] Unit tests for business logic (streak, scoring, recommendations).
- [ ] API tests for key tRPC procedures.
- [ ] Integration test for auth + post flow.
- [ ] Manual QA checklist for all 21 features.
- [ ] Load test critical endpoints (feed, comments, reactions).

### 10.17 Deployment and Release
- [ ] Configure Vercel project and env variables.
- [ ] Configure Railway services (API, Redis, PostgreSQL).
- [ ] Enable production domains and CORS config.
- [ ] Run Prisma migrations in production.
- [ ] Validate Socket and email flows in prod.
- [ ] Freeze release candidate and tag version.

### 10.18 Final Submission Checklist
- [ ] Update README with setup and architecture.
- [ ] Add API documentation and environment setup guide.
- [ ] Create ER diagram and architecture diagram.
- [ ] Prepare demo data and test accounts (Current: demo seed content exists, but test-account setup is not documented).
- [ ] Record demo script: login -> create post -> social engagement -> AI tools -> analytics.
- [ ] Prepare known limitations and future scope section.
- [ ] Final smoke test on production deployment.

## 11. Acceptance Criteria (Feature-Level)
- User can publish and read posts with media and tags.
- User can follow, like/dislike, comment, bookmark, and share links.
- Translation and summarization work for at least 2+ target languages.
- Fact-check/spam flagging is visible and functional (even if heuristic).
- Notifications are live without page refresh.
- Rate limiter blocks abusive request bursts.
- Analytics dashboard shows real post-level metrics.
- Theme toggle works and persists.
- Deployed app is accessible publicly for evaluation.

## 12. Risks and Mitigation
- External API rate limits/failures -> fallback responses + retry policy.
- Realtime complexity with sockets -> keep event schema minimal and test early.
- Scope overload (21 features) -> strict phase-wise delivery and freeze non-critical polish.
- AI quality inconsistency -> expose "AI-generated" disclaimer and allow manual override.

## 13. Suggested Team Split (if 3-4 members)
- Member 1: Frontend core (editor, feed, detail pages, theme).
- Member 2: Backend core (posts, comments, follows, bookmarks, reactions).
- Member 3: AI + notifications + email + rate limiter.
- Member 4: Analytics + deployment + QA + documentation.

## 14. Demo Flow (for Viva)
1. Register/login with Clerk.
2. Create a blog post with media + tags.
3. Interact from second account: follow, like, comment, bookmark.
4. Show live notification pop/update.
5. Open translation and summary in another language.
6. Show fact-check/spam flag output.
7. Show recommendation feed, trending, and random magic post.
8. Open analytics dashboard charts.
9. Show streak and premium badge.
10. Switch theme and show responsiveness.

---
This PRD is designed for direct execution as a college delivery roadmap. Keep this file updated weekly with status notes and completed checklist items.
