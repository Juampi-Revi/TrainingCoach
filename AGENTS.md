# AGENTS.md — Multi-Agent Guidelines

> Para trabajo paralelo entre agentes. **Leer CLAUDE.md completo primero.**

---

## Lo que todo agente DEBE hacer

### Antes de escribir código
- [ ] Leer ARCHITECTURE.md para entender la estructura de módulos
- [ ] Verificar file size limits (ver abajo)
- [ ] Buscar helpers/constants existentes antes de crear nuevos
- [ ] Planificar manejo de errores
- [ ] Para BD: planificar schema primero, código después

### Después de escribir código
- [ ] `npx tsc --noEmit` pasa en ambos proyectos
- [ ] Archivos dentro del límite de líneas
- [ ] Sin duplicación de tipos/constantes/lógica

---

## Estructura de Módulos (ver ARCHITECTURE.md)

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (apps/web)                                             │
├─────────────────────────────────────────────────────────────────┤
│ app/(client)/     │  app/coach/     │  components/              │
│ - panel/         │  - alumnos/     │  - ui/ (átomos)            │
│ - semana/        │  - planes/      │  - features/               │
│ - sesion/        │  - workouts/    │    └─ <module>/            │
│ - account/       │  - mensajes/    │  - layout/                 │
│ - mensajes/      │  - settings/    │                           │
├─────────────────────────────────────────────────────────────────┤
│ BACKEND (apps/api)                                             │
├─────────────────────────────────────────────────────────────────┤
│ app/api/v1/       │  lib/            │  prisma/                   │
│ - auth/           │  - api-response │  - schema.prisma           │
│ - training/       │  - api-auth     │                           │
│   └─ plans/       │  - prisma       │                           │
│   └─ workouts/    │  - training/    │                           │
│   └─ sessions/    │  - health/      │                           │
│ - health/         │    └─ providers │                           │
│   └─ sync/        │  - messaging/   │                           │
│   └─ providers/   │  - notify       │                           │
│ - messaging/     │                 │                           │
│ - notifications/  │                 │                           │
└─────────────────────────────────────────────────────────────────┘
```

### Módulos de Dominio

| Módulo | Backend | Frontend |
|--------|---------|----------|
| **Training** | `lib/training/*.service.ts`, routes en `training/` | `sesion/`, `semana/`, `coach/workouts/`, `coach/planes/` |
| **Health** | `lib/health/`, providers en `health/providers/` | `panel/`, `account/wearable/`, `account/metas/` |
| **Messaging** | `lib/messaging/chat.service.ts`, routes en `messaging/` | `mensajes/`, `coach/mensajes/` |
| **Notifications** | `lib/notify.ts`, `lib/push-notifications.ts` | `notificaciones/` |
| **Users** | `lib/api-auth.ts`, `lib/jwt.ts` | `login/`, `account/perfil/`, `coach/alumnos/` |

---

## Límites estrictos — NO exceder

| Tipo | Límite | Acción |
|---|---|---|
| Page (`page.tsx`) | 400 líneas | Extraer a `_components/` + `_hooks/` |
| Componente (`*.tsx`) | 300 líneas | Partir en sub-componentes |
| API route (`route.ts`) | 150 líneas | Extraer a `lib/<module>/` |
| Hook (`use-*.ts`) | 100 líneas | Dividir o componer |

**Si un archivo está cerca del límite → refactorizar primero, nunca agrandar.**

---

## Reglas duras

### TypeScript
- **Cero errores** `npx tsc --noEmit`
- **Nunca `any`** → usar `unknown` + type guards
- Tipos compartidos van en `packages/types/index.ts`
- Usar sufijos `Summary`, `Detail`, `Request`, `Response` para claridad

### Errores
- Todo `api.get/post/...` necesita `try/catch` con `toast.error`
- Backend: usar helpers de `@/lib/api-response` (`ok`, `err`, `unauthorized`, etc.)
- **Nunca** `await api.get(...).catch(() => {})`

### Estilos
- **Nunca hardcodear colores hex** → usar CSS variables (`var(--lime)`, etc.)
- **Nunca Tailwind** — sistema de diseño con variables CSS
- **Siempre respetar DESIGN.md** — tokens, spacing, radius, sombras

---

## Estructura nueva feature

```
app/(client)/mi-feature/
├── page.tsx              ← orquestación (~150-300 líneas)
├── _components/
│   ├── feature-card.tsx  ← molecules/organisms
│   └── feature-modal.tsx
└── _hooks/
    └── use-feature-data.ts ← lógica de fetch (~100 líneas máx)
```

Para backend (services):
```
lib/<module>/
├── types.ts              ← interfaces del módulo
├── <name>.service.ts     ← lógica de negocio
└── providers/
    └── <provider>.ts     ← implementaciones específicas
```

---

## Constantes y helpers compartidos

| Recurso | Ubicación | Regla |
|---------|-----------|-------|
| Constantes de negocio | `apps/web/lib/constants.ts` | Importar de ahí, nunca duplicar |
| Tipos compartidos | `packages/types/index.ts` | Tipos usados en ambos lados van aquí |
| Helpers API | `@/lib/api-response` | `ok`, `err`, `unauthorized`, `forbidden`, `notFound` |
| Auth helpers | `@/lib/api-auth` | `requireRole(req, "coach"\|"client")` |
| Notificaciones | `@/lib/notify` | `notify({userId, type, title, body, linkUrl})` |

---

## 🚫 Prohibido

- Componentes definidos dentro de otros componentes
- Más de ~15 `useState` en un componente → agrupar en objeto o extraer hook
- `$executeRaw` / `$queryRaw` salvo caso extremo sin alternativa
- Tipos definidos en archivos locales cuando ya existen en `packages/types`
- Archivos .env en commits
- **NUNCA hacer `git add`, `git commit` o `git push` sin autorización explícita**

---

## Comandos esenciales

```bash
# TypeScript check
cd apps/web && npx tsc --noEmit
cd apps/api && npx tsc --noEmit

# Migraciones Prisma
cd apps/api && npx prisma migrate dev --name descripcion
cd apps/api && npx prisma generate

# Desarrollo
cd apps/web && npm run dev      # puerto 3001
cd apps/api && npm run dev      # puerto 3003
```

---

## Warnings comunes entre agentes

1. **Conflictos**: hacer `git pull` antes de empezar tarea grande
2. **Módulo correcto**: buscar si la feature pertenece a un módulo existente
3. **No romper tests**: verificar que todo pasa antes de commit
4. **Types en ambos lados**: si la API devuelve algo, el tipo debe estar en `packages/types/index.ts`

---

## Contexto rápido

- **Stack**: Next.js 14 App Router, Prisma, PostgreSQL, TypeScript estricto
- **Sin Tailwind**, sin Redux/Zustand, sin React Query/SWR
- **BD local**: PostgreSQL en Docker puerto 5434
- **Idioma**: variables/funciones en inglés, UI en español
- **Docs**: ARCHITECTURE.md (estructura), DESIGN.md (estilos), CLAUDE.md (reglas)