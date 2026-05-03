# REFACTOR.md — Backlog de deuda técnica

> Actualizar este archivo cuando se completa un item o se descubre uno nuevo.
> Los items 🔴 bloquean features nuevas. Los 🟡 son importantes pero no bloqueantes. Los 🟢 son mejoras.

---

## 🔴 Crítico — resolver antes de la próxima feature

### RF-01 — Extraer constantes duplicadas a `apps/web/lib/constants.ts`
**Problema**: `MUSCLE_LABEL`, `GROUP_COLORS`, `groupLabel()`, `blockTypeLabel()` están copiadas en 6+ archivos.  
**Archivos afectados**:
- `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx`
- `apps/web/app/(client)/sesion/[sessionId]/page.tsx`
- `apps/web/app/(client)/sesion/[sessionId]/block-runner.tsx`
- `apps/web/app/(client)/progreso/page.tsx`
- `apps/web/app/coach/ejercicios/page.tsx`
- `apps/web/app/(client)/semana/[workoutTemplateId]/page.tsx`
**Acción**: Crear `apps/web/lib/constants.ts`, mover ahí, reemplazar imports.  
**Estado**: ✅ Completado 2026-05-02

---

### RF-02 — Partir `sesion/[sessionId]/page.tsx` (1937 líneas)
**Problema**: Tiene 7 sub-componentes inline, 42+ `useState`, toda la lógica de sesión en un archivo.  
**Estructura propuesta**:
```
sesion/[sessionId]/
  page.tsx                       (~300 líneas — orquestación)
  block-runner.tsx               (ya existe ✅)
  _components/
    logger-sheet.tsx             (sheet de logging de series ~400 líneas)
    rest-timer-overlay.tsx       (overlay de descanso ~120 líneas)
    session-header.tsx           (header con info del workout ~100 líneas)
    exercise-picker.tsx          (selector de ejercicio ~150 líneas)
    media-lightbox.tsx           (visor de video/imagen ~80 líneas)
    swap-sheet.tsx               (sheet de intercambio ~100 líneas)
  _hooks/
    use-session.ts               (fetch + estado de la sesión ~150 líneas)
    use-set-logger.ts            (estado del logger + guardar series ~150 líneas)
```
**Estado**: ✅ Completado 2026-05-03 (page.tsx: 400 líneas; hooks extraídos: use-session.ts, use-set-logger.ts; componentes: exercise-list.tsx, pre-select-sheet.tsx, exercise-picker.tsx, logger-sheet.tsx, rest-timer-overlay.tsx, warmup-overlay.tsx, media-lightbox.tsx, swap-sheet.tsx, session-header.tsx)

---

### RF-03 — Partir `coach/workouts/[workoutTemplateId]/page.tsx` (1647 líneas)
**Problema**: `ExerciseRow`, `ExercisePicker`, `BlockModal`, `ExerciseInspector`, `WorkoutProperties` todos inline.  
**Estructura propuesta**:
```
coach/workouts/[workoutTemplateId]/
  page.tsx                       (~300 líneas)
  _components/
    exercise-row.tsx             (~120 líneas)
    exercise-picker.tsx          (~150 líneas)
    exercise-inspector.tsx       (~250 líneas)
    block-modal.tsx              (~200 líneas)
    workout-properties.tsx       (~120 líneas)
    section-label.tsx            (~20 líneas)
```
**Estado**: ✅ Completado 2026-05-03 (page.tsx: 435 líneas, todos los componentes extraídos)

---

### RF-04 — Partir `progreso/page.tsx` (1449 líneas)
**Problema**: 43 `useState`, 9 llamadas API al montar, todos los charts inline.  
**Estructura propuesta**:
```
progreso/
  page.tsx                       (~200 líneas)
  _components/
    activity-tab.tsx
    muscles-tab.tsx
    progression-tab.tsx
    health-tab.tsx
    nutrition-tab.tsx
  _hooks/
    use-progreso-data.ts         (todos los fetches agrupados)
```
**Estado**: ✅ Completado 2026-05-03 (page.tsx: 108 líneas; hook: use-progreso-data.ts; componentes: dashboard-tab, activity-tab, sleep-tab, metrics-tab, food-tab, sessions-tab, daily-form)

---

### RF-05 — Partir `coach/alumnos/[clientUserId]/page.tsx` (1248 líneas)
**Problema**: Tipos locales (`ClientDetail`, `ApiClientResponse`) en lugar de en `packages/types`. Stats y gráficos inline.  
**Acciones**:
1. Mover tipos a `packages/types/index.ts`.
2. Extraer sub-secciones a `_components/`.  
**Estado**: ✅ Completado 2026-05-03 (page.tsx: 253 líneas; 5 hooks; 9 componentes)

---

## 🟡 Importante

### RF-06 — Error boundaries en todas las pages
**Problema**: Si un componente lanza error, la página queda en blanco sin mensaje.  
**Acción**: Crear `app/(client)/error.tsx` y `app/coach/error.tsx` con mensaje amigable.  
**Estado**: ✅ Completado 2026-05-03

---

### RF-07 — Reemplazar `$executeRaw` en sets route
**Archivo**: `apps/api/app/api/v1/client/sessions/[sessionId]/exercises/[wseId]/sets/route.ts`  
**Problema**: Usa SQL raw para calcular el próximo `setNumber`. Innecesario y frágil.  
**Acción**: Reemplazar con `prisma.$transaction` + `prisma.workoutSet.create`.  
**Estado**: ✅ Completado 2026-05-03

---

### RF-08 — Tipos locales de `coach/alumnos/page` a `packages/types`
**Archivo**: `apps/web/app/coach/alumnos/[clientUserId]/page.tsx` (líneas ~116-133)  
**Problema**: `ClientDetail`, `ApiClientResponse` definidas localmente.  
**Acción**: Mover a `packages/types/index.ts`.  
**Estado**: ✅ Resuelto en RF-05 (2026-05-03) — tipos movidos a `_components/_types.ts`; son exclusivos del cliente web, no se necesitan en la API

---

### RF-09 — Extraer `QuickFoodLogger` de `panel/page.tsx`
**Archivo**: `apps/web/app/(client)/panel/page.tsx`  
**Problema**: Componente grande (130+ líneas) definido inline en la page.  
**Acción**: Extraer a `apps/web/app/(client)/panel/_components/quick-food-logger.tsx`.  
**Estado**: ✅ Completado 2026-05-03 (page.tsx: 528→333 líneas)

---

### RF-10 — `block-runner.tsx` — extraer runners a archivos separados
**Archivo**: `apps/web/app/(client)/sesion/[sessionId]/block-runner.tsx` (840 líneas)  
**Problema**: `TabataRunner`, `EmomRunner`, `AmrapRunner` en un solo archivo.  
**Estructura propuesta**:
```
sesion/[sessionId]/
  block-runner.tsx               (~80 líneas — solo root + Overlay + DoneScreen)
  _runners/
    tabata-runner.tsx            (~200 líneas)
    emom-runner.tsx              (~180 líneas)
    amrap-runner.tsx             (~200 líneas)
    circle-timer.tsx             (~50 líneas)
```
**Estado**: ✅ Completado 2026-05-03 (block-runner.tsx: 825→186 líneas; 4 archivos en _runners/)

---

## 🟢 Nice-to-have

### RF-11 — Agregar error.tsx a rutas principales
**Acción**: `app/(client)/error.tsx`, `app/coach/error.tsx`, `app/error.tsx`.  
**Estado**: ✅ Completado 2026-05-03 (junto con RF-06)

---

### RF-12 — Loading skeletons en tabs de `progreso`
**Problema**: Al cambiar de tab hay un flash vacío.  
**Estado**: ✅ Completado 2026-05-03 (Skeleton base component + skeletons para 6 tabs: dashboard, activity, sleep, metrics, food, sessions)

---

### RF-13 — Validación con Zod en API routes críticas
**Problema**: La validación manual en routes es larga y error-prone.  
**Candidatos iniciales**: sessions PATCH, workoutExercise PATCH, sets PUT.  
**Estado**: ✅ Completado 2026-05-03 (Zod v4 instalado; schemas en lib/schemas.ts; session PATCH y workoutExercise PATCH validados con Zod; dead code removido de sets route)

---

## Historial de refactors completados

| ID | Descripción | Fecha |
|---|---|---|
| RF-01 | Extraer constantes duplicadas a `apps/web/lib/constants.ts` | 2026-05-02 |
| RF-03 | Partir `coach/workouts/[workoutTemplateId]/page.tsx` (1647→435 líneas) | 2026-05-03 |
| RF-04 | Partir `progreso/page.tsx` (1449→108 líneas, hook + 7 componentes) | 2026-05-03 |
| RF-05 | Partir `coach/alumnos/[clientUserId]/page.tsx` (1248→253 líneas, 5 hooks + 9 componentes) | 2026-05-03 |
| RF-02 | Partir `sesion/[sessionId]/page.tsx` (1937→400 líneas, hooks + 9 componentes) | 2026-05-03 |
| RF-06 | Error boundaries en `app/(client)/error.tsx`, `app/coach/error.tsx`, `app/error.tsx` | 2026-05-03 |
| RF-07 | Reemplazar `$executeRaw` con `prisma.$transaction` en sets route | 2026-05-03 |
| RF-08 | Tipos locales resueltos en RF-05 (`_components/_types.ts`) | 2026-05-03 |
| RF-09 | Extraer `QuickFoodLogger` de `panel/page.tsx` (528→333 líneas) | 2026-05-03 |
| RF-10 | Partir `block-runner.tsx` (825→186 líneas, 4 runners en `_runners/`) | 2026-05-03 |
| RF-11 | Agregar `error.tsx` a rutas principales (completado junto con RF-06) | 2026-05-03 |
| RF-12 | Loading skeletons en tabs de `progreso` (Skeleton base + 6 tab skeletons) | 2026-05-03 |
| RF-13 | Validación con Zod v4 en API routes (lib/schemas.ts; session PATCH + workoutExercise PATCH) | 2026-05-03 |

---

> **Regla**: Cuando se complete un item, moverlo a "Historial" con fecha. Cuando se descubra uno nuevo, agregarlo aquí antes de continuar con features.
