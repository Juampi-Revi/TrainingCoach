# MVP — Lista de Funciones (Paso a Paso)

Este documento transforma el roadmap del MVP en tareas implementables, con dependencias, alcance y criterios de aceptación.

## Cómo usar esta guía

- Implementar de arriba hacia abajo (prioridad).
- Cada ítem incluye: objetivo, alcance, pantallas/rutas, datos, lógica, criterios de aceptación y verificación.
- Mantener cada feature “mergeable”: cambios pequeños, medibles y con QA (lint/typecheck/build).

---

## 1) Asignaciones y calendario (MVP Core)

### 1.1 Reprogramar inicio de plan (cambiar startDate)

**Objetivo**
- Permitir que el coach ajuste la fecha de inicio de una asignación sin romper el “workout del día” ni el historial.

**Alcance**
- Coach cambia `startDate` de una asignación activa.
- El alumno ve recalculado el período/semana actual a partir del nuevo `startDate`.
- No se borran sesiones ya registradas; sólo cambia el “calendario” futuro.

**Pantallas / rutas**
- Coach: detalle de alumno (asignación) y/o detalle de plan asignado (según UI actual).
- Alumno: semana/plan (ya existente).

**Datos**
- Modelo principal: `PlanAssignment` (o equivalente).
- Campo: `startDate` (ya existe en el sistema, según lo implementado previamente).

**Lógica**
- Al guardar `startDate`, recalcular “período actual” usando `startDate + periodDays` del plan.
- Asegurar que el cálculo funcione si:
  - La fecha se mueve hacia atrás (el alumno “vuelve” a un período anterior).
  - La fecha se mueve hacia adelante (el alumno “salta” períodos).

**Criterios de aceptación**
- Cambiar `startDate` altera el “workout del día” que ve el alumno de forma consistente.
- Navegación entre períodos sigue funcionando.
- No hay estados intermedios rotos (no se queda sin plan ni con período inválido).

**Verificación**
- Smoke: asignación activa → cambiar inicio → abrir /home/client/week.
- QA: `npm run lint && npm run typecheck && npm run build`.

---

### 1.2 Pausar / reanudar asignación

**Objetivo**
- Permitir suspender temporalmente un plan asignado sin perder historial.

**Alcance**
- Botón “Pausar” y “Reanudar”.
- Durante pausa:
  - El alumno no ve “workout del día” (o ve estado “pausado”).
  - No se permite iniciar sesión asociada al plan (si aplica).

**Pantallas / rutas**
- Coach: alumno → asignación.
- Alumno: plan/semana.

**Datos**
- `PlanAssignment.status`: añadir/usar estados como `active` / `paused` / `ended` (si todavía no existen).

**Lógica**
- Al pausar: setear status `paused`.
- Al reanudar: volver a `active`.
- Definir regla para `startDate`:
  - Opción A: mantener `startDate` original (más simple).
  - Opción B: mover `startDate` al día de reanudación (más “intuitivo”).

**Criterios de aceptación**
- Pausar oculta el plan como activo para el alumno.
- Reanudar lo vuelve a mostrar de forma consistente.

**Verificación**
- Smoke: pausar → alumno no ve recomendado hoy → reanudar → vuelve a ver.

---

### 1.3 Vista “Hoy” del alumno (CTA único)

**Objetivo**
- Reducir fricción: una pantalla con el “workout del día” + botón grande “Iniciar sesión”.

**Alcance**
- Nueva ruta o sección destacada en home del alumno.
- Si no hay workout del día: estado vacío (y sugerencia).

**Pantallas / rutas**
- Alumno: `/home/client` o `/home/client/today` (según patrón actual).

**Datos**
- Reusar el cálculo actual de “workout recomendado hoy”.

**Lógica**
- Resolver workout del día según asignación activa y período vigente.
- Mostrar:
  - título del workout
  - lista resumida de ejercicios (si aplica)
  - CTA “Iniciar sesión”

**Criterios de aceptación**
- En 1 click el alumno entra al flujo de registrar sets.

**Verificación**
- Smoke: alumno con plan activo ve CTA y crea sesión.

---

## 2) Sesiones (MVP Core)

### 2.1 “Repetir entrenamiento” (duplicar sesión)

**Objetivo**
- Permitir crear una nueva sesión a partir de un workout template o una sesión previa (copiando estructura).

**Alcance**
- Desde sesión completada: botón “Repetir”.
- Crea nueva sesión en `in_progress` con los mismos ejercicios planeados (sin sets).

**Pantallas / rutas**
- Alumno: detalle de sesión `/home/client/sessions/[sessionId]`.
- Alumno: detalle del workout (si existe).

**Datos**
- `WorkoutSession` + `WorkoutSessionExercise`.

**Lógica**
- Duplicar `WorkoutSessionExercise` conservando `sortOrder` y referencias a `workoutExerciseId`/`plannedExerciseId`.
- No copiar `WorkoutSet`.

**Criterios de aceptación**
- Sesión nueva arranca vacía de sets pero con mismos ejercicios.
- No rompe historial de la sesión original.

**Verificación**
- Smoke: completar sesión → repetir → registrar 1 set.

---

### 2.2 Timer de descanso por ejercicio/serie

**Objetivo**
- Mejorar adherencia: descanso rápido dentro de la sesión.

**Alcance**
- UI client-side simple (sin persistencia, o persistencia opcional).
- Botón “Iniciar descanso” por set o por ejercicio.

**Pantallas / rutas**
- Alumno: detalle sesión.

**Datos**
- No requiere DB.

**Lógica**
- Timer en el cliente con duración default (por ejemplo desde `restSeconds` si existe).

**Criterios de aceptación**
- El timer no bloquea registrar sets.

**Verificación**
- Smoke manual en sesión.

---

### 2.3 Autosave / resiliencia ante refresh

**Objetivo**
- Evitar pérdida de datos si el alumno recarga durante la sesión.

**Alcance**
- Cada creación de set ya persiste en DB (ideal).
- La UI debe rehidratar desde DB al abrir la sesión.

**Pantallas / rutas**
- Alumno: detalle sesión.

**Datos**
- Reusar tablas existentes.

**Lógica**
- Asegurar que el fetch inicial traiga sets y ejercicios ya creados.

**Criterios de aceptación**
- Refresh no pierde sets registrados.

---

## 3) Coach feedback loop (MVP Core)

### 3.1 Coach ve sesiones del alumno (timeline + detalle)

**Objetivo**
- El coach pueda revisar ejecución real (sets, RPE, notas) para iterar el plan.

**Alcance**
- Listado de sesiones por alumno (últimas N).
- Vista detalle de sesión.

**Pantallas / rutas**
- Coach: alumno `/home/coach/alumnos/[clientUserId]` (tab “Sesiones”).
- Coach: `/home/coach/alumnos/[clientUserId]/sessions/[sessionId]` (si se separa).

**Datos**
- `WorkoutSession` + joins a exercises + sets.

**Lógica**
- Permisos: coach sólo ve sesiones de sus alumnos.

**Criterios de aceptación**
- Coach puede abrir una sesión y ver ejercicios + sets.

---

### 3.2 Comentarios coach↔alumno por sesión (thread simple)

**Objetivo**
- Canalizar feedback contextual: “en la serie 3…” “ajustá técnica…”.

**Alcance**
- Thread por sesión: mensajes cortos (texto).
- Sin notificaciones al inicio.

**Pantallas / rutas**
- Alumno: detalle sesión.
- Coach: detalle sesión.

**Datos**
- Tabla `SessionComment` (si no existe) con:
  - `id`, `sessionId`, `authorUserId`, `text`, `createdAt`

**Lógica**
- Server action crear comentario.
- Render incremental (revalidar ruta).

**Criterios de aceptación**
- Ambos roles pueden escribir y ver comentarios.

---

### 3.3 Alertas básicas

**Objetivo**
- Detectar riesgo de abandono.

**Alcance**
- Indicador en dashboard coach:
  - “no entrenó en X días” (por ejemplo 7)
  - “tiene sesiones iniciadas sin completar” (in_progress viejas)

**Datos**
- Query a `WorkoutSession` por alumno.

**Criterios de aceptación**
- Lista simple, sin sistema de notificaciones todavía.

---

## 4) Biblioteca (calidad y escala)

### 4.1 Duplicar workout template (con ejercicios)

**Objetivo**
- Acelerar creación de entrenos similares.

**Alcance**
- Botón “Duplicar” en /home/coach/workouts/[workoutTemplateId]
- Copia workout + workoutExercises (incluye sortOrder, sets/reps/rest/notes).

**Datos**
- `WorkoutTemplate` + `WorkoutExercise`.

**Lógica**
- Transacción:
  - crear template
  - crear exercises en bulk

**Criterios de aceptación**
- La copia queda en la biblioteca del coach.

---

### 4.2 Carpeta/tags para workouts (mínimo viable)

**Objetivo**
- Ordenar la biblioteca cuando crezca.

**Alcance**
- Tag string (simple) o lista.
- Filtro por tag.

**Datos**
- Campo `tags` (string) o tabla de tags.

**Criterios de aceptación**
- Filtrar 1 tag y ver resultados consistentes.

---

### 4.3 Búsqueda y filtros (workouts)

**Objetivo**
- Encontrar rápido entrenos en biblioteca.

**Alcance**
- Search por título + filtro tipo (strength/hypertrophy/etc).

**Criterios de aceptación**
- Con 200+ workouts sigue siendo usable.

---

## 5) Ejercicios (calidad y escala)

### 5.1 Filtros por músculo/equipo + búsqueda

**Objetivo**
- Encontrar ejercicios rápido al armar entrenos.

**Alcance**
- En /home/coach/exercises: search input + selects.

**Datos**
- Reusar `primaryMuscle` y `equipment`.

**Criterios de aceptación**
- El listado responde rápido y no rompe thumbnails.

---

### 5.2 Merge/dedupe de ejercicios

**Objetivo**
- Reducir duplicados (“Bench press” vs “Press banca”).

**Alcance**
- Acción “Fusionar” (elige exercise A como destino, B como origen).
- Migrar referencias y borrar el origen si queda sin referencias.

**Datos**
- Actualizar referencias en:
  - `WorkoutExercise.exerciseId`
  - `WorkoutSessionExercise.performedExerciseId`
  - `WorkoutSessionExercise.plannedExerciseId`
  - alternativas, etc.

**Criterios de aceptación**
- No quedan foreign keys rotas.

---

### 5.3 Soporte de video link

**Objetivo**
- Mejorar ejecución técnica.

**Alcance**
- `ExerciseMedia` con `mediaType = video`.
- Render en detalle de ejercicio.

---

## 6) Progresión y métricas (mínimo útil)

### 6.1 PRs simples por ejercicio

**Objetivo**
- Motivar y medir progreso.

**Alcance**
- “Mejor peso x reps” o “mejor e1RM estimado” (simple).

**Datos**
- Derivar desde `WorkoutSet`.

**Criterios de aceptación**
- Vista por ejercicio o dashboard del alumno.

---

### 6.2 Sugerencia de carga (simple)

**Objetivo**
- Reducir fricción al entrenar.

**Alcance**
- Mostrar “última vez hiciste: 3x8 @ 40kg”.

**Datos**
- Último set por ejercicio.

---

## 7) Operación (para que sea “vendible”)

### 7.1 Onboarding con plantillas starter

**Objetivo**
- Coach puede arrancar en minutos.

**Alcance**
- 3–5 planes prearmados por objetivo.

**Datos**
- Seed o templates del sistema.

---

### 7.2 Invitación alumno / aceptar coach

**Objetivo**
- Alta simple de alumnos.

**Alcance**
- Link de invitación + aceptación.

---

### 7.3 Hardening de permisos

**Objetivo**
- Asegurar multi-tenant (coach A no ve data de coach B).

**Alcance**
- Revisar queries en rutas coach y client.

---

## QA recomendado por feature

Para cada feature terminada:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Smoke manual mínimo:
  - Coach: /home/coach/plans, /home/coach/alumnos, /home/coach/workouts, /home/coach/exercises
  - Alumno: /home/client/week, /home/client/sessions/[sessionId]

