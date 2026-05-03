# CLAUDE.md — Directrices del Proyecto TrainingChallengeRecomposition

> Este archivo se carga automáticamente en cada conversación. **Leerlo y cumplirlo antes de tocar cualquier línea de código.**

---

## 1. Arquitectura del monorepo

```
apps/api   → Next.js backend (puerto 3003). Prisma + PostgreSQL.
apps/web   → Next.js frontend (puerto 3001).
packages/types → Tipos TypeScript compartidos entre api y web.
```

Cualquier tipo que ambos proyectos necesiten va en `packages/types/index.ts`. **Nunca** definir tipos locales que ya están ahí o deberían estar.

---

## 2. Límites de tamaño de archivos (regla dura)

| Tipo de archivo | Límite | Acción si se supera |
|---|---|---|
| Page (`page.tsx`) | **400 líneas** | Extraer componentes a `_components/` |
| Componente (`*.tsx`) | **300 líneas** | Partir en sub-componentes |
| API route (`route.ts`) | **150 líneas** | Extraer helpers a `lib/` |
| Hook (`use-*.ts`) | **100 líneas** | Partir o componer hooks menores |

**Antes de agregar código a un archivo que ya está cerca del límite**, primero extraer — nunca crecer un archivo que ya está grande.

---

## 3. Estructura de archivos para features nuevas

Cuando una feature es lo suficientemente compleja para tener sub-componentes, usar la siguiente estructura:

```
app/(client)/mi-feature/
  page.tsx              ← solo orquestación: estado, fetch, composición (~150-300 líneas)
  _components/
    feature-card.tsx    ← componentes hijos
    feature-modal.tsx
  _hooks/
    use-feature-data.ts ← lógica de fetch y estado del dominio
```

Para API routes con helpers reutilizables, extraer a `apps/api/lib/`.

---

## 4. Constantes y datos compartidos del frontend

El archivo `apps/web/lib/constants.ts` es la fuente de verdad. **Nunca duplicar** en múltiples páginas:

```typescript
// Siempre importar de acá:
import { MUSCLE_LABEL, GROUP_COLORS, groupLabel, blockTypeLabel } from "@/lib/constants";
```

Si no existe la constante → agregarla al archivo. Si está duplicada en otro archivo → eliminarla del otro.

---

## 5. Manejo de errores — obligatorio

### Frontend

Todo `api.get/post/patch/put/del` **debe** tener manejo de error visible al usuario:

```typescript
// ✅ Correcto
try {
  const data = await api.get<T>("/endpoint");
  setState(data);
} catch {
  toast.error("No se pudo cargar X");
}

// ❌ Prohibido
const data = await api.get<T>("/endpoint").catch(() => {});
```

Excepciones aceptadas: datos secundarios/nice-to-have (ej. referencia "última vez") pueden fallar silenciosamente con `.catch(() => {})`.

### API (backend)

Todos los routes están envueltos en `withHandler()`. Dentro del handler:
- Usar `unauthorized()`, `forbidden()`, `notFound()`, `ok()`, `err()` de `@/lib/api-response`.
- **Nunca** lanzar excepciones sin capturar — `withHandler` las atrapa pero sin contexto útil.
- Validar inputs en la entrada, no en el medio del handler.

---

## 6. Estado en React — reglas

- **Máximo ~15 `useState` por componente**. Si se supera, agrupar estado relacionado en objetos o extraer a un hook `use-*.ts`.
- **No definir componentes dentro de otros componentes** (funciones que retornan JSX dentro del body del componente padre). Extraer siempre como función de primer nivel en el mismo archivo o en `_components/`.
- Para páginas con múltiples sub-secciones, preferir extraer hooks de datos: `const { data, loading, reload } = useFeatureData()`.

---

## 7. Estilos inline

- Los inline styles son aceptables para valores dinámicos (colores de fase, dimensiones calculadas).
- Para estilos repetidos (cards, secciones, badges), extraer a un objeto constante o componente.
- Las variables CSS del design system (`var(--bg)`, `var(--line)`, `var(--lime)`, etc.) son la fuente de verdad de colores. **Nunca hardcodear colores hex que ya existen como variables**.

---

## 8. Patrones API ya implementados — usar siempre

Estos helpers existen en `apps/api/lib/` y **deben usarse**:

| Helper | Uso |
|---|---|
| `requireRole(req, "client"\|"coach")` | Autenticación + autorización |
| `withHandler(async () => {...})` | Envuelve toda la lógica del handler con try/catch |
| `ok(data, statusCode?)` | Respuesta 200 exitosa |
| `err(message, statusCode)` | Error con código |
| `unauthorized(message)` | 401 |
| `forbidden()` | 403 |
| `notFound(message)` | 404 |
| `notify({userId, type, title, body, linkUrl})` | Notificación push |

---

## 9. Base de datos — Prisma

- **Nunca usar `$executeRaw` o `$queryRaw`** salvo que sea absolutamente necesario y no exista alternativa con el query builder de Prisma.
- Toda migración: `cd apps/api && npx prisma migrate dev --name descripcion_breve`.
- Después de cambiar el schema, correr `npx prisma generate` antes de usar los nuevos campos.
- Los índices importan: agregar `@@index` en campos que se usan en `WHERE` con datos de usuarios.

---

## 10. TypeScript

- **Cero errores de TypeScript** antes de commitear. Correr `npx tsc --noEmit` en `apps/web` y `apps/api`.
- Nunca usar `any` — usar `unknown` y hacer type guards, o extender `packages/types`.
- Los tipos de respuesta de API siempre deben existir en `packages/types/index.ts`.

---

## 11. Checklist antes de agregar una feature nueva

Antes de escribir la primera línea de código:

- [ ] ¿El archivo destino tiene menos de su límite de líneas? Si no → refactorizar primero.
- [ ] ¿Existe alguna constante/helper/tipo que necesito? Buscar antes de crear.
- [ ] ¿Necesita migration de BD? Planear schema antes de código.
- [ ] ¿Cómo va a manejar errores esta feature? Definirlo antes de implementar.

Después de escribir el código:

- [ ] `npx tsc --noEmit` pasa sin errores en ambos proyectos.
- [ ] No hay duplicación nueva (constantes, tipos, lógica).
- [ ] Los archivos modificados siguen dentro del límite de líneas.
- [ ] El manejo de errores es visible al usuario (toast o estado de error).

---

## 12. Backlog de refactor — NO agregar features hasta resolver 🔴

Ver el archivo `REFACTOR.md` en la raíz del repo para el listado completo y su estado.

**Los items 🔴 Críticos del backlog tienen prioridad sobre cualquier feature nueva.**

---

## 13. Contexto del proyecto

- **Stack**: Next.js 14 App Router, Prisma, PostgreSQL, TypeScript estricto.
- **Sin Tailwind** — sistema de diseño con CSS variables (`var(--bg)`, `var(--lime)`, `var(--line)`, etc.).
- **Sin Redux / Zustand** — estado local con useState/useReducer + Context donde sea necesario.
- **Sin React Query / SWR** — fetch manual con el helper `api` de `useAuth()`.
- **DB local**: PostgreSQL en Docker puerto 5434.
- **Idioma del código**: inglés para nombres de variables/funciones, español para UI y comentarios explicativos.
