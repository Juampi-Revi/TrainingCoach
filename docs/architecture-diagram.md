# Arquitectura del Sistema — Diagrama Visual

> Este documento muestra cómo está estructurado el sistema actualmente y cómo puede expandirse.

---

## Vista General del Monorepo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRAINING CHALLENGE APP                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐         ┌─────────────────┐    ┌─────────────────┐   │
│  │   apps/web      │         │   apps/api      │    │ packages/types  │   │
│  │   (Frontend)    │  ──→    │   (Backend)    │  ← │  (Compartido)  │   │
│  │   Puerto 3001   │  HTTP   │   Puerto 3003   │     │                 │   │
│  └─────────────────┘         └─────────────────┘    └─────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquitectura Frontend (apps/web)

```
apps/web/
│
├── app/
│   │
│   ├── (client)/                    # Grupo de rutas para alumnos
│   │   ├── panel/                   # Dashboard con métricas
│   │   │   ├── _components/        # ScoreHeader, WeekHeatmap, etc
│   │   │   └── _hooks/             # use-panel-data
│   │   ├── semana/                 # Vista semanal del plan
│   │   ├── sesion/                # Sesión en ejecución
│   │   │   ├── _components/        # Block runners, logger, media viewer
│   │   │   └── _runners/           # TabataRunner, EmomRunner, AmrapRunner
│   │   ├── mensajes/               # Chat con coach
│   │   │   ├── _components/        # ChatMessage, ChatInput, RefPicker
│   │   │   └── _hooks/            # use-chat
│   │   ├── cuenta/                 # Cuenta del usuario
│   │   │   ├── wearable/          # Conexión de wearables
│   │   │   │   ├── _components/   # ProviderCard, GarminModal
│   │   │   │   └── _hooks/       # use-wearable-connection
│   │   │   ├── metas/
│   │   │   ├── mediciones/
│   │   │   └── perfil/
│   │   └── historial/              # Historial de sesiones
│   │
│   ├── coach/                      # Grupo de rutas para coaches
│   │   ├── alumnos/               # Lista de alumnos
│   │   │   └── _components/       # AddClientModal, ClientTabs
│   │   ├── planes/               # CRUD de planes
│   │   ├── workouts/             # Editor de workouts
│   │   │   └── _components/       # ExerciseRow, BlockModal
│   │   ├── ejercicios/            # Biblioteca de ejercicios
│   │   └── mensajes/            # Chat con alumnos
│   │
│   └── login/                    # Rutas públicas
│
├── components/
│   ├── ui/                        # Átomos (primitivos)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   ├── tabs.tsx
│   │   ├── table.tsx
│   │   └── icon.tsx
│   │
│   ├── layout/                    # Componentes de layout
│   │   ├── mobile-tab-bar.tsx
│   │   ├── coach-bottom-nav.tsx
│   │   └── desktop-shell.tsx
│   │
│   └── shared/                    # Componentes compartidos
│       ├── modal/
│       │   └── modal.tsx          # Modal genérico con children
│       └── toast/
│           └── toast.tsx          # Toast component
│
└── lib/
    ├── constants.ts               # Constantes de negocio
    ├── api.ts                    # Cliente API
    ├── auth.tsx                  # Auth context + useAuth
    ├── toast.tsx                 # ToastProvider + useToast
    ├── theme.tsx                 # Dark/light mode
    │
    └── features/                 # Constantes por módulo
        └── training/
            └── constants.ts       # Re-export de constantes de training
```

---

## Arquitectura Backend (apps/api)

```
apps/api/
│
├── app/
│   └── api/v1/
│       │
│       ├── auth/                  # Autenticación
│       │   ├── login/
│       │   ├── register/
│       │   ├── me/
│       │   ├── forgot-password/
│       │   └── reset-password/
│       │
│       ├── client/               # Rutas del alumno
│       │   ├── dashboard/
│       │   ├── today/
│       │   ├── sessions/
│       │   │   └── [sessionId]/
│       │   │       └── exercises/
│       │   │           └── [wseId]/
│       │   │               └── sets/
│       │   ├── sync/             # Health sync
│       │   │   ├── garmin/
│       │   │   ├── google-health/
│       │   │   └── strava/
│       │   ├── chat/
│       │   ├── health/
│       │   ├── goals/
│       │   └── food/
│       │
│       ├── coach/                 # Rutas del coach
│       │   ├── clients/
│       │   ├── plans/
│       │   ├── workouts/
│       │   └── chat/
│       │
│       ├── notifications/         # Notificaciones
│       ├── push/                 # Push subscriptions
│       └── sessions/             # Comentarios compartidos
│
└── lib/
    │
    ├── training/                  # Servicios de entrenamiento
    │   ├── ownership.service.ts  # Verificaciones de propiedad
    │   ├── plan.service.ts      # CRUD de planes
    │   ├── workout-template.service.ts  # CRUD de workouts
    │   └── session.service.ts   # Sesiones de cliente
    │
    ├── health/                   # Servicios de salud
    │   ├── types.ts              # HealthProvider interface
    │   ├── registry.ts          # Registro de providers
    │   ├── sync-engine.ts       # Motor de sync
    │   ├── normalizer.ts        # Merge de métricas
    │   └── providers/
    │       ├── garmin.ts
    │       ├── strava.ts
    │       └── google-health.ts
    │
    ├── messaging/                # Servicios de mensajería
    │   └── chat.service.ts      # Threads y mensajes
    │
    ├── api-response.ts          # ok(), err(), unauthorized()
    ├── api-auth.ts              # requireRole(), extractBearer()
    ├── jwt.ts                   # Token handling
    ├── prisma.ts                # Prisma client singleton
    ├── notify.ts                # Notificaciones DB
    ├── push-notifications.ts     # Web push
    ├── email.ts                 # Emails (Resend)
    └── cloudinary.ts            # Upload de media
```

---

## Modelo de Datos (Prisma)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MODELOS PRINCIPALES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐         ┌─────────────┐         ┌─────────────┐              │
│  │   User  │────────▶│ CoachClient │◀────────│    User     │              │
│  │ (coach) │         │ (relación) │         │  (client)   │              │
│  └─────────┘         └─────────────┘         └─────────────┘              │
│       │                    │                      │                         │
│       │                    │                      │                         │
│       ▼                    ▼                      ▼                         │
│  ┌─────────┐         ┌─────────┐         ┌─────────────┐                 │
│  │  Plan   │────────▶│PlanAssgn│◀────────│ChatThread   │                 │
│  └─────────┘         └─────────┘         └─────────────┘                 │
│       │                                      │                             │
│       ▼                                      ▼                             │
│  ┌─────────┐                         ┌────────────┐                       │
│  │PlanWeek │                         │ChatMessage │                       │
│  └─────────┘                         └────────────┘                       │
│       │                                                               │
│       ▼                                                               │
│  ┌─────────────────┐                                                   │
│  │PlanWeekWorkout  │                                                   │
│  └────────┬────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                           │
│  │WorkoutTemplate  │────▶│  WorkoutBlock   │                           │
│  └────────┬────────┘     └────────┬────────┘                           │
│           │                        │                                      │
│           ▼                        ▼                                      │
│  ┌─────────────────┐     ┌─────────────────┐                             │
│  │WorkoutExercise  │────▶│   Exercise      │                             │
│  └────────┬────────┘     └─────────────────┘                             │
│           │                                                            │
│           ▼                                                            │
│  ┌─────────────────┐     ┌─────────────────┐                           │
│  │WorkoutSession   │────▶│WorkoutSet       │                           │
│  └────────┬────────┘     └─────────────────┘                            │
│           │                                                            │
│           ▼                                                            │
│  ┌─────────────────┐                                                   │
│  │SessionComment   │                                                   │
│  └─────────────────┘                                                   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            MODELOS DE SALUD                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────┐                                              │
│  │HealthProviderConnection  │  ──→  Garmin, Strava, Google Health           │
│  └────────────┬────────────┘                                              │
│               │                                                           │
│               ▼                                                           │
│  ┌─────────────────────────┐                                              │
│  │ HealthSyncedActivity   │  (datos normalizados por día)                │
│  └─────────────────────────┘                                              │
│                                                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ DailyHealthEntry│  │  HealthGoal     │  │BodyMetricEntry │            │
│  │ (pasos,sueño)  │  │ (metas)         │  │(peso,medidas)  │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos - Training

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE CREACIÓN DE PLAN                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  COACH                           API                           CLIENT       │
│  ─────                          ───                           ──────       │
│                                                                             │
│  1. Crea Plan ──────────────▶ plan.service.ts ────────────                │
│                                      │                                     │
│  2. Crea Workouts ──────────▶ workout-template.service.ts                │
│                                      │                                     │
│  3. Agrega Blocks ───────────▶ WorkoutBlock.create()                    │
│                                      │                                     │
│  4. Agrega Exercises ────────▶ WorkoutExercise.create()                    │
│                                      │                                     │
│  5. Asigna a Semana ────────▶ PlanWeekWorkout.create()                    │
│                                      │                                     │
│  6. Asigna a Cliente ───────▶ PlanAssignment.create()                      │
│                                      │                                     │
│                                    ◀── notify() ────▶  Notificación        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO DE SESIÓN DE ENTRENO                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLIENT                          API                            COACH        │
│  ──────                          ───                            ──────       │
│                                                                             │
│  1. Ve Semana ───────────────▶ /client/today                             │
│                                      │                                     │
│  2. Inicia Sesión ───────────▶ session.service.ts                         │
│                                      │                                     │
│  3. Registra Sets ───────────▶ upsertSet()                                │
│                                      │                                     │
│  4. Completa Sesión ────────▶ updateSessionStatus()                        │
│                                      │                                     │
│                                    ◀── notify() ────▶  "Sesión completada"│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sistema de Sync de Wearables

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE SINCRONIZACIÓN                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌───────────────────┐     ┌───────────────────┐   │
│  │    Garmin    │     │    Google Health  │     │      Strava       │   │
│  │  (Connect)   │     │     (Fitbit)      │     │    (Athletes)    │   │
│  └──────┬───────┘     └─────────┬─────────┘     └─────────┬─────────┘   │
│         │                         │                           │              │
│         │    OAuth / Login       │                           │              │
│         └────────────┬──────────┴───────────────────────────┘              │
│                      │                                                        │
│                      ▼                                                        │
│          ┌───────────────────────┐                                          │
│          │HealthProviderConnection│  (tokens, estado, última sync)         │
│          └────────────┬──────────┘                                        │
│                       │                                                      │
│                       ▼                                                      │
│          ┌───────────────────────┐                                          │
│          │  sync-engine.ts      │  (motor de sincronización)                │
│          └────────────┬──────────┘                                        │
│                       │                                                      │
│                       ▼                                                      │
│          ┌───────────────────────┐                                          │
│          │ normalizer.ts        │  (merge de métricas por día)               │
│          └────────────┬──────────┘                                        │
│                       │                                                      │
│                       ▼                                                      │
│          ┌───────────────────────┐                                          │
│          │HealthSyncedActivity │  (pasos, sueño, HR, actividades)         │
│          └───────────────────────┘                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Cómo Expandir el Sistema

### 1. Nuevos Tipos de Usuario

```
CURRENT:                    FUTURO:
────────                   ──────
User (coach)               User (coach)
User (client)              User (athlete) ── Sin coach, rutinas propias
                           User (gym_member) ── Gimnasio grupal
                           User (gym_admin) ── Admin del gimnasio
```

**Cambios necesarios:**
- Agregar campo `userType` en User
- Agregar `BusinessType` para organizarlo
- Nuevas rutas y permisos

### 2. Nuevos Módulos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MÓDULOS FUTUROS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │  Analytics   │  │  Gamification │  │  Nutrition    │                │
│  │              │  │               │  │               │                │
│  │ • Charts     │  │ • Badges      │  │ • Meal plans  │                │
│  │ • Trends     │  │ • Leaderboard │  │ • Calories    │                │
│  │ • Predictions│  │ • Challenges  │  │ • Macros      │                │
│  │ • Reports     │  │ • Streaks     │  │ • Integrations│                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │   Admin       │  │  Group Train │  │   Calendar    │                │
│  │               │  │               │  │               │                │
│  │ • Dashboard    │  │ • TV Mode    │  │ • Scheduling  │                │
│  │ • Billing      │  │ • Self-run   │  │ • Bookings    │                │
│  │ • Users        │  │ • Classes     │  │ • Recurring   │                │
│  │ • Settings     │  │ • Events      │  │ • Conflicts   │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Nuevos Providers de Sync

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROVIDERS DE SYNC ACTUALES                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Garmin ──▶ Google Health ──▶ Strava                                      │
│     │            │              │                                           │
│     │            │              │                                           │
│     ▼            ▼              ▼                                           │
│  ┌─────────────────────────────────────┐                                   │
│  │     HealthProvider Interface         │                                   │
│  │  • getAuthUrl()                     │                                   │
│  │  • exchangeCode()                  │                                   │
│  │  • refreshToken()                  │                                   │
│  │  • fetchDailyMetrics()             │                                   │
│  └─────────────────────────────────────┘                                   │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                         │
│         ▼                    ▼                    ▼                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   Polar      │    │   Whoop     │    │   Apple      │                 │
│  │   (futuro)   │    │   (futuro)  │    │   Health     │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Arquitectura de Frontend Expandida

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND — ESTRUCTURA FUTURA                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  app/                                                                      │
│  │                                                                          │
│  ├── (client)/                                                             │
│  │   ├── panel/                                                           │
│  │   ├── semana/                                                          │
│  │   ├── sesion/                                                          │
│  │   ├── cuenta/                                                          │
│  │   ├── progreso/        ←── NUEVO: analytics tabs                      │
│  │   │   ├── _components/                                                    │
│  │   │   │   ├── charts/                                                   │
│  │   │   │   ├── trends/                                                    │
│  │   │   │   └── predictions/                                              │
│  │   │   └── _hooks/                                                       │
│  │   ├── self-training/  ←── NUEVO: para athletes sin coach              │
│  │   │   ├── routines/                                                     │
│  │   │   ├── library/                                                       │
│  │   │   └── create/                                                       │
│  │   └── mensajes/                                                         │
│  │                                                                          │
│  ├── coach/                                                                │
│  │   ├── alumnos/                                                         │
│  │   ├── planes/                                                          │
│  │   ├── workouts/                                                         │
│  │   ├── analytics/      ←── NUEVO: dashboard del coach                  │
│  │   │   ├── overview/                                                    │
│  │   │   ├── clients/                                                      │
│  │   │   └── trends/                                                      │
│  │   └── settings/                                                         │
│  │                                                                          │
│  ├── gym/              ←── NUEVO: modo gimnasio                            │
│  │   ├── dashboard/                                                         │
│  │   ├── tv-mode/      ←── Pantalla para TV                               │
│  │   ├── classes/                                                           │
│  │   └── members/                                                          │
│  │                                                                          │
│  └── shared/           ←── Componentes compartidos                          │
│      ├── modals/                                                            │
│      ├── charts/       ←── NUEVO: librería de charts                        │
│      └── layouts/                                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Expansión

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHECKLIST PARA NUEVO MÓDULO                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  □ 1. Definir el dominio en ARCHITECTURE.md                                │
│  □ 2. Crear carpeta lib/<module>/ en api/                                 │
│  □ 3. Crear servicio(s) en lib/<module>/                                  │
│  □ 4. Crear rutas en app/api/v1/<module>/                                  │
│  □ 5. Agregar tipos en packages/types/index.ts                              │
│  □ 6. Crear página(s) en app/                                             │
│  □ 7. Crear componentes en components/features/<module>/                    │
│  □ 8. Crear hooks en _hooks/                                               │
│  □ 9. Agregar constantes en lib/constants.ts                               │
│  □ 10. Verificar npx tsc --noEmit pasa                                    │
│  □ 11. Actualizar ARCHITECTURE.md                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```
