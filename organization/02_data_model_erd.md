# ERD (modelo de datos) — propuesta concreta (PostgreSQL)

Este documento describe las entidades mínimas para MVP 1 (y extensiones para MVP 2).

## Convenciones
- `id`: UUID
- `created_at`, `updated_at`: timestamps
- Claves foráneas con `ON DELETE` según lógica (en MVP: preferir `RESTRICT` o soft-delete si aplica).

## Tablas (MVP 1)

### users
- id (uuid, pk)
- role (text, enum: `coach` | `client`)
- email (text, unique, not null)
- password_hash (text, not null) o proveedor auth (según implementación)
- display_name (text)
- created_at, updated_at

Índices:
- unique(email)

### coach_clients
Relación coach ↔ alumno (MVP: 1 coach por alumno).
- id (uuid, pk)
- coach_user_id (uuid, fk → users.id, not null)
- client_user_id (uuid, fk → users.id, not null, unique)
- status (text: active|inactive)
- created_at, updated_at

Índices:
- unique(client_user_id)
- index(coach_user_id)

### plans
Plan “plantilla” creado por el coach.
- id (uuid, pk)
- coach_user_id (uuid, fk → users.id, not null)
- title (text, not null)
- goal (text)
- notes (text)
- weeks_count (int, not null, default 4)
- status (text: draft|published|archived)
- created_at, updated_at

Índices:
- index(coach_user_id)

### plan_assignments
Asignación de plan a alumno.
- id (uuid, pk)
- plan_id (uuid, fk → plans.id, not null)
- client_user_id (uuid, fk → users.id, not null)
- start_date (date)
- status (text: active|paused|finished)
- created_at, updated_at

Índices:
- index(client_user_id, status)
- index(plan_id)

Regla MVP:
- Un alumno tiene a lo sumo 1 `plan_assignment` con status `active`.

### plan_weeks
- id (uuid, pk)
- plan_id (uuid, fk → plans.id, not null)
- week_number (int, not null) (1..N)
- title (text)
- notes (text)
- created_at, updated_at

Índices:
- unique(plan_id, week_number)

### workout_templates
Entrenamientos dentro de una semana del plan.
- id (uuid, pk)
- plan_week_id (uuid, fk → plan_weeks.id, not null)
- title (text, not null) (ej: “A - Full Body”)
- description (text)
- sort_order (int, not null, default 0)
- created_at, updated_at

Índices:
- index(plan_week_id)

### exercises
Catálogo reutilizable.
- id (uuid, pk)
- coach_user_id (uuid, fk → users.id, not null) (catálogo por coach; luego se puede globalizar)
- name (text, not null)
- primary_muscle (text)
- equipment (text)
- created_at, updated_at

Índices:
- unique(coach_user_id, name)
- index(coach_user_id)

### workout_exercises
Ejercicios dentro de un template, con objetivos/metodología.
- id (uuid, pk)
- workout_template_id (uuid, fk → workout_templates.id, not null)
- exercise_id (uuid, fk → exercises.id, not null)
- sort_order (int, not null, default 0)

- target_sets (int)
- target_reps (text) (ej: “8-10”)
- target_load_note (text) (ej: “subir si RPE<8”)
- intensity_type (text, enum: `rpe` | `rir` | `none`)
- intensity_target (numeric) (ej: 8 para RPE; 2 para RIR)
- rest_seconds (int)
- tempo (text) (ej: “3-1-1”)
- notes (text)

- created_at, updated_at

Índices:
- index(workout_template_id)
- index(exercise_id)

### workout_exercise_alternatives
Alternativas para un ejercicio de un template.
- id (uuid, pk)
- workout_exercise_id (uuid, fk → workout_exercises.id, not null)
- alternative_exercise_id (uuid, fk → exercises.id, not null)
- priority (int, not null, default 0)
- note (text)
- created_at, updated_at

Índices:
- unique(workout_exercise_id, alternative_exercise_id)
- index(workout_exercise_id, priority)

### workout_sessions
Instancia real de una sesión del alumno.
- id (uuid, pk)
- client_user_id (uuid, fk → users.id, not null)
- workout_template_id (uuid, fk → workout_templates.id) (nullable si sesión “libre”)
- performed_at (timestamptz, not null)
- status (text: in_progress|completed|discarded)
- energy_rating (int) (escala simple 1..5 o 1..10)
- session_notes (text)
- created_at, updated_at

Índices:
- index(client_user_id, performed_at desc)
- index(workout_template_id)

### workout_session_exercises
Snapshot del ejercicio ejecutado en la sesión (permite reemplazo por alternativa).
- id (uuid, pk)
- workout_session_id (uuid, fk → workout_sessions.id, not null)
- workout_exercise_id (uuid, fk → workout_exercises.id) (nullable; si fue “libre”)
- planned_exercise_id (uuid, fk → exercises.id) (nullable)
- performed_exercise_id (uuid, fk → exercises.id, not null)
- sort_order (int, not null, default 0)
- swap_reason (text) (ej: “máquina ocupada”)
- created_at, updated_at

Índices:
- index(workout_session_id)
- index(performed_exercise_id)

### workout_sets
Sets registrados.
- id (uuid, pk)
- workout_session_exercise_id (uuid, fk → workout_session_exercises.id, not null)
- set_number (int, not null)
- reps (int)
- weight (numeric)
- rpe (numeric)
- rir (numeric)
- notes (text)
- created_at, updated_at

Índices:
- unique(workout_session_exercise_id, set_number)

### body_metric_entries
Peso y medidas por fecha.
- id (uuid, pk)
- client_user_id (uuid, fk → users.id, not null)
- measured_at (date, not null)
- weight_kg (numeric)
- waist_cm (numeric)
- chest_cm (numeric)
- hips_cm (numeric)
- arm_cm (numeric)
- thigh_cm (numeric)
- notes (text)
- created_at, updated_at

Índices:
- index(client_user_id, measured_at desc)

## Extensiones (MVP 2)

### exercise_media
- id (uuid, pk)
- exercise_id (uuid, fk → exercises.id, not null)
- media_type (text: image|video)
- url (text, not null) o storage_key
- created_at, updated_at

### food_log_entries
- id (uuid, pk)
- client_user_id (uuid, fk → users.id, not null)
- logged_at (timestamptz, not null)
- text (text)
- photo_url (text) o storage_key
- created_at, updated_at

## Notas de diseño
- La separación `workout_session_exercises` permite:
  - Guardar el ejercicio realmente ejecutado.
  - Conservar referencia al ejercicio planificado (y a la fila del template) si existía.
- `target_reps` como texto evita complejidad temprana (rangos, pausas, dropsets).
