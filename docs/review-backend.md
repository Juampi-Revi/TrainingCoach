# Backend Review — TrainingApp API

## Summary

The API is a Next.js 15 App Router backend using a hand-rolled JWT auth layer on top of Prisma + PostgreSQL. The general structure is clean, the auth guard pattern is consistent, and IDOR protection is applied well in most places. However there are several issues that must be fixed before a production deployment: a hardcoded JWT fallback secret, a self-signed password-reset token that cannot be invalidated once used, an unauthenticated role-elevation path on registration, a CORS misconfiguration that silently accepts any origin, and pervasive missing try/catch blocks that will leak raw Prisma stack traces as 500 HTML responses.

---

## 🔴 Critical (Must Fix Before Production)

### 1. JWT secret falls back to the string literal `"dev-secret"`

**File**: `apps/api/lib/jwt.ts:3`

**Problem**: If neither `JWT_SECRET` nor `NEXTAUTH_SECRET` is set, the application signs and verifies tokens using the hardcoded string `"dev-secret"`. Any attacker who reads the source code (OSS repo, build artifact, leaked env file) can forge arbitrary tokens with any `sub`, `role`, and `billingStatus` they want. This completely bypasses all authentication.

The same pattern is duplicated independently in:
- `apps/api/app/api/v1/auth/forgot-password/route.ts:7`
- `apps/api/app/api/v1/auth/reset-password/route.ts:7`

**Fix**: Remove the `?? "dev-secret"` fallback everywhere. Throw a startup error when the secret is absent, and centralise secret loading in `lib/jwt.ts` only (the two route files re-implement the lookup themselves, which will drift).

```ts
// lib/jwt.ts
const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!SECRET) throw new Error("JWT_SECRET env variable is required");
```

---

### 2. Password-reset tokens are not single-use (replay attack)

**File**: `apps/api/app/api/v1/auth/reset-password/route.ts`

**Problem**: A valid reset token can be reused unlimited times within its 1-hour window. An attacker who intercepts or steals a reset link (e.g. via email forwarding, referer header, browser history) can repeatedly reset the victim's password to a value of their choice. There is no invalidation mechanism.

**Fix**: Store the issued token (or a hash of it) in the database on creation, mark it as consumed on first use, and reject already-consumed tokens. The simplest approach is a `PasswordResetToken` table with `{ token: String @unique, userId: String, expiresAt: DateTime, usedAt: DateTime? }`.

---

### 3. Open registration — any caller can self-assign the `coach` role

**File**: `apps/api/app/api/v1/auth/register/route.ts:9,12`

**Problem**: The `role` field is accepted directly from the request body and is only validated against `["coach", "client"]`. There is no invite code, admin approval, or any other gate. Anyone on the internet can POST `{ email, password, role: "coach" }` and immediately get a coach-scoped JWT with full access to the coach API surface (create plans, see all their clients' data, etc.).

**Fix**: Either:
1. Hard-code `role: "client"` on registration and add a separate admin-only endpoint to promote users, or
2. Require a signed invite token (which you already send in `sendInviteEmail`) to be submitted at registration so only invited users can register as a specific role.

---

### 4. CORS middleware accepts any unknown origin as `localhost:3001`

**File**: `apps/api/middleware.ts:11`

**Problem**: When an origin is not in the allowlist the code falls back to `ALLOWED_ORIGINS[0]` (`http://localhost:3001`) instead of omitting the header entirely. This means requests from arbitrary origins still receive a valid `Access-Control-Allow-Origin` header (one that doesn't match them, so the browser blocks it), but it also means that any request from a non-browser client (curl, Postman, server-to-server) is treated as if it came from localhost. More critically, if `ALLOWED_ORIGINS[0]` ever becomes a wildcard, the entire protection collapses. The correct behavior for an unrecognised origin is to return no `Access-Control-Allow-Origin` header.

**Fix**:

```ts
const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : null;
// ...
if (allowed) res.headers.set("Access-Control-Allow-Origin", allowed);
```

Also: production origins (`https://your-app.com`) must be added to the allowlist before go-live.

---

### 5. Virtually no try/catch in route handlers — unhandled Prisma errors return 500 HTML

**Files**: Almost all route files under `apps/api/app/api/v1/`

**Problem**: Only two handlers have any error handling (`exercises/route.ts` POST and `workouts/.../exercises/[weId]/route.ts` PATCH). Every other handler — ~30 route files — lets Prisma exceptions propagate uncaught. In Next.js, an uncaught error in a route handler returns a `text/html` error page (not JSON), which breaks any API client expecting JSON and leaks a stack trace in development mode. Common triggers: `findFirst` on a soft-deleted record, a `update`/`delete` targeting a non-existent ID (Prisma throws `P2025`), constraint violations, or a transient database connection error.

**Fix**: Wrap each handler body (or use a shared wrapper function) with a top-level try/catch that returns `err("Internal server error", 500)`:

```ts
export async function GET(req: NextRequest) {
  try {
    // ... handler body
  } catch (e) {
    console.error("[GET /path]", e);
    return err("Internal server error", 500);
  }
}
```

A utility like `withErrorHandler(handler)` would let you apply this once per file without repeating boilerplate.

---

## 🟡 High Priority

### 6. Unprotected `GET /client/workouts/[workoutTemplateId]` — no ownership check

**File**: `apps/api/app/api/v1/client/workouts/[workoutTemplateId]/route.ts:15-17`

**Problem**: The handler verifies the caller is authenticated as a `client`, but it does **not** verify that the requested `workoutTemplateId` belongs to a plan assigned to that client. Any authenticated client can enumerate all workout templates in the system (including those belonging to other coaches) by trying UUIDs.

**Fix**: Before returning the template, verify that a `PlanAssignment` exists linking this client to a plan that contains this `WorkoutTemplate`.

---

### 7. `POST /client/sessions` — no verification that the template is assigned to the client

**File**: `apps/api/app/api/v1/client/sessions/route.ts:69-73`

**Problem**: A client can start a session against any `workoutTemplateId` in the database, including templates belonging to other coaches or templates not in their assigned plan. The template lookup uses `findUnique({ where: { id: workoutTemplateId } })` with no ownership scope.

**Fix**: Add a check that the `workoutTemplateId` is reachable through the client's active `PlanAssignment` → `Plan` → `PlanWeek` → `PlanWeekWorkout` chain before creating the session.

---

### 8. `POST /client/sessions/[sessionId]/exercises` — any global exercise accepted, no scope validation

**File**: `apps/api/app/api/v1/client/sessions/[sessionId]/exercises/route.ts:26-35`

**Problem**: When a client adds an ad-hoc exercise to a session, the only check is `prisma.exercise.findUnique({ where: { id: exerciseId } })`. A client can add any exercise in the database including exercises belonging to other coaches (`isSystem: false, coachUserId: <other coach>`). These exercises may not be intended for the public catalogue.

**Fix**: Restrict to `{ id: exerciseId, OR: [{ isSystem: true }, { coachUserId: <their coach's id> }] }`. You already have the client→coach relationship available via `CoachClient`.

---

### 9. `PATCH /client/sessions/[sessionId]` — `energyRating` is not validated

**File**: `apps/api/app/api/v1/client/sessions/[sessionId]/route.ts:124-136`

**Problem**: `energyRating` is passed directly to `prisma.workoutSession.update` without any type or range check. A client can set `energyRating: "DROP TABLE users"` (Prisma handles the type mismatch, so no SQL injection, but it will throw an unhandled error) or a number outside the intended 1-5 range.

**Fix**: Validate: `if (energyRating !== undefined && (typeof energyRating !== 'number' || energyRating < 1 || energyRating > 10)) return err("Invalid energyRating", 400);`

---

### 10. `POST /coach/plans/[planId]` — `startDate` from body is passed directly to `new Date()` without validation

**File**: `apps/api/app/api/v1/coach/clients/[clientUserId]/route.ts:162`

**Problem**: `new Date(startDate)` where `startDate` is untrusted user input. If `startDate` is not a valid date string, `new Date(startDate)` returns `Invalid Date`, and Prisma will throw an unhandled error.

**Fix**: Validate the date string before constructing: `const parsed = startDate ? new Date(startDate) : new Date(); if (isNaN(parsed.getTime())) return err("Invalid startDate", 400);`

---

### 11. `POST /coach/plans/[planId]` — no transaction between deactivating old assignment and creating new one

**File**: `apps/api/app/api/v1/coach/clients/[clientUserId]/route.ts:152-164`

**Problem**: There are two separate database writes: first `updateMany` to finish existing assignments, then `create` for the new one. If the process crashes between them (server restart, DB timeout), the client is left with no active plan assignment, which silently breaks all week-view logic for that client.

**Fix**: Wrap both operations in a `prisma.$transaction([...])`.

---

### 12. Password minimum length is only 6 characters (reset-password) vs no check on registration

**Files**:
- `apps/api/app/api/v1/auth/reset-password/route.ts:14` — enforces 6 char minimum
- `apps/api/app/api/v1/auth/register/route.ts` — no minimum at all

**Problem**: Register accepts a 1-character password. The inconsistency means users can register with a weak password that they then cannot reset to (because reset enforces 6 chars). Six characters is also far too short for a 2025 production app.

**Fix**: Enforce a minimum of 8–12 characters consistently across register and reset-password, and add it to the `auth.config.ts` authorize path too.

---

### 13. `DELETE /coach/exercises/[exerciseId]/media/[mediaId]` — any coach can delete media on system exercises

**File**: `apps/api/app/api/v1/coach/exercises/[exerciseId]/media/[mediaId]/route.ts:21`

**Problem**: The condition `!media.exercise.isSystem && media.exercise.coachUserId !== auth.user.sub` allows deletion to proceed for system exercises regardless of who owns the media. The comment says "Allow coaches to manage system exercise media too", but this means any authenticated coach can delete media attached to shared system exercises, affecting all other coaches and clients.

**Fix**: For system exercises, only allow adding media (which no route currently does for system exercises), never deletion. If per-coach overrides are needed, consider a separate `ExerciseMediaOverride` model scoped to a `coachUserId`.

---

### 14. No rate limiting anywhere

**Files**: All auth routes and all list endpoints.

**Problem**: There is no rate limiting on any endpoint. This allows:
- Unlimited brute-force attempts on `POST /auth/login` — the bcrypt cost (12 rounds) slows individual checks but does not prevent distributed attacks
- Unlimited `POST /auth/forgot-password` — an attacker can flood any email address with reset emails and incur Resend API charges
- Unlimited `POST /auth/register` — account creation spam

**Fix**: Add rate limiting middleware. Options in the Next.js ecosystem: `@upstash/ratelimit` with Redis (recommended for serverless), or `express-rate-limit` if you migrate to a standalone server. At minimum, apply to all `/auth/*` endpoints.

---

## 🟢 Medium / Nice to Have

### 15. Stale `billingStatus` in JWT — token is valid for 30 days

**File**: `apps/api/lib/jwt.ts:5`

**Problem**: The JWT expiry is 30 days. The `billingStatus` field embedded in the token reflects the value at login time. If a client's billing lapses mid-period, the status in their token won't update until they log in again. The `auth.config.ts` NextAuth jwt callback re-reads billing status from the DB, but the custom JWT layer in `lib/jwt.ts` does not.

**Fix**: Either shorten token expiry (e.g. 1–7 days), implement refresh tokens, or have `requireRole` re-validate billing status from the DB for client-role tokens.

---

### 16. Duplicate JWT-secret lookup in two route files

**Files**:
- `apps/api/app/api/v1/auth/forgot-password/route.ts:7`
- `apps/api/app/api/v1/auth/reset-password/route.ts:7`

**Problem**: Both files redeclare `const SECRET = process.env.JWT_SECRET ?? ...` independently of `lib/jwt.ts`. This means the fallback value can drift (it already does: `lib/jwt.ts` falls back to `NEXTAUTH_SECRET`, but the auth routes only fall back to `"dev-secret"`). If `JWT_SECRET` is set but `NEXTAUTH_SECRET` is not, the reset tokens and the session tokens use different secrets.

**Fix**: Export `SECRET` from `lib/jwt.ts` (or add `signResetToken` / `verifyResetToken` helpers there) and import from that single source.

---

### 17. Raw SQL `$executeRaw` for set insertion — racy without a lock

**File**: `apps/api/app/api/v1/client/sessions/[sessionId]/exercises/[wseId]/sets/route.ts:42-49`

**Problem**: The `MAX(setNumber)+1` SELECT inside the raw INSERT is not atomic. Two concurrent POST requests for the same exercise will read the same `MAX` and both try to insert the same `setNumber`, hitting the `@@unique([workoutSessionExerciseId, setNumber])` constraint and returning an unhandled 500. The raw SQL also bypasses Prisma's type safety entirely.

**Fix**: Use `prisma.$transaction` with a `SELECT ... FOR UPDATE` to lock the row, or restructure to use `prisma.workoutSet.create` with a safe approach to generating the next set number (e.g. read current count inside a serializable transaction).

---

### 18. No pagination on `/coach/clients/[clientUserId]` session history — hardcoded `take: 20`

**File**: `apps/api/app/api/v1/coach/clients/[clientUserId]/route.ts:48-65`

**Problem**: The coach client detail view fetches the last 20 sessions and last 30 metric entries with no query params to page further. For active clients with long histories this silently drops data. The client history endpoint has cursor pagination (`GET /client/sessions`) but the coach-facing equivalent does not.

**Fix**: Add `?limit` and `?cursor` query parameters consistent with the client sessions endpoint.

---

### 19. `forgotPassword` leaks reset URL in the response when email sending fails

**File**: `apps/api/app/api/v1/auth/forgot-password/route.ts:37`

**Problem**: `return ok({ sent, resetUrl: sent ? undefined : resetUrl })` — when the Resend API call fails, the raw reset URL is returned in the API response body. This means a frontend bug that logs responses (or a malicious script with XSS access) gets a valid reset token without the user ever receiving an email.

**Fix**: Return only `{ sent: false }` when sending fails. Log the error server-side. Optionally surface a generic "email delivery failed, contact support" error.

---

### 20. `prisma.ts` does not log slow queries or errors in production

**File**: `apps/api/lib/prisma.ts`

**Problem**: `new PrismaClient()` with no configuration. In production there is no observability into slow queries, connection pool exhaustion, or query errors beyond what bubbles up to the application layer.

**Fix**:

```ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "production"
    ? [{ emit: "event", level: "error" }, { emit: "event", level: "warn" }]
    : ["query", "error", "warn"],
});
```

Wire the events to your logging/observability tool (e.g. Datadog, Sentry, or even stdout JSON).

---

### 21. Weak `Unique constraint` error detection via string matching

**Files**:
- `apps/api/app/api/v1/coach/exercises/route.ts:75-77`
- `apps/api/app/api/v1/coach/exercises/[exerciseId]/route.ts:70-72`

**Problem**: `if (msg.includes("Unique constraint"))` is a fragile heuristic. Prisma wraps DB errors in `PrismaClientKnownRequestError` with `code: "P2002"`. This is the correct way to detect unique violations.

**Fix**: `import { Prisma } from "@prisma/client"; if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") { ... }`

---

### 22. `GET /coach/clients/[clientUserId]` — sessions loaded without pagination, computing stats in JS

**File**: `apps/api/app/api/v1/coach/clients/[clientUserId]/route.ts:48-97`

**Problem**: Fetches 20 sessions, each with all their sets, and computes `totalVolume` and `avgRpe` in JavaScript. For a long session with many exercises and sets this is an N+1 fetch pattern (exercises → sets are nested in a single query but the aggregation runs in userland). As data grows this endpoint will become the slowest in the system.

**Fix**: Use Prisma's `_count` and aggregate queries, or compute stats in a DB view / generated column. At minimum, document the current take limit and add a cursor parameter.

---

### 23. `DELETE /coach/clients/[clientUserId]` — no `verifyAccess` check

**File**: `apps/api/app/api/v1/coach/clients/[clientUserId]/route.ts:169-182`

**Problem**: The `GET`, `PATCH`, and `POST` handlers all call `verifyAccess(auth.user.sub, clientUserId)` before proceeding, but the `DELETE` handler does not call `verifyAccess`. Instead it relies solely on the `updateMany` predicate `{ coachUserId: auth.user.sub, clientUserId, status: "active" }`. This is safe against data modification (the `coachUserId` guard in the WHERE clause prevents deactivating another coach's client), but it is inconsistent — if a logic bug ever removes that predicate, there is no secondary guard. More importantly, the lack of an explicit access check means the response for "not my client" (`notFound`) leaks information about whether the `clientUserId` exists in another coach's roster.

**Fix**: Add `if (!(await verifyAccess(auth.user.sub, clientUserId))) return forbidden();` before the `updateMany`, consistent with the other handlers.

---

### 24. `FoodLogEntry` model exists but has no API endpoints

**File**: `apps/api/prisma/schema.prisma:332-343`

**Problem**: The `FoodLogEntry` model is in the schema and would be migrated to the database, but there are no routes for it. This adds dead schema weight and a migration with no corresponding application logic.

**Fix**: Either add the planned food-log endpoints, or remove/comment out the model until the feature is ready to ship.

---

### 25. `WorkoutSet` index missing on `workoutSessionExerciseId`

**File**: `apps/api/prisma/schema.prisma:270-285`

**Problem**: `WorkoutSet` has a `@@unique([workoutSessionExerciseId, setNumber])` which implicitly creates an index on `(workoutSessionExerciseId, setNumber)`. This is adequate for point lookups, but the `DELETE` renumbering in `sets/[setNumber]/route.ts` does `findMany` ordered by `setNumber` — that query will use the composite unique index fine. However, there is no plain index on `workoutSessionExerciseId` alone, which could slow down bulk lookups if the query planner doesn't use the composite index for prefix scans. This is a minor point on PostgreSQL specifically but worth noting.

**Fix**: Add `@@index([workoutSessionExerciseId])` or verify EXPLAIN output confirms index use for session exercise set listings.

---

## ✅ What's Good

- **IDOR protection is generally solid**: Coach routes consistently call `verifyAccess(coachUserId, clientUserId)` or scope Prisma queries to `coachUserId: auth.user.sub`. The nested relation queries (e.g. `workoutTemplate: { coachUserId }` in `verifyOwner`) are a clean pattern.
- **bcrypt rounds at 12 on registration** — above the recommended minimum of 10, appropriate for a fitness app.
- **`api-auth.ts` is a single source of truth** for Bearer extraction and role enforcement; all routes use it instead of duplicating the parsing logic.
- **`api-response.ts` helpers** enforce a consistent JSON envelope `{ ok, data }` / `{ ok, error }` across all routes.
- **Prisma singleton pattern in `lib/prisma.ts`** correctly avoids connection pool exhaustion during Next.js hot-reload in development.
- **`sendResetEmail` and `sendInviteEmail` escape HTML output** with `escapeHtml()` — no XSS risk in email templates.
- **Session ownership check includes `clientUserId`** in all client-facing session queries (e.g. `findFirst({ where: { id: sessionId, clientUserId: auth.user.sub } })`).
- **`WorkoutSet` renumbering on delete uses a transaction** correctly.
- **Schema indexes** are well thought out on the most common query patterns (`CoachClient.coachUserId`, `WorkoutSession.[clientUserId, performedAt(sort: Desc)]`, `BodyMetricEntry.[clientUserId, measuredAt(sort: Desc)]`).
- **`forgot-password` route avoids user enumeration** by returning `ok({ sent: false })` for unknown emails (though see finding #19 for the follow-up bug).

---

## Production Readiness Checklist

- [ ] Remove `"dev-secret"` fallback from `lib/jwt.ts`, `forgot-password/route.ts`, and `reset-password/route.ts`; throw on missing secret at startup
- [ ] Add single-use enforcement to password-reset tokens (database table)
- [ ] Gate role assignment on registration (invite token or hard-code `"client"`)
- [ ] Fix CORS middleware to omit header for unrecognised origins; add production frontend URL
- [ ] Add top-level try/catch to all ~30 route handlers (or a shared wrapper)
- [ ] Add ownership/assignment check to `GET /client/workouts/[workoutTemplateId]`
- [ ] Add plan-assignment verification to `POST /client/sessions`
- [ ] Add rate limiting to all `/auth/*` endpoints (brute force, email flooding)
- [ ] Enforce consistent password minimum length (≥8 chars) on register and reset
- [ ] Fix `forgotPassword` to not return `resetUrl` in response on email failure
- [ ] Wrap plan assignment swap (deactivate + create) in a transaction
- [ ] Add `verifyAccess` guard to `DELETE /coach/clients/[clientUserId]`
- [ ] Add Prisma error logging / observability (`PrismaClient({ log: [...] })`)
- [ ] Replace `msg.includes("Unique constraint")` with `e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"`
- [ ] Fix raw SQL race condition in set creation (`$executeRaw` → transaction with lock)
- [ ] Add pagination to `GET /coach/clients/[clientUserId]`
- [ ] Set `JWT_SECRET`, `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXTAUTH_URL` in production environment (verify none are missing)
- [ ] Remove or implement `FoodLogEntry` model
- [ ] Add `HTTPS` enforcement and `Strict-Transport-Security` header in production proxy/edge config
- [ ] Configure Prisma connection pool size appropriate for the deployment platform (serverless vs. persistent)
- [ ] Add structured request logging (at minimum: method, path, status, duration)
