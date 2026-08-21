# ARCHITECTURE.md — Estructura Modular del Proyecto

> Este documento define la arquitectura modular. Mantener actualizado cuando se agregan módulos nuevos.

---

## Visión General

La app está organizada en **módulos de dominio** independientes. Cada módulo tiene:

- **Backend**: API routes, services, y models de Prisma relacionados
- **Frontend**: Pages, components, y hooks de ese dominio
- **Tipos**: Types compartidos en `packages/types/index.ts`

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (web)                          │
│  app/(client)/    │    app/coach/    │    components/shared/    │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (api)                           │
│  app/api/v1/      │    lib/          │    prisma/               │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                      SHARED (packages/types)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Módulos de Dominio

### 1. Training Module — Entrenamientos

**Responsabilidad**: Planificación, ejecución y registro de entrenamientos.

```
apps/api/
├── app/api/v1/
│   ├── training/
│   │   ├── plans/           # CRUD planes de entrenamiento
│   │   ├── workouts/        # CRUD workout templates
│   │   ├── blocks/          # Bloques (warmup, strength, intervals, cardio, cooldown)
│   │   ├── exercises/       # Catálogo de ejercicios
│   │   └── sessions/        # Sesiones ejecutadas + sets + comments
│   └── users/               # Gestión de clientes por coach
│       └── clients/
├── lib/training/
│   ├── plan.service.ts
│   ├── workout.service.ts
│   ├── session.service.ts
│   └── exercise.service.ts
└── prisma/
    └── models: Plan, PlanWeek, PlanWeekWorkout, PlanAssignment,
              WorkoutTemplate, WorkoutBlock, WorkoutExercise,
              WorkoutExerciseAlternative, WorkoutSession,
              WorkoutSessionExercise, WorkoutSet, SessionComment

apps/web/
├── app/
│   ├── coach/
│   │   ├── planes/
│   │   ├── workouts/
│   │   └── ejercicios/
│   └── (client)/
│       ├── semana/          # Vista semanal del plan
│       └── sesion/         # Sesión en ejecución
└── components/features/training/
    ├── workout-card.tsx
    ├── exercise-picker.tsx
    └── block-config.tsx
```

**Interfaces públicas** (`packages/types/index.ts`):
- `PlanSummary`, `PlanDetail`, `CreatePlanRequest`
- `WorkoutTemplateSummary`, `WorkoutTemplateDetail`
- `WorkoutBlockSummary`, `BlockType = "warmup"|"strength"|"intervals"|"cardio"|"cooldown"`
- `SessionDetail`, `SessionExercise`, `WorkoutSet`
- `ExerciseSummary`, `ExerciseTarget`

---

### 2. Health Module — Sync y Métricas de Salud

**Responsabilidad**: Sincronización de datos de wearables y métricas de salud diarias.

```
apps/api/
├── app/api/v1/
│   └── health/
│       ├── sync/            # OAuth callbacks, sync triggers
│       ├── providers/      # Garmin, Strava, Google Health (endpoints)
│       └── metrics/        # Daily health entries, goals
├── lib/health/
│   ├── types.ts             # HealthProvider interface
│   ├── registry.ts          # getProvider(), getAllProviders()
│   ├── sync-engine.ts       # Motor de sincronización
│   ├── normalizer.ts        # Merge de métricas por día
│   └── providers/
│       ├── garmin.ts        # Garmin Health API
│       ├── strava.ts        # Strava API
│       └── google-health.ts # Google Health / Fitbit API
└── prisma/
    └── models: HealthProviderConnection, HealthSyncedActivity,
              DailyHealthEntry, HealthGoal, BodyMetricEntry

apps/web/
├── app/
│   └── (client)/
│       ├── account/
│       │   ├── wearable/    # Conexiones de wearables
│       │   ├── metas/       # Metas de salud
│       │   └── mediciones/  # Mediciones corporales
│       └── panel/          # Dashboard con rings de actividad
└── components/features/health/
    ├── provider-card.tsx
    ├── sync-status.tsx
    ├── activity-ring.tsx
    └── goal-progress.tsx
```

**Patrón Provider**:
```typescript
// lib/health/types.ts
interface HealthProvider {
  id: HealthProviderId;
  getAuthUrl(): string;
  exchangeCode(code: string): Promise<ProviderTokens>;
  refreshToken(tokens: ProviderTokens): Promise<ProviderTokens>;
  fetchDailyMetrics(date: Date): Promise<NormalizedDailyMetrics>;
  getUserProfile(): Promise<ProviderUserProfile>;
}
```

**Interfaces públicas** (`packages/types/index.ts`):
- `HealthProviderId = "garmin" | "google_health" | "strava"`
- `NormalizedDailyMetrics` (steps, sleep, HR, etc.)
- `ProviderConnectionStatus`
- `HealthDashboardData`
- `HealthGoalItem`, `BodyMetricItem`

---

### 3. Messaging Module — Mensajería

**Responsabilidad**: Chat entre coach y cliente.

```
apps/api/
├── app/api/v1/
│   └── messaging/
│       ├── threads/         # Chat threads
│       └── messages/        # Mensajes con soporte SSE
├── lib/messaging/
│   └── chat.service.ts      # Texto + referencias (sin adjuntos de archivo)
└── prisma/
    └── models: ChatThread, ChatMessage

apps/web/
├── app/
│   ├── coach/
│   │   └── mensajes/        # Lista + chat individual
│   └── (client)/
│       └── mensajes/       # Chat con coach
└── components/features/messaging/
    ├── chat-thread.tsx
    ├── chat-message.tsx
    ├── message-input.tsx
    └── reference-modal.tsx
```

> Chat es **solo texto** (+ referencias a sesión/workout). Los adjuntos se removieron por no usarse.

**Interfaces públicas** (`packages/types/index.ts`):
- `ChatMessageItem`
- `ChatThreadSummary`

---

### 4. Notifications Module — Notificaciones

**Responsabilidad**: Notificaciones in-app y push.

```
apps/api/
├── app/api/v1/
│   ├── notifications/       # CRUD notificaciones
│   └── push/               # Suscripciones y test
├── lib/
│   ├── notify.ts           # Helper de creación (no-crash)
│   └── push-notifications.ts # web-push integration
└── prisma/
    └── models: Notification, PushSubscription

apps/web/
├── app/
│   └── (client)/
│       └── notificaciones/  # Lista + mark all read
└── lib/
    └── hooks/
        ├── use-notifications.ts
        └── use-push-notifications.ts
```

**Interfaces públicas** (`packages/types/index.ts`):
- `AppNotification`

---

### 5. Gym Module — Experimental / futuro

> **Estado**: código presente y usable en desarrollo, **no es el producto principal** hoy.
> Conservar para crecer después (clases grupales + modo televisor). No invertir features nuevas aquí hasta priorizarlo explícitamente.

**Responsabilidad**: clases de gym, modo tele (pantalla grande) y shell de admin gym.

```
apps/api/
├── app/api/v1/gym/
│   └── classes/                 # CRUD + tele state
└── prisma/
    └── models: GymClass, CoachGroup, CoachGroupMember

apps/web/
├── app/gym/                     # Shell gym (clases, settings, notificaciones)
├── app/tele/[classId]/           # TV público (sin controles locales)
└── components/features/gym/
    └── tele-class-screen.tsx    # UI compartida (controls on/off)
```

**Notas**:
- `/gym/tele/:id` = operador (timer + prev/next)
- `/tele/:id` = display público (sigue poll del coach)
- Documentado aquí para encontrarlo cuando retomemos el módulo

---

### 6. Users Module — Usuarios y Auth

**Responsabilidad**: Auth, perfiles, y relaciones coach-cliente.

```
apps/api/
├── app/api/v1/
│   ├── auth/                # Login, register, password reset
│   └── users/
│       └── clients/         # Gestión de alumnos
├── lib/
│   ├── api-auth.ts          # extractBearer, requireRole
│   └── jwt.ts              # Token handling
└── prisma/
    └── models: User, CoachClient

apps/web/
├── app/
│   ├── login/
│   ├── coach/
│   │   ├── alumnos/         # Lista + detalle de alumnos
│   │   └── settings/
│   └── (client)/
│       └── account/
│           └── perfil/     # Perfil del cliente
└── lib/
    ├── auth.tsx             # AuthContext + useAuth
    └── api.ts              # API client
```

**Interfaces públicas** (`packages/types/index.ts`):
- `AuthUser`, `UserRole`
- `LoginRequest`, `LoginResponse`, `RegisterRequest`
- `CoachClientSummary`

---

## Reglas de Arquitectura

### Frontend

1. **Pages**: Máximo 400 líneas. Si se excede → extraer a `_components/` y `_hooks/`
2. **Componentes**: Máximo 300 líneas. Si se excede → partir en sub-componentes
3. **Hooks**: Máximo 100 líneas. Si se excede → dividir o componer hooks menores
4. **Feature components**: Van en `components/features/<module-name>/`
5. **UI components**: Átomos genéricos van en `components/ui/`

### Backend

1. **API Routes**: Máximo 150 líneas. Si se excede → extraer a service en `lib/<module>/`
2. **Services**: La lógica de negocio vive en `lib/<module>/<name>.service.ts`
3. **Helpers compartidos**: `lib/api-response.ts`, `lib/api-auth.ts`, `lib/prisma.ts`
4. **Models Prisma**: Organizados por módulo en `prisma/schema.prisma` con comentarios

### Types

1. **Compartidos**: Tipos usados en frontend y backend van en `packages/types/index.ts`
2. **Locales**: Tipos específicos de un componente/hook van en el mismo archivo
3. **Nombres**: Usar sufijos para claridad (`Summary`, `Detail`, `Request`, `Response`)

---

## Patrones Comunes

### Agregar un nuevo provider de sync

1. Crear `lib/health/providers/<provider>.ts` implementando `HealthProvider`
2. Agregar en `lib/health/registry.ts` con `registerProvider()`
3. Agregar OAuth routes en `app/api/v1/health/providers/<provider>/`
4. Agregar botón en `apps/web/app/(client)/account/wearable/page.tsx`
5. Agregar tipos en `packages/types/index.ts` si es necesario

### Agregar nueva página

```
app/<section>/
├── page.tsx              ← orquestación (~150-300 líneas)
├── _components/
│   ├── component-a.tsx   ← molecules
│   └── component-b.tsx
└── _hooks/
    └── use-page-data.ts   ← fetch + estado (~100 líneas máx)
```

### Agregar servicio backend

```
lib/<module>/
├── types.ts              ← interfaces del módulo (si no van en shared)
├── <name>.service.ts     ← lógica de negocio
└── providers/
    └── <provider>.ts      ← implementaciones específicas
```

---

## Referencias

- `DESIGN.md` — Sistema de diseño y tokens CSS
- `AGENTS.md` — Guías para trabajo con agentes
- `CLAUDE.md` — Reglas de proyecto para humanos