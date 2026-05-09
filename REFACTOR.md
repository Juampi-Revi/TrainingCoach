# REFACTOR.md — Backlog de deuda técnica

> Actualizar este archivo cuando se completa un item o se descubre uno nuevo.
> Los items 🔴 bloquean features nuevas. Los 🟡 son importantes pero no bloqueantes.

---

## 🔴 Crítico — resolver antes de la próxima feature

N/A — Los items críticos han sido resueltos.

---

## 🟡 Importante — resolver antes de escalar

### RF-03 — Servicios en backend (lógica de negocio en routes)

**Problema**: Toda la lógica estaba en `route.ts`. Difícil de testear, lógica duplicada.

**Acciones completadas**:
1. ✅ Creado `lib/training/`:
   - `ownership.service.ts` → verificaciones de propiedad
   - `plan.service.ts` → crearPlan, actualizarPlan, asignarWorkout
   - `workout-template.service.ts` → crearWorkout, agregarBloque, agregarEjercicio
   - `session.service.ts` → iniciarSesion, registrarSet, completarSesion

2. ✅ Creado `lib/messaging/`:
   - `chat.service.ts` → enviarMensaje, obtenerThreads

3. ⚠️ `lib/health/` ya existe con providers (garmin, strava, google-health)

**Estado**: ✅ Completado 2026-05-08

---

### RF-04 — Extraer `AddClientModal` de `coach/alumnos/page.tsx`

**Problema**: Modal definido dentro de la page. No reutilizable.

**Acción**: Extraer a `coach/alumnos/_components/add-client-modal.tsx` usando Modal genérico.

**Estado**: ✅ Completado 2026-05-08 (page: 287→147, modal extraído)

---

### RF-05 — Crear Modal genérico con children

**Problema**: No existe componente Modal reutilizable. Cada page reinventa modals inline.

**Acción**: Crear `components/shared/modal/modal.tsx` con props:
```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}
```

**Estado**: ✅ Completado 2026-05-08

---

## 🟢 Nice-to-have

### RF-06 — Tipos y constantes para multi-tenant

**Problema**: Tipos no contemplan escenarios futuros (athlete sin coach, gym admin, etc.)

**Acciones completadas**:
1. ✅ Agregado `UserType = "athlete" | "gym_member" | "coach" | "gym_admin"` en `packages/types/index.ts`
2. ✅ Agregado `BusinessType = "solo_coach" | "gym" | "online_platform"` en `packages/types/index.ts`
3. ✅ Creado `lib/features/training/constants.ts` re-exportando constantes de training

**Estado**: ✅ Completado 2026-05-08

---

## Historial de refactors completados

| ID | Descripción | Fecha |
|---|---|---|
| RF-01 a RF-13 | Items previos del backlog legacy | 2026-05-02/03 |
| RF-01 | Extraer `wearable/page.tsx` (965→118 líneas, 4 componentes + hook) | 2026-05-08 |
| RF-02 | Extraer `mensajes/page.tsx` (430→120 líneas, 3 componentes + hook) | 2026-05-08 |

---

> **Regla**: Cuando se complete un item, moverlo a "Historial" con fecha. Cuando se descubra uno nuevo, agregarlo aquí antes de continuar con features.