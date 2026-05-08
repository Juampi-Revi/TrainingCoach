# AGENTS.md — Multi-Agent Guidelines

> Para trabajo paralelo entre agentes. **Leer CLAUDE.md completo primero.**

---

## Lo que todo agente DEBE hacer

### Antes de escribir código
- [ ] Verificar file size limits (ver abajo)
- [ ] Buscar helpers/constants existentes antes de crear nuevos
- [ ] Planificar manejo de errores
- [ ] Para BD: planificar schema primero, código después

### Después de escribir código
- [ ] `npx tsc --noEmit` pasa en ambos proyectos
- [ ] Archivos dentro del límite de líneas
- [ ] Sin duplicación de tipos/constantes/lógica

---

## Límites estrictos — NO exceder

| Tipo | Límite | Acción |
|---|---|---|
| Page | 400 líneas | Extraer a `_components/` |
| Componente | 300 líneas | Partir en sub-componentes |
| API route | 150 líneas | Extraer a `lib/` |
| Hook | 100 líneas | Dividir o componer |

**Si un archivo está cerca del límite → refactorizar primero, nunca agrandar.**

---

## Reglas duras

### TypeScript
- **Cero errores** `npx tsc --noEmit`
- **Nunca `any`** → usar `unknown` + type guards
- Tipos compartidos van en `packages/types/index.ts`

### Errores
- Todo `api.get/post/...` necesita `try/catch` con `toast.error`
- Backend: usar helpers de `@/lib/api-response` (`ok`, `err`, `unauthorized`, etc.)
- **Nunca** `await api.get(...).catch(() => {})`

### Estilos
- **Nunca hardcodear colores hex** → usar CSS variables (`var(--lime)`, etc.)
- **Nunca Tailwind** — sistema de diseño con variables CSS
- **Sempre respetar DESIGN.md** — tokens, spacing, radius, sombras

---

## Estructura nueva feature

```
app/(client)/mi-feature/
├── page.tsx              ← orquestación (~150-300 líneas)
├── _components/
│   ├── feature-card.tsx
│   └── feature-modal.tsx
└── _hooks/
    └── use-feature-data.ts
```

---

## Constantes compartidas

**Un solo lugar:** `apps/web/lib/constants.ts`

Importar de ahí, nunca duplicar.

---

## Helpers de API ya disponibles

| Helper | Ubicación |
|---|---|
| `withHandler` | Envuelve handlers con try/catch |
| `ok/err/unauthorized/forbidden/notFound` | Respuestas API |
| `requireRole(req, "client"\|"coach")` | Auth |
| `notify({userId, type, title, body, linkUrl})` | Notificaciones push |

**Usar siempre estos, no reinventar.**

---

## 🚫 Prohibido

- Componentes definidos dentro de otros componentes
- Más de ~15 `useState` en un componente → agrupar en objeto o extraer hook
- `$executeRaw` / `$queryRaw` salvo caso extremo sin alternativa
- Tipos definidos en archivos locales cuando ya existen en `packages/types`
- Archivos .env en commits
- **NUNCA hacer `git add`, `git commit` o `git push` sin autorización explícita del usuario**

---

## Comandos esenciales

```bash
# TypeScript
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
2. **Refactor primero**: items 🔴 en `REFACTOR.md` tienen prioridad sobre features nuevas
3. **No romper tests**: verificar que todo pasa antes de commit
4. **Types en ambos lados**: si la API devuelve algo, el tipo debe estar en `packages/types/index.ts`

---

## Contexto rápido

- Stack: Next.js 14 App Router, Prisma, PostgreSQL, TypeScript estricto
- Sin Tailwind, sin Redux/Zustand, sin React Query/SWR
- BD local: PostgreSQL en Docker puerto 5434
- Idioma: variables/funciones en inglés, UI en español