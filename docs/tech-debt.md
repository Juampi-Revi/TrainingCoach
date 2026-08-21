# Tech debt — Prioridad ejecutable

> Checklist vivo de deuda técnica. Actualizar al cerrar ítems.
> Origen: audit 2026-07 (audit-full/ux archivados tras cleanup).

---

## Lectura general

El audit está **bien encaminado** y detecta problemas reales, sobre todo en:

- seguridad del flujo de auth/sync,
- deuda estructural,
- consistencia de tipos,
- deuda en `gamification/`,
- falta de tests en flows críticos.

Pero conviene separar tres grupos:

1. **Confirmado y urgente**
2. **Confirmado pero no bloqueante**
3. **Ajustar redacción / revalidar antes de tocar**

---

## Ajustes importantes al audit

### Confirmado

- `refresh token` no rota en `POST /auth/refresh`
- callbacks de sync usan `pendingConnection` global por provider y **no validan `state`**
- `leaderboard.service.ts` tiene bug real con `IN (${userIds.join(",")})`
- `ExerciseSummary` está duplicado en `packages/types/index.ts`
- `lib/notify.ts` swallows errores completos con `catch {}`
- hay archivos grandes de verdad en training/session/media
- hay notificación duplicada al completar sesión

### Ajustar / bajar un cambio

- `SSE endpoint sin auth`:
  no está totalmente abierto. Hoy acepta:
  - token SSE one-time de 60s vía `/client/messages/stream-token`, o
  - Bearer JWT
  
  Igual hay deuda: el token SSE vive en memoria del proceso, no persiste y no es ideal para multi-instancia.

- `logout no revoca refresh token`:
  hoy **sí** llama `revokeRefreshToken()` en `auth/logout/route.ts`.
  Lo que sigue faltando es **rotación** y eventualmente `logout everywhere`.

- Garmin:
  el problema es serio, pero no exactamente "guarda password en texto plano en DB".
  Hoy guarda un `accessToken` base64 reversible con `oauth + email`, y además depende de `GARMIN_PASSWORD_FALLBACK`.
  Sigue siendo frágil y sensible, pero conviene describirlo con precisión.

---

## Orden recomendado

### P0 — Seguridad y bugs con impacto real

- [x] `T001` Rotar refresh token en cada uso
  - Archivo base: `apps/api/app/api/v1/auth/refresh/route.ts`
  - Criterio de cierre:
    - cada refresh invalida el token anterior
    - el cliente recibe nuevo `refreshToken`
    - tests cubren reuse de token viejo

- [x] `T002` Agregar revocación global de sesiones
  - Crear endpoint tipo `POST /auth/logout-all` o equivalente
  - Criterio:
    - invalida todas las sesiones refresh activas del usuario
    - queda documentado el comportamiento

- [x] `T003` Corregir callbacks OAuth de sync
  - Archivos: `apps/api/app/api/v1/client/sync/*/callback/route.ts`
  - Problema real:
    - usan la última `pendingConnection` del provider
    - no vinculan callback al usuario correcto
  - Criterio:
    - `state` firmado o token temporal con `userId`, `provider`, `expiresAt`
    - callback valida `state`
    - no depende de `findFirst({ provider })`

- [x] `T004` Corregir leaderboard friends filter
  - Archivo: `apps/api/lib/gamification/leaderboard.service.ts`
  - Criterio:
    - `IN` usa `Prisma.join(...)` o alternativa segura equivalente
    - test para `friendsOnly=true`

- [x] `T005` Eliminar duplicación de `ExerciseSummary`
  - Archivo: `packages/types/index.ts`
  - Criterio:
    - queda un solo `ExerciseSummary`
    - si hace falta, crear `ExerciseAnalyticsSummary` o nombre específico
    - typecheck limpio en web y api

- [x] `T006` Dejar visibles los errores de notify
  - Archivo: `apps/api/lib/notify.ts`
  - Criterio:
    - no queda `catch {}`
    - al menos loguea con contexto
    - no rompe el flujo principal si falla push

- [x] `T007` Eliminar notificación duplicada al completar sesión
  - Archivos:
    - `apps/api/lib/training/session.service.ts`
    - `apps/api/app/api/v1/client/sessions/[sessionId]/route.ts`
  - Criterio:
    - una sola fuente de verdad para `notify(session_completed)`

### P1 — Core de entrenamiento y consistencia

- [x] `T008` Unificar estados de sesión
  - `pending / in_progress / partial / completed / discarded`
  - Criterio:
    - regla escrita en doc
    - `/semana`, `/historial` y detalle usan el mismo contrato

- [ ] `T009` Revisar persistencia del logger
  - Criterio:
    - placeholders no se guardan como datos reales
    - guardado por serie o por fila queda explícito
    - casos timed/reps no se pisan

- [x] `T010` Agregar transacciones donde hoy hay multi-operación
  - `session.service.ts`
  - `plan.service.ts`
  - `athlete-solo.service.ts`
  - Criterio:
    - operaciones parciales no dejan datos huérfanos
  - Nota 2026-08: createSession + athlete-solo + partes de plan ya usan `$transaction`

### P2 — Deuda estructural más cara

- [ ] `T011` Partir `leaderboard.service.ts`
  - Propuesta:
    - `leaderboard/workouts.ts`
    - `leaderboard/volume.ts`
    - `leaderboard/xp.ts`
    - `leaderboard/streak.ts`

- [ ] `T012` Partir `client/sessions/[sessionId]/route.ts`
  - Extraer:
    - serializer
    - patch/update service
    - mapping de media/bloques

- [ ] `T013` Partir `media-manager.tsx`
  - Es hoy uno de los mejores candidatos de refactor
  - Extraer:
    - preview
    - upload controls
    - external url form
    - gallery list

- [ ] `T014` Partir `historial/page.tsx`
  - Extraer filtros, estado, lista y helpers de UI

- [ ] `T015` Bajar `useState` excesivo en builder/block modal
  - Archivos:
    - `app/coach/workouts/[workoutTemplateId]/page.tsx`
    - `app/coach/workouts/[workoutTemplateId]/_components/block-modal.tsx`
  - Criterio:
    - estado agrupado o movido a hooks

### P3 — Consistencia de plataforma

- [ ] `T016` Adoptar `validateBody` de forma sistemática
  - No hace falta atacar 62 rutas de una
  - Empezar por auth, training y health sync

- [ ] `T017` Tipar bien `Icon` y eliminar `as any`

- [x] `T018` Centralizar colores hardcodeados
  - mover tonos/avatar/status a constantes + variables CSS
  - Nota 2026-08: AVATAR_TONES / GROUP_COLORS + nav badges usan tokens; quedan casos puntuales

### P0 UX (sprint frontend 2026-08)

- [x] Sesión: CTA único + confirm incompleto, skip warmup, toast en completada
- [x] Nav: mensajes cliente/coach, agenda en shell, bottom nav con entrenos/mensajes, gym etiquetado experimental
- [x] Coach mobile: builder responsive, filtros agenda colapsables, dashboard triage-only
- [x] Pulido: resumen semana, empty semana→mensajes, historial a11y, barra planes falsa removida


- [ ] `T019` Completar `.env.example`
  - agregar email, Garmin y variables operativas faltantes

- [x] `T020` Documentar `gym/`
  - mínimo en `ARCHITECTURE.md`
  - idealmente también reglas puntuales en `AGENTS.md`

### P4 — Calidad y cobertura

- [ ] `T021` Tests para auth refresh/logout
- [ ] `T022` Tests para leaderboard friends filter
- [ ] `T023` Tests para session completion / notify
- [ ] `T024` Tests para health sync callbacks con `state`

---

## Primer sprint sugerido

Si lo hacemos con criterio de impacto/riesgo, mi recomendación es:

1. `T003` Callbacks OAuth con `state`
2. `T001` Rotación de refresh token
3. `T004` Bug de leaderboard
4. `T005` Duplicado de `ExerciseSummary`
5. `T006` + `T007` errores invisibles y notificación duplicada

Eso te limpia seguridad, un bug lógico real y dos fuentes de comportamiento confuso sin abrir todavía el melón grande del refactor.

---

## Secuencia de ejecución recomendada

### Bloque 1

- [ ] `T003`
- [ ] `T001`
- [ ] `T004`

### Bloque 2

- [ ] `T005`
- [ ] `T006`
- [ ] `T007`

### Bloque 3

- [ ] `T008`
- [ ] `T009`
- [ ] `T010`

### Bloque 4

- [ ] `T011`
- [ ] `T012`
- [ ] `T013`
- [ ] `T014`
- [ ] `T015`

---

## Qué no atacaría primero

- Prisma enums en masa
- migración completa de arquitectura por dominio vs rol
- limpieza total de hex colors
- split de todos los archivos oversized a la vez
- reemplazo completo del módulo Garmin

Todo eso suma, pero hoy no es lo que más reduce riesgo.

---

## Próximo paso práctico

Abrir una rama de trabajo orientada a `Bloque 1` y resolver esos 3 puntos con tests mínimos.
