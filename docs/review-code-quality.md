# Code Quality Review — TrainingApp

## Summary

The codebase is a well-structured pnpm monorepo with a clear separation between API (`apps/api`) and frontend (`apps/web`). The architecture decisions are sound: a centralized `packages/types` for shared types, a clean `api-response.ts` helper, and a consistent `requireRole` auth guard pattern. The JWT token flow is simple and coherent.

The main quality concerns are:

1. **God components** — two pages exceed 950 lines and mix UI, business logic, and multiple sub-components
2. **Duplicated code** — constants and helpers that are copy-pasted across 3+ files
3. **Silent error swallowing** — `console.error` without user feedback is pervasive (30+ instances)
4. **Security issues** — hardcoded fallback JWT secret, inconsistent bcrypt rounds, CORS whitelist with no env-based override
5. **Stale closures / missing `useCallback` deps** — `api` client is recreated on every render and used as an effect dependency, causing potential infinite loops
6. **No input validation on the frontend** — payloads are sent to the API with no local type-narrowing

---

## 🔴 Critical Issues

### 1. JWT secret falls back to a hardcoded value in production

**Files**: `apps/api/lib/jwt.ts:3`, `apps/api/app/api/v1/auth/forgot-password/route.ts:7`, `apps/api/app/api/v1/auth/reset-password/route.ts:7`

**Problem**: `const SECRET = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret"`. If `JWT_SECRET` is missing from the production environment, tokens are signed with the literal string `"dev-secret"`. Any attacker who reads this source can forge valid JWTs for any user. The secret is duplicated in three files — each file independently duplicates the fallback.

**Fix**: Throw a startup error when the secret is undefined; centralize the read in `lib/jwt.ts` and import it from there.

```ts
// lib/jwt.ts
const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("JWT_SECRET env var is required");
```

### 2. `api` client is recreated every render, causing potential infinite re-fetch loops

**File**: `apps/web/lib/auth.tsx:72`

**Problem**: `const api = createClient(state.token)` is called inline in the render body of `AuthProvider`. This creates a new object reference on every state change. Consumers use `api` as a `useEffect` dependency, so any state update in `AuthProvider` (e.g., `user` changing) will trigger a new fetch in every page. Currently masked by the fact that most pages only use `api` once on mount, but it is a structural time-bomb for any page with multiple effects.

**Fix**: Memoize the client with `useMemo`:

```ts
const api = useMemo(() => createClient(state.token), [state.token]);
```

### 3. Inconsistent bcrypt work factor between register and reset-password

**Files**: `apps/api/app/api/v1/auth/register/route.ts:17`, `apps/api/app/api/v1/auth/reset-password/route.ts:25`

**Problem**: Passwords hashed at registration use `bcrypt.hash(password, 12)` but passwords set via password-reset use `bcrypt.hash(password, 10)`. A user whose password is reset will have a weaker hash. Define the rounds as a single constant and share it.

**Fix**:

```ts
// lib/auth-config.ts
export const BCRYPT_ROUNDS = 12;
```

### 4. CORS origin list is hardcoded — no production override

**File**: `apps/api/middleware.ts:3`

**Problem**: `ALLOWED_ORIGINS` contains only `localhost` addresses with no way to override via environment variable. Deploying to production requires a code change. The fallback on a non-matching origin is `ALLOWED_ORIGINS[0]` (`localhost:3001`), which silently allows CORS from the wrong origin for browsers that send no `Origin` header.

**Fix**:

```ts
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3001").split(",");
```

---

## 🟡 Technical Debt (High Priority)

### 5. God components — pages exceed 950 lines

**Files**:
- `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx` — 1007 lines
- `apps/web/app/(client)/sesion/[sessionId]/page.tsx` — 956 lines

**Problem**: Both files define multiple sub-components (`ExercisePicker`, `MediaLightbox`, `SwapSheet`, `RestTimerOverlay`, `GroupBadge`, `AlternativesPanel`, `ExerciseRow`) inline. This makes the file hard to navigate, difficult to test, and impossible to reuse. The `SessionInProgressPage` alone manages 15 state variables.

**Fix**: Extract each sub-component into its own file under a co-located folder, e.g.:
```
app/(client)/sesion/[sessionId]/
  page.tsx              ← orchestration only (~150 lines)
  exercise-picker.tsx
  media-lightbox.tsx
  swap-sheet.tsx
  rest-timer.tsx
```

### 6. `MUSCLE_LABEL`, `GROUP_COLORS`, and `groupLabel` are copy-pasted across 3 files

**Files**:
- `apps/web/app/(client)/sesion/[sessionId]/page.tsx:30-50`
- `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx:14-28`, `:53-58`
- `apps/web/app/coach/ejercicios/page.tsx:31-33`

**Problem**: All three define identical or near-identical `MUSCLE_LABEL` maps and `GROUP_COLORS` records. A new muscle group or color change requires three edits. `groupLabel` is duplicated verbatim.

**Fix**: Move to a shared module, e.g. `apps/web/lib/fitness-labels.ts` and import from there.

### 7. `parseOptionalInt`, `parseOptionalDecimal`, and `resolveExercise` are duplicated across two API route files

**Files**:
- `apps/api/app/api/v1/client/sessions/[sessionId]/exercises/[wseId]/sets/route.ts:9-31`
- `apps/api/app/api/v1/client/sessions/[sessionId]/exercises/[wseId]/sets/[setNumber]/route.ts:9-31`

**Problem**: Exact copy of three functions. A bug fix must be made in two places.

**Fix**: Extract to `apps/api/lib/parse-fields.ts` and import.

### 8. Silent `console.error` swallows errors without user feedback

**Files**: 30+ instances across `apps/web/app/**`

**Problem**: The dominant error handling pattern in the frontend is `catch (e) { console.error(e); }` with no toast, no state update, no retry UI. From the user's perspective, the action silently failed. This is especially bad in `logSet` (session page) and `moveExerciseInSection` (workout editor).

**Fix**: Adopt a consistent pattern — use `toast.error(...)` for all user-triggered mutations. The `useToast` hook already exists and is used in some places. The gap is inconsistent adoption.

```ts
// Before
} catch (e) { console.error(e); }

// After
} catch (e) {
  toast.error(e instanceof Error ? e.message : "Error inesperado");
}
```

### 9. `progreso/page.tsx` has a `load` function defined in render scope used as an effect dependency

**File**: `apps/web/app/(client)/progreso/page.tsx:23-31`

**Problem**: `load` is defined as a plain function in the component body (not `useCallback`), then used in `useEffect(() => { load(); }, [api])`. Because `load` is redefined every render, it is technically a missing dependency. More critically, `load` is also called after `logWeight()`, so if `api` changes, the effect runs again — which is fine here but is an unreliable pattern. ESLint with `exhaustive-deps` would flag this.

**Fix**: Wrap `load` in `useCallback` like the other pages already do.

### 10. `(updated as any)` cast in workout exercise PATCH route

**File**: `apps/api/app/api/v1/coach/workouts/[workoutTemplateId]/exercises/[weId]/route.ts:49-50`

**Problem**: `supersetGroup` and `isWarmup` are accessed via `(updated as any).supersetGroup`. The `include` on the Prisma query returns the full model including these fields, but the type is inferred without them because the `update` call uses `include: { exercise: ... }` without selecting the root model fields. This is a Prisma typing quirk, not a runtime bug, but the cast hides whether the fields actually exist.

**Fix**: Use a typed `select` instead of `include` that explicitly lists the required fields, or use `Prisma.WorkoutExerciseGetPayload` to type the result.

### 11. `SessionInProgressPage` uses `api` from closure in `logSet`/`deleteSet`/`saveNotes` but uses `apiRef.current` in `flushQueue`/`load` — inconsistent pattern

**File**: `apps/web/app/(client)/sesion/[sessionId]/page.tsx:338-465`

**Problem**: `apiRef` is introduced to avoid stale closures in callbacks, but several other async functions (`logSet`, `deleteSet`, `saveNotes`, `completeSession`) still use `api` directly from the closure. This means those functions hold a stale reference to `api` if the token changes mid-session (unlikely, but structurally wrong). The pattern is half-applied.

**Fix**: Either use `apiRef.current` consistently in all async functions that run after a delay or in callbacks, or rely on `useCallback` with `api` in the dep array.

### 12. No validation on PATCH body fields against the allowed status values — status bypassed as plain string

**File**: `apps/api/app/api/v1/client/sessions/[sessionId]/route.ts:126`

**Problem**: The validation `if (status && !["in_progress", "completed", "discarded"].includes(status))` uses a magic string array. The same strings appear in `packages/types/index.ts` as `SessionStatus`. On the API side, Prisma enforces the enum at the DB level, but the error message and 400 response happen before that check. Inconsistently, the plan status PATCH does not validate the incoming status at all (line 115 of `plans/[planId]/route.ts`).

**Fix**: Parse and narrow against the shared `SessionStatus` / `PlanStatus` types. Use a shared validation helper or Zod.

---

## 🟢 Minor Issues / Nits

### 13. Cursor-based pagination uses `id` for ordering — potential instability

**File**: `apps/api/app/api/v1/client/sessions/route.ts:19`

**Problem**: The cursor is `id: { lt: cursor }` but the list is ordered by `performedAt`. If two sessions have the same `performedAt` and different IDs, the cursor-based slicing will miss or duplicate items. The cursor should be a stable ordering key (e.g., `performedAt + id`).

### 14. `resetUrl` exposed in response in development

**File**: `apps/api/app/api/v1/auth/forgot-password/route.ts:37`

**Problem**: `return ok({ sent, resetUrl: sent ? undefined : resetUrl })` — if the email service fails, the password-reset URL is returned in the API response body. In a real deployment this leaks the token. Acceptable in development but should not reach production.

**Fix**: Only include `resetUrl` when `NODE_ENV !== "production"`.

### 15. `moveExerciseInSection` applies the API call with a stale reference to `exercises`

**File**: `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx:683-699`

**Problem**: After calling `setExercises(...)`, the next line reads `const we = exercises.find(...)` — this reads the stale pre-update snapshot of `exercises`. The `newOrder` calculation may be based on an already-swapped position. The order sent to the API may occasionally be wrong.

**Fix**: Compute `newOrder` before calling `setExercises`, or pass the new order through the state updater function.

### 16. Using `Math.random()` for toast IDs

**File**: `apps/web/lib/toast.tsx:37`

**Problem**: `const id = Math.random().toString(36).slice(2)` is non-deterministic and not unique (collision probability negligible, but semantically wrong). Use `crypto.randomUUID()` which is available in all modern environments and Next.js.

### 17. Inline SVG chart duplicated logic and `as number` cast

**Files**: `apps/web/app/(client)/progreso/page.tsx:169-199`, `apps/web/app/coach/alumnos/[clientUserId]/page.tsx:539-572`

**Problem**: Two separate hand-rolled SVG line charts with nearly identical calculation logic. The `(m.weight as number)` cast is unsafe — `weight` is `number | null` and filtered with `.filter((m) => m.weight)` which works but TypeScript should infer this from the filter (it doesn't narrow with a nullable check). Consider a shared `<WeightChart data={...} />` component.

### 18. `Intensity` selector in workout editor is local state never saved

**File**: `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx:638`

**Problem**: `const [intensity, setIntensity] = useState<IntensityLabel>("Media")` is rendered as a toggle in the inspector but is never sent to the API, never loaded from the template data, and the template `type` field exists for this purpose. The UI gives users false confidence they're configuring something that persists.

**Fix**: Either wire it to the `type` field in the template, or remove the UI until it's implemented.

### 19. `DELETE /coach/clients/[clientUserId]` does not verify access before deleting

**File**: `apps/api/app/api/v1/coach/clients/[clientUserId]/route.ts:169-182`

**Problem**: The `DELETE` handler calls `updateMany` with `where: { coachUserId: auth.user.sub, clientUserId }` — the auth check is implicit in the query filter. This is safe but inconsistent with the other methods in the same file that call `verifyAccess` first. A notFound return when `count === 0` is the right behavior, but the pattern is different from the rest of the file.

### 20. `ExercisePicker` fetches the full exercise list on every search keystroke without debouncing

**Files**: `apps/web/app/(client)/sesion/[sessionId]/page.tsx:67-71`, `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx:75-80`

**Problem**: `useEffect` fires on every `search` change, triggering an API call per character typed. No debounce is applied. With a large exercise library, this creates unnecessary server load and a janky UX.

**Fix**: Debounce the search value (e.g., 300ms) before using it as an effect dependency.

---

## ✅ Good Patterns Worth Keeping

- **`api-response.ts` helpers** — `ok`, `err`, `unauthorized`, `forbidden`, `notFound` cleanly standardize all API responses. Every route uses them consistently.
- **`requireRole` auth guard** — single function that handles token extraction, verification, and role check. No route re-implements this logic.
- **`packages/types/index.ts`** — shared type definitions prevent API/frontend drift. The `ApiResponse<T>` envelope is especially good.
- **Offline queue for set logging** — the `navigator.onLine` check + localStorage queue + `online` event flush in the session page is a genuinely good resilience pattern for mobile.
- **`createClient(token)` pattern** — injecting the token at the call site rather than in a global singleton avoids context-leaking between users in SSR scenarios.
- **Prisma ownership guards** — queries like `findFirst({ where: { id, coachUserId } })` enforce row-level ownership at the DB query rather than in application logic.
- **`ApiError` class with `status`** — typed error from the fetch client that preserves HTTP status codes for callers.
- **`getOwned` helper in exercises route** — elegant pattern that returns either `{ ex, error: null }` or `{ ex: null, error: Response }`, removing the if-chain from every handler.

---

## Recommended Refactors (Prioritized)

1. **Fix the JWT secret fallback** (security — 30 min) — throw at startup if `JWT_SECRET` is unset; remove duplication across the three files that copy `SECRET`.

2. **Memoize `api` in `AuthProvider`** (correctness — 15 min) — replace the inline `createClient()` call with `useMemo(() => createClient(state.token), [state.token])`.

3. **Unify bcrypt rounds** (security — 10 min) — extract `BCRYPT_ROUNDS = 12` into `lib/auth-config.ts` and import it in both `register` and `reset-password`.

4. **Extract shared constants** (maintainability — 1 hour) — move `MUSCLE_LABEL`, `GROUP_COLORS`, `groupLabel` to `apps/web/lib/fitness-labels.ts`; move `parseOptionalInt`, `parseOptionalDecimal`, `resolveExercise` to `apps/api/lib/parse-set-fields.ts`.

5. **Adopt `toast.error` uniformly** (UX — 2 hours) — replace every bare `catch (e) { console.error(e); }` in user-triggered mutations with a `toast.error(...)` call.

6. **Split the two god components** (maintainability — 3–4 hours each) — extract sub-components from `sesion/[sessionId]/page.tsx` and `workouts/[workoutTemplateId]/page.tsx` into co-located files.

7. **Add debounce to exercise search** (performance — 30 min) — a simple `setTimeout` / `clearTimeout` pattern or a small `useDebounce` hook.

8. **Fix `load` in `progreso/page.tsx`** (correctness — 10 min) — wrap `load` in `useCallback`.

9. **Remove or wire the `intensity` selector** (dead code — 15 min) — either persist it via the template `type` field or remove the UI.

10. **Move CORS origins to env** (ops — 15 min) — read `process.env.ALLOWED_ORIGINS` in `middleware.ts` so deployments don't require code changes.
