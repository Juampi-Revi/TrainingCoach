# Architecture Review — TrainingApp (Regen)

_Reviewed: 2026-04-24_

---

## Summary

A pnpm monorepo with two Next.js 15 apps (API-only backend + frontend) and one shared-types package. The core domain is solid and well-normalised. The auth system is hand-rolled JWT on the API side and works correctly. The component library (CSS-variables, no Tailwind) is lean and consistent. The API routes follow a clean resource-oriented structure with a small shared utility layer.

Key concerns before going live: the `dev-secret` JWT fallback can leak into production, there is no input validation library (raw `req.json()` everywhere), three page files exceed 500 lines with full components defined inline, the CORS allowlist is localhost-only, and the dead `next-auth`/`auth.config.ts` code creates confusion alongside the real hand-rolled JWT system.

---

## Structure Map

```
TrainingChallengeRecomposition/
├── package.json                  # root orchestrator (pnpm workspaces)
├── pnpm-workspace.yaml           # apps/* + packages/*
├── docker-compose.yml            # postgres:15 (note: schema targets postgres 16)
│
├── apps/
│   ├── api/                      # @regen/api  — Next.js 15, port 3003
│   │   ├── app/api/v1/
│   │   │   ├── auth/             # login, register, me, forgot-password, reset-password
│   │   │   ├── client/           # sessions, week, metrics, workouts
│   │   │   ├── coach/            # clients, exercises, plans, workouts, messages
│   │   │   └── sessions/         # shared comments endpoint (coach+client)
│   │   ├── lib/
│   │   │   ├── api-auth.ts       # extractBearer / requireRole
│   │   │   ├── api-response.ts   # ok / err / unauthorized / forbidden / notFound
│   │   │   ├── jwt.ts            # signToken / verifyToken
│   │   │   ├── prisma.ts         # singleton prisma client
│   │   │   ├── email.ts          # Resend integration (reset, invite, comment)
│   │   │   └── cloudinary.ts     # Cloudinary SDK init
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 13 models, PostgreSQL
│   │   │   └── migrations/       # 10 migrations (Apr 2026)
│   │   └── auth.config.ts        # DEAD — leftover NextAuth config (unused)
│   │
│   └── web/                      # @regen/web  — Next.js 15, port 3001
│       ├── app/
│       │   ├── (client)/         # route group: semana, sesion, historial, progreso, cuenta, comentarios
│       │   ├── coach/            # dashboard, alumnos, planes, workouts, ejercicios, mensajes
│       │   ├── login/, registro/, olvide-contrasenia/, reset-password/
│       │   └── layout.tsx        # root: AuthProvider + ThemeProvider + ToastProvider
│       ├── lib/
│       │   ├── api.ts            # typed fetch wrapper + ApiError class
│       │   ├── auth.tsx          # AuthProvider + useAuth (localStorage JWT)
│       │   ├── theme.tsx         # dark/light toggle
│       │   └── toast.tsx         # toast system
│       └── components/
│           ├── ui/               # Button, Badge, Card, Tabs, Avatar, KPI, Input, Icon, Table, StateBlock, Progress
│           └── layout/           # DesktopShell, CoachBottomNav, mobile-tab-bar
│
└── packages/
    └── types/index.ts            # shared type contracts (ApiResponse, AuthUser, SessionDetail, …)
```

---

## Critical Issues

### 1. Hardcoded JWT fallback secret in production code

**Files:** `apps/api/lib/jwt.ts:3`, `apps/api/app/api/v1/auth/forgot-password/route.ts:7`, `apps/api/app/api/v1/auth/reset-password/route.ts` (duplicated SECRET derivation).

```ts
// jwt.ts — line 3
const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret";
```

If `JWT_SECRET` is missing from the production environment the string `"dev-secret"` becomes the signing secret. Any token signed in dev is then valid in prod, and vice versa. The app should throw at startup if the secret is absent, not silently downgrade.

The same `SECRET` derivation is copy-pasted into `forgot-password/route.ts:7` instead of importing from `lib/jwt.ts`. Any future change to the secret logic must be applied in two places.

**Fix:** Remove the `"dev-secret"` fallback; throw `Error("JWT_SECRET is required")` if undefined. Extract SECRET into `lib/jwt.ts` and import from there everywhere.

---

### 2. Dead NextAuth code creates auth ambiguity

**Files:** `apps/api/auth.config.ts`, `apps/api/types/next-auth.d.ts`. The package also lists `next-auth` and `@auth/prisma-adapter` as runtime dependencies.

The app ships with a fully-configured NextAuth `CredentialsProvider` that duplicates the hand-rolled JWT login logic (same bcrypt check, same billing gate). There are no NextAuth route handlers anywhere in `app/api/`, so this code is never executed — but it occupies ~74 lines, adds two dependencies to the bundle, and will confuse any new developer.

**Fix:** Delete `auth.config.ts`, remove `next-auth` and `@auth/prisma-adapter` from `package.json`.

---

### 3. No input validation layer — raw `req.json()` throughout API

Every API route calls `req.json().catch(() => ({}))` and then destructures fields with no schema validation. Examples of what this permits:

- `POST /coach/plans` accepts `weeksCount: "hello"` silently (Prisma will attempt to write a string to an Int column and throw a 500).
- `POST /coach/exercises` only checks that `name` is truthy; `primaryMuscle` and `equipment` accept any string.
- `PATCH /client/sessions/:id` allows `energyRating` to be any value; there is no check it is 1–10 (or whatever the intended range is).

Unvalidated input that reaches Prisma produces raw Prisma error objects that bubble up as unhandled exceptions (Next.js converts them to 500 responses with no useful body in production).

**Fix:** Introduce `zod` (or equivalent) and define a schema per endpoint body. The `lib/` layer is already a good home for shared schemas.

---

## High Priority

### 4. CORS allowlist is localhost-only

**File:** `apps/api/middleware.ts:3-7`

```ts
const ALLOWED_ORIGINS = [
  "http://localhost:3001",
  "http://localhost:3000",
  "http://localhost:3011",
];
```

The production frontend origin is not listed. Any deployed version of `@regen/web` will hit CORS failures on every request.

**Fix:** Add `process.env.ALLOWED_ORIGIN` (or the Vercel/production URL) to the list at runtime.

---

### 5. God-files: three page components exceed 500 lines

| File | Lines | Components defined inline |
|---|---|---|
| `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx` | **1 007** | `ExercisePicker`, `GroupBadge`, `AlternativesPanel`, `ExerciseRow`, `SectionHeader` |
| `apps/web/app/(client)/sesion/[sessionId]/page.tsx` | **956** | `ExercisePicker`, `SwapModal`, `SetCard`, `ExerciseCard`, multiple local hooks |
| `apps/web/app/coach/ejercicios/page.tsx` | **616** | `ExerciseForm`, `MediaPanel` inline |
| `apps/web/app/coach/alumnos/[clientUserId]/page.tsx` | **599** | several local panels |
| `apps/web/app/(client)/comentarios/[sessionId]/page.tsx` | **597** | full session view + comment thread |

Beyond readability, this structure makes unit testing impossible and forces the entire component tree to re-render on any state change.

**Fix:** Extract the inline sub-components to `components/` files (e.g. `components/coach/ExercisePicker.tsx`). The workout template editor and session player are the most urgent candidates.

---

### 6. Duplicated constants and components across pages

The following are copy-pasted verbatim into at least two unrelated files:

- `MUSCLE_LABEL` dict — in `coach/workouts/[workoutTemplateId]/page.tsx:53`, `(client)/sesion/[sessionId]/page.tsx:30`, `coach/ejercicios/page.tsx`
- `GROUP_COLORS` dict — in `coach/workouts/[workoutTemplateId]/page.tsx:14`, `(client)/sesion/[sessionId]/page.tsx:37`
- `groupLabel()` function — same two files
- `ExercisePicker` modal — independent, near-identical implementations in both the coach workout editor and the client session player

**Fix:** Promote to `lib/constants.ts` (dictionaries) and `components/shared/ExercisePicker.tsx`.

---

### 7. Token stored in localStorage — XSS exposure

**File:** `apps/web/lib/auth.tsx:14`

```ts
const TOKEN_KEY = "regen_token";
// ...
localStorage.setItem(TOKEN_KEY, res.token);
```

Storing JWTs in `localStorage` means any XSS vulnerability can exfiltrate the token. A `httpOnly` cookie-based approach (even for a SPA-like setup) eliminates this entire class of risk.

This is a known trade-off acceptable during early development, but should be resolved before acquiring real users.

---

### 8. Token is never revoked / refreshed

**File:** `apps/api/lib/jwt.ts:5` — `EXPIRES_IN = "30d"`.

There is no refresh token flow, no token revocation list, and no server-side session table. A compromised token remains valid for 30 days with no recourse. Billing status is baked into the token at sign-in; a coach changing a client's billing status has no effect on active sessions until the token expires.

---

## Medium Priority

### 9. `FoodLogEntry` model has no routes, no UI

The `FoodLogEntry` model in `schema.prisma:332` is fully defined with 8 fields and a relation to `User`. There are zero API routes and zero UI components referencing it. Either delete it now or add a `// TODO` comment explaining the roadmap.

### 10. `PlanWorkout` model appears redundant

The schema has both `PlanWeekWorkout` (week × workout link) and `PlanWorkout` (plan × workout pool link). The route layer only ever writes `PlanWeekWorkout`. `PlanWorkout` has no routes writing to it. If it is a workout pool (templates available to the plan but not yet scheduled), document that intent; otherwise delete it.

### 11. `parseOptionalDecimal` duplicated in two adjacent route files

**Files:** `sets/route.ts:15` and `sets/[setNumber]/route.ts:15` — identical function body. Move to a `lib/parse.ts` utility.

### 12. Auth guard is client-side only — no server-side protection on web pages

**Files:** `apps/web/app/(client)/layout.tsx:31-35`, `apps/web/app/coach/layout.tsx:11-14`.

Auth checking is a `useEffect` that runs only on the client. Between hydration and the effect running, a non-authenticated user briefly sees the protected page content (or a blank screen). More importantly, SSR page content is rendered with no auth check at all.

This is acceptable for a pure client-rendered SPA but the app uses the Next.js App Router. Add a server-side redirect via `middleware.ts` for the web app, or at minimum use `cookies()` to read a token in server components.

### 13. Docker Compose pins postgres:15, schema targets postgres:16

`docker-compose.yml:3` uses `postgres:15`; the `prisma/schema.prisma` datasource comment and the production expectation is PostgreSQL 16. The `@db.Timestamptz` and other type annotations are compatible, but this creates a mismatch between local dev and production that could surface subtle behaviour differences.

### 14. `getAppUrl()` in `email.ts` uses `NEXTAUTH_URL` as the canonical app URL

**File:** `apps/api/lib/email.ts:37`. This is a `next-auth` environment variable being reused for a non-NextAuth purpose. Introduce a dedicated `APP_URL` variable so the dependency on the NextAuth naming convention is explicit and optional.

### 15. No error boundaries in the web app

There are zero `error.tsx` files under `app/` (confirmed by filesystem search). An unhandled error in any page component will crash the entire app to a blank screen in production. Next.js App Router supports per-segment `error.tsx` boundaries — at minimum add one at the `(client)/` and `coach/` segment roots.

### 16. No `loading.tsx` skeleton files

No loading states at the route segment level — all loading UI is implemented as component-level `useState<boolean>`. This means full-page transitions show nothing during navigation.

### 17. Missing `@regen/types` entries for several response shapes

Types in `packages/types/index.ts` do not cover:
- The `GET /coach/clients/:id` response (`ClientDetail`, `ApiClientResponse` are defined locally in `apps/web/app/coach/alumnos/[clientUserId]/page.tsx:115,128`)
- `MessageItem` (local in `coach/mensajes/page.tsx:9`)
- Exercise `MediaItem` (local in `coach/ejercicios/page.tsx:37`)
- `PlanDetail` with week/workout structure (local in `coach/planes/[planId]/page.tsx:18`)
- `ExerciseOption` / `AltItem` / `WE` — defined independently in at least two page files

The API routes shape these responses but the canonical types live only in consumer pages. A future API change will not produce a type error.

### 18. Intensity UI selector is not persisted

**File:** `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx:637` — `const [intensity, setIntensity] = useState<IntensityLabel>("Media")`. The "Intensidad" UI control updates local React state but the `save()` function on line 658 does not include `intensity` in the PATCH body. The field is purely decorative / does not map to any schema column.

---

## Positive Observations

**Clean API utility layer.** The four files in `apps/api/lib/` (`api-auth.ts`, `api-response.ts`, `jwt.ts`, `prisma.ts`) are small, focused, and used consistently across every route. The result/discriminated-union pattern in `AuthResult` is idiomatic TypeScript.

**Consistent route-handler pattern.** Every handler starts with `requireRole` (or `extractBearer`), returns early on failure, and uses the `ok()`/`err()` helpers. This is uniform across all ~25 route files.

**Well-normalised data model.** The schema covers the full domain cleanly: the `WorkoutExerciseAlternative` join table, `supersetGroup` on `WorkoutExercise`, and the `planned/performedExercise` dual-relation on `WorkoutSessionExercise` for exercise swaps are all thoughtfully modelled.

**`@regen/types` is actually used.** 14 import sites across the web app pull from the shared package. The API envelope (`ApiOk<T>`, `ApiError`) and primitive types (`UserRole`, `SessionStatus`, etc.) are consistently referenced. This is the right foundation — it just needs more coverage.

**Design system is cohesive.** CSS custom properties + a small component library (`Button`, `Badge`, `Icon`, `StateBlock`, etc.) yields a consistent visual language without a CSS framework dependency. Light/dark theming works via a single class toggle on `<html>`.

**Offline queue in session player.** `apps/web/app/(client)/sesion/[sessionId]/page.tsx` implements a local offline queue (`OfflineItem[]`) that replays failed set saves when connectivity is restored — a pragmatic resilience feature for mobile users mid-workout.

**Prisma singleton pattern is correct.** `apps/api/lib/prisma.ts` uses the `globalThis` guard to avoid creating multiple connections during Next.js hot reloads in development.

**bcrypt rounds are secure.** `bcrypt.hash(password, 12)` in `auth/register/route.ts:17` uses a cost factor of 12, which is appropriate for 2026 hardware.

---

## Production Readiness Checklist

Below is the minimum gate before accepting the first real user.

### Security
- [ ] Remove `"dev-secret"` fallback from `lib/jwt.ts` and both auth route files; throw if `JWT_SECRET` is unset
- [ ] Add production frontend URL to the CORS allowlist in `middleware.ts`
- [ ] Evaluate moving JWT to `httpOnly` cookie to eliminate XSS token theft
- [ ] Add input validation (Zod) for all POST/PATCH body shapes

### Configuration & Environment
- [ ] Document all required env vars in a `.env.example` file:
  - `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `NEXT_PUBLIC_API_URL` (web), `APP_URL` or `NEXTAUTH_URL` (api — rename to `APP_URL`)
- [ ] Align `docker-compose.yml` image to `postgres:16` to match production
- [ ] Remove or guard `reset-password` debug leak: `forgotPassword` route returns `resetUrl` in the response body when email is not configured (line 37 of `forgot-password/route.ts`)

### Dead Code
- [ ] Delete `apps/api/auth.config.ts` and `apps/api/types/next-auth.d.ts`
- [ ] Remove `next-auth` and `@auth/prisma-adapter` from `apps/api/package.json`
- [ ] Decide and document (or delete) `FoodLogEntry` model
- [ ] Decide and document (or delete) `PlanWorkout` model

### Error Handling & Observability
- [ ] Add `error.tsx` at `(client)/error.tsx` and `coach/error.tsx` (React error boundary segments)
- [ ] Add global Prisma error handler or try/catch in the small number of routes that currently let Prisma errors become 500s with stack traces (e.g. `POST /coach/exercises` unique-constraint path)
- [ ] Integrate a logging service (e.g. Axiom, Sentry) — currently all errors are `console.error` with no structured context

### Refactoring (before sustained feature work)
- [ ] Extract `MUSCLE_LABEL`, `GROUP_COLORS`, `groupLabel()` to `apps/web/lib/constants.ts`
- [ ] Extract `ExercisePicker` to `apps/web/components/shared/ExercisePicker.tsx` (remove ~130 lines of duplication)
- [ ] Move `parseOptionalDecimal` / `parseOptionalInt` to `apps/api/lib/parse.ts`
- [ ] Add missing response types to `packages/types/index.ts`: `ClientDetail`, `MessageItem`, `MediaItem`, `PlanDetail`, `ExerciseOption`
- [ ] Break `coach/workouts/[workoutTemplateId]/page.tsx` (~1 000 lines) into smaller component files

### Auth / Sessions
- [ ] Add server-side auth check via `middleware.ts` for the web app (eliminate client-only auth guard flash)
- [ ] Implement token refresh or shorten expiry from 30d; add billing-status revalidation path
