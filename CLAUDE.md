# CLAUDE.md — Reglas del Proyecto

> Leer completo antes de escribir código. Estas reglas son la ley.

---

## Estructura DDD

```
Backend (apps/api/):
├── app/api/v1/<module>/<resource>/route.ts    # Rutas
└── lib/<module>/<name>.service.ts           # Lógica de negocio

Frontend (apps/web/):
├── app/<section>/<feature>/
│   ├── page.tsx                              # Orquestación
│   ├── _components/*.tsx                     # Componentes
│   ├── _hooks/use-*.ts                       # Datos
│   └── _styles.css                           # Estilos
└── components/shared/                        # Componentes reutilizables

Shared (packages/types/):
└── index.ts                                  # Tipos usados en ambos lados
```

---

## Límites (REGLA DURA)

| Tipo | Límite |
|------|--------|
| Page | 400 líneas |
| Componente | 300 líneas |
| Route | 150 líneas |
| Hook | 100 líneas |

**Si se acerca al límite → refactorizar primero.**

---

## Backend

### Route Pattern

```typescript
// 1. Imports
import { withHandler } from "@/lib/api-response";
import { requireRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// 2. Handler
async function handler(req: Request): Promise<Response> {
  const auth = requireRole(req, "coach" | "client");
  if (!auth.ok) return auth;

  const body = await req.json().catch(() => ({}));
  const data = await prisma.resource.findMany({ where: { userId: auth.user.id } });
  
  return ok(data);
}

export const GET = withHandler(handler);
```

### Service Pattern

```typescript
// lib/<module>/<name>.service.ts
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function createEntity(userId: string, data: EntityInput) {
  // Validaciones early return
  if (!data.title?.trim()) return { error: "Título requerido" };

  const entity = await prisma.entity.create({
    data: { userId, title: data.title.trim() },
  });

  // Side effects
  notify({ userId, type: "entity_created", title: "Creado", body: entity.title });

  return entity;
}
```

### Helpers de API (USAR SIEMPRE)

```typescript
ok(data)                    // 200
ok(data, 201)              // Created
err("msg", 400)            // Bad request
unauthorized("msg")         // 401
forbidden()                 // 403
notFound("msg")            // 404
```

### Prisma Rules

```prisma
// Índices en campos filtrados
@@index([clientUserId, performedAt])

// Transacciones para operaciones múltiples
await prisma.$transaction([/* operations */])

// ❌ PROHIBIDO: $executeRaw sin documentación
```

---

## Frontend

### Page Pattern

```typescript
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui";
import { ComponentA } from "./_components";

export default function FeaturePage() {
  const { api } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const { data, refetch } = useFeatureData();

  const handleAction = useCallback(async () => {
    try {
      setLoading(true);
      await api.post("/endpoint", {});
      toast.success("Éxito");
      await refetch();
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  }, [api, refetch]);

  return <div className="feature-page">...</div>;
}
```

### Hook Pattern

```typescript
// _hooks/use-*.ts
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";

export function useFeatureData() {
  const { api } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get<T>("/endpoint");
      setData(res);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [api]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}
```

### Component Pattern

```typescript
interface Props {
  title: string;
  variant?: "primary" | "secondary";
  onAction?: () => void;
}

export function MyComponent({ title, variant = "primary", onAction }: Props) {
  return (
    <div className="my-component">
      <span>{title}</span>
      <button onClick={onAction}>{variant}</button>
    </div>
  );
}
```

### Error Handling (OBLIGATORIO)

```typescript
// ✅ Correcto
try {
  const data = await api.get<T>("/endpoint");
  setState(data);
} catch {
  toast.error("No se pudo cargar");
}

// ❌ Prohibido
api.get("/endpoint").catch(() => {});
```

### State Rules

- Máximo ~15 `useState` por componente
- No definir componentes dentro de componentes
- Estado relacionado → objeto o hook dedicado

---

## CSS

```css
/* Usar variables CSS SIEMPRE */
color: var(--lime);
background: var(--bg-1);
border-radius: var(--r-md);
padding: var(--s-4);

/* ❌ PROHIBIDO: hex hardcoded, Tailwind */
```

### Responsive

```css
@media (min-width: 768px) {
  .feature-page { padding: 48px 28px; }
}
```

---

## TypeScript

```typescript
// ❌ any → unknown + type guard
catch (e: unknown) {
  if (e instanceof Error) toast.error(e.message);
}

// ✅ Generics claros
const data = await api.get<ClientDashboard>("/endpoint");

// ✅ Sufijos descriptivos
type SessionSummary, SessionDetail, CreateSessionRequest
```

---

## Migraciones Prisma

```bash
# 1. Editar schema.prisma
# 2. Migrar
cd apps/api && npx prisma migrate dev --name descripcion

# 3. Regenerar cliente
npx prisma generate

# 4. Verificar
cd ../web && npx tsc --noEmit
```

---

## Checklist Antes de Commit

- [ ] `npx tsc --noEmit` pasa en ambos proyectos
- [ ] Archivos dentro del límite de líneas
- [ ] Manejo de errores visible (toast)
- [ ] CSS usa variables (no hex, no Tailwind)
- [ ] No `any`留下来
- [ ] No `$executeRaw`

---

## Código Prohibido

- ❌ `any`
- ❌ `$executeRaw` / `$queryRaw` (salvo caso extremo documentado)
- ❌ Componentes dentro de componentes
- ❌ Tailwind
- ❌ Redux / Zustand / React Query / SWR
- ❌ Hex hardcoded en CSS

---

## Referencias

- `ARCHITECTURE.md` — Estructura modular
- `DESIGN.md` — Tokens CSS
- `docs/architecture-diagram.md` — Diagrama visual
- `docs/feature-roadmap.md` — Ideas para crecer