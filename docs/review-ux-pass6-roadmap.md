# UX Pass 6 — Roadmap de Implementación

**Revisado:** 2026-06-12
**Basado en:** Gap Analysis de 17 módulos + Wireframes Before/After

---

## Principio rector

> No se ataca todo a la vez. Se prioriza el loop principal: **Coach programa → Alumno entiende → Alumno ejecuta → Coach interpreta → Coach ajusta**.

Cada fase tiene un objetivo claro, un entregable medible, y un criterio de éxito.

---

## Fase 1: Quick Wins (1-2 semanas)

### Objetivo
Eliminar fricción inmediata y violaciones duras del sistema sin rediseñar flujos.

### Tareas

| # | Tarea | Archivo(s) | Criterio de éxito |
|---|-------|-----------|-------------------|
| 1.1 | Reemplazar emojis por Icon component | `onboarding/page.tsx`, `logros/page.tsx`, `clasificacion/page.tsx`, `desafios/page.tsx` | `grep -r "🔥\|🏆\|🥇\|🥈\|🥉" apps/web/app/` devuelve 0 matches |
| 1.2 | Colores hardcodeados → variables CSS | `workouts/[id]/page.tsx`, `completada/page.tsx`, `clasificacion/page.tsx`, `tele/[classId]/page.tsx`, `comida/page.tsx` | `grep -r "#FF8E72\|#FC4C02\|#FFD700\|#fff" apps/web/app/` devuelve 0 matches |
| 1.3 | Extraer `<style jsx>` masivo de `cuenta/page.tsx` | `cuenta/page.tsx` → `cuenta/page.module.css` + `cuenta/_components/` | `cuenta/page.tsx` < 300 líneas, CSS en `.module.css` |
| 1.4 | Auth: mensajes de error humanos | `login/page.tsx` | Errores 401/500/timeout/CORS tienen mensajes distintos y accionables |
| 1.5 | Auth: estado "checking session" visible | `login/page.tsx` | Spinner + mensaje durante verificación de token previo |
| 1.6 | Agregar `npx tsc --noEmit` al CI | `package.json` | Build falla si hay errores TypeScript |

### Métrica de éxito
- 0 emojis en UI
- 0 colores hex hardcodeados en pages
- `cuenta/page.tsx` < 300 líneas
- Auth muestra estados y errores humanos

---

## Fase 2: Cliente Mobile — Loop de entrenamiento (2-3 semanas)

### Objetivo
Reducir el tiempo entre "abro la app" y "empecé a entrenar", y mejorar el cierre de sesión.

### Tareas

| # | Tarea | Archivo(s) | Criterio de éxito |
|---|-------|-----------|-------------------|
| 2.1 | **Semana: Hero de intención** | `semana/page.tsx` | Card "Hoy" muestra: objetivo, duración, modalidad, equipamiento. 1 CTA dominante. |
| 2.2 | **Semana: Microcopy de contexto** | `semana/page.tsx` | Progreso semanal con narrativa: "Semana 3 de 8 — estás en la mitad del bloque de fuerza" |
| 2.3 | **Semana: "Después de hoy" colapsable** | `semana/page.tsx` | Pendientes y completadas en sección colapsable, no compiten con "Hoy" |
| 2.4 | **Panel: "Tu día en 20 segundos"** | `panel/page.tsx` | 3 señales mínimas + 1 CTA dominante. Quick actions: "Agregar comida", "Solo proteína", "Tomé agua" |
| 2.5 | **Panel: Conectar con sesión** | `panel/page.tsx` | Si hay entreno pendiente, mostrarlo como CTA principal en el panel |
| 2.6 | **Completada: Celebración + story** | `sesion/[id]/completada/page.tsx` | Header: "¡Cerraste el Día B!" + Trophy icon. Muestra streak, adherencia, PRs. |
| 2.7 | **Completada: Feedback guiado** | `sesion/[id]/completada/page.tsx` | Pills: "Pesado", "Bien", "Podría más" + nota opcional |
| 2.8 | **Completada: Next step** | `sesion/[id]/completada/page.tsx` | 3 opciones: "Volver a semana", "Ver progreso", "Mandar feedback al coach" |
| 2.9 | **Completada: Reducir a < 300 líneas** | `sesion/[id]/completada/page.tsx` | Extraer a `_components/`: `SessionCelebration`, `SessionStats`, `SessionFeedback`, `SessionNextStep` |

### Métrica de éxito
- Usuario pasa de "abrir app" a "empezar entreno" en < 3 taps
- Panel tiene 1 CTA dominante claro
- Completada cuenta una historia (streak, PRs) y propone siguiente paso

---

## Fase 3: Coach Operación — Triage y decisión (2-3 semanas)

### Objetivo
Convertir la operación diaria del coach en un tablero de decisión, no en navegación.

### Tareas

| # | Tarea | Archivo(s) | Criterio de éxito |
|---|-------|-----------|-------------------|
| 3.1 | **Alumnos: Cards en vez de tabla** | `coach/alumnos/page.tsx` | Mobile: cards verticales. Desktop: cards o grid. |
| 3.2 | **Alumnos: Orden por prioridad** | `coach/alumnos/page.tsx` | Inactivos > Atención > Sin plan > On track. Filtros rápidos. |
| 3.3 | **Alumnos: Señal mínima útil** | `coach/alumnos/page.tsx` | Cada card muestra: adherencia semanal, energía promedio, último mensaje |
| 3.4 | **Alumnos: CTA inline** | `coach/alumnos/page.tsx` | Mensaje, Ajustar, Ver detalle — sin entrar a la página del alumno |
| 3.5 | **Detalle: Hero de diagnóstico** | `coach/alumnos/[id]/page.tsx` | Header muestra: estado, plan, semana, adherencia, riesgo + **acción recomendada** |
| 3.6 | **Detalle: Insights automáticos** | `coach/alumnos/[id]/page.tsx` | "Baja adherencia esta semana → Conviene escribir", "No entrenó hace 5 días → Enviar mensaje" |
| 3.7 | **Detalle: Agrupar actions** | `coach/alumnos/[id]/page.tsx` | Primarios: Mensaje, Ajustar plan. Secundarios: Ver, Quitar, Desvincular en dropdown. |
| 3.8 | **Detalle: Mobile — RightSidebar colapsable** | `coach/alumnos/[id]/page.tsx` | Bottom sheet o accordion para notas del coach en mobile |
| 3.9 | **Mensajes: Contexto del alumno** | `coach/mensajes/[id]/page.tsx` | Sidebar muestra: plan, última sesión, adherencia, energía |
| 3.10 | **Mensajes: Quick intents** | `coach/mensajes/[id]/page.tsx` | Pills: "Seguimiento", "Felicitación", "Ajuste", "Recordatorio" |
| 3.11 | **Mensajes: Quick replies** | `coach/mensajes/[id]/page.tsx` | Pills: "RPE 6", "RPE 7", "Dale", "Bajá 2kg" |

### Métrica de éxito
- Coach ve quién necesita atención en < 2 segundos
- Acción recomendada visible en el detalle del alumno
- Mensajes con contexto: no entra "a ciegas"

---

## Fase 4: Coach Construcción — Builder y Preview (3-4 semanas)

### Objetivo
El coach entiende qué está creando y cómo lo ve el alumno. Eliminar edición a ciegas.

### Tareas

| # | Tarea | Archivo(s) | Criterio de éxito |
|---|-------|-----------|-------------------|
| 4.1 | **Workouts: Status badges** | `coach/workouts/page.tsx` | `Borrador`, `Listo`, `En uso`, `Requiere revisión` |
| 4.2 | **Workouts: Preview alumno** | `coach/workouts/page.tsx` | CTA "Preview alumno" en cada card |
| 4.3 | **Workouts: Filtros** | `coach/workouts/page.tsx` | `Todos`, `Borradores`, `Listos`, `En uso` |
| 4.4 | **Builder: Extraer a componentes** | `coach/workouts/[id]/page.tsx` | `BlockHeader`, `BlockExercises`, `BlockEmpty`, `WorkoutToolbar`. Página < 300 líneas. |
| 4.5 | **Builder: Preview alumno panel** | `coach/workouts/[id]/page.tsx` | Panel derecho o tab que muestra cómo ve el alumno cada bloque |
| 4.6 | **Builder: Rediseñar BlockModal** | `_components/block-modal.tsx` | Selector de patrón primero: "¿Lista? ¿Timer? ¿Pasadas? ¿Cardio? ¿Recovery?" |
| 4.7 | **Builder: Resumen humano por bloque** | `coach/workouts/[id]/page.tsx` | "El alumno va a ver: 8 rondas de 20s trabajo + 10s descanso. Total 4 min." |
| 4.8 | **Builder: Presets** | `lib/training-blocks.ts` | Tabata (20/10 · 8 rondas), EMOM (cada minuto), AMRAP (12 min) |
| 4.9 | **Planes: Checklist de publicación** | `coach/planes/[id]/page.tsx` | Antes de publicar: preview validada, notas completas, volumen comparable |
| 4.10 | **Planes: Preview gemelo** | `coach/planes/[id]/preview/page.tsx` | Vista casi idéntica a la semana del alumno |

### Métrica de éxito
- Coach puede validar cómo ve el alumno sin salir del builder
- BlockModal: 1 click para elegir patrón, no 5 clicks de configuración
- Preview alumno: disponible en workouts y planes

---

## Fase 5: Transversal — Health, Wearables, Gym, Deuda (2-3 semanas)

### Objetivo
Cerrar los gaps que potencian el loop pero no son el loop en sí.

### Tareas

| # | Tarea | Archivo(s) | Criterio de éxito |
|---|-------|-----------|-------------------|
| 5.1 | **Wearables: Centro de sincronización** | `cuenta/wearable/page.tsx` | Estados por provider: Conectado / Necesita atención / Desconectado. Último sync. Qué se sincroniza. |
| 5.2 | **Wearables: Botón de destrabar** | `cuenta/wearable/page.tsx` | "Reconectar Google" con 1 click + explicación. No silencioso. |
| 5.3 | **Wearables: Calidad de datos** | `cuenta/wearable/page.tsx` | "Te faltan pasos de ayer" o "Gap de 2 días" |
| 5.4 | **Gym: Dashboard real** | `gym/page.tsx` | Métricas: clases hoy, asistencia, miembros activos, nuevos. No un menú. |
| 5.5 | **Gym: Navegación propia** | `gym/*` | Miembros, Clases, Tele, Reportes. No redirige a `/coach/*`. |
| 5.6 | **Gym: Mobile** | `gym/*` | Lista de clases de hoy + check-in rápido |
| 5.7 | **Calendario: Completar vista mes** | `coach/calendario/page.tsx` | Vista mes carga datos. Extraer a componentes. |
| 5.8 | **Calendario: Mobile simplificado** | `coach/calendario/page.tsx` | Lista de eventos en vez de grid en mobile |
| 5.9 | **Deuda: CSS Modules** | `*.page.tsx` | Migrar `<style jsx>` e inline a `.module.css` o clases utilitarias |
| 5.10 | **Deuda: Tests básicos** | `*.test.tsx` | Tests para componentes UI: Button, Card, Badge, Input |
| 5.11 | **Deuda: Server Components** | `app/(client)/*` | Evaluar qué pages pueden ser Server Components (no requieren auth) |

### Métrica de éxito
- Wearables: usuario sabe si está sync, qué falló, y cómo arreglarlo
- Gym: dashboard propio, no redirige a coach
- Calendario: vista mes funciona
- 0 `<style jsx>` en pages

---

## Fase 6: Sesión en ejecución — Runner mejorado (2-3 semanas)

### Objetivo
La sesión se siente como un acompañante, no como una hoja técnica editable.

### Tareas

| # | Tarea | Archivo(s) | Criterio de éxito |
|---|-------|-----------|-------------------|
| 6.1 | **Extraer sesión a componentes** | `sesion/[id]/page.tsx` | `SessionRunner`, `SessionLogger`, `SessionTimeline`, `SessionWarmup`. Página < 300 líneas. |
| 6.2 | **Stepper macro** | `sesion/[id]/page.tsx` | "Bloque 2 de 4 · Paso 3 de 6" visible arriba |
| 6.3 | **Labels de fase explícitos** | `sesion/[id]/page.tsx` | "Calentamiento" → "Trabajo principal" → "Descanso" → "Siguiente" |
| 6.4 | **Modo ejecución vs modo registro** | `sesion/[id]/page.tsx` | Pantalla inmersiva para ejecutar. Bottom sheet/drawer para registrar. |
| 6.5 | **Próximo paso siempre visible** | `sesion/[id]/page.tsx` | "Siguiente: Press banca · 4x8 · RPE 8" en la parte inferior |
| 6.6 | **CTA dominante por estado** | `sesion/[id]/page.tsx` | Un solo botón grande que cambia según estado: "Iniciar" → "Pausar" → "Continuar" → "Finalizar" |
| 6.7 | **Feedback háptico/sonoro** | `sesion/[id]/page.tsx` | Vibración + sonido en cambios de fase (opcional, configurable) |

### Métrica de éxito
- Usuario sabe siempre qué bloque está haciendo y cuánto falta
- Registro no interrumpe ejecución
- 1 CTA dominante, no 3 botones confusos

---

## Fase 7: Mensajes — Unificación (1-2 semanas)

### Objetivo
Unificar feedback post-sesión y chat en una sola experiencia.

### Tareas

| # | Tarea | Archivo(s) | Criterio de éxito |
|---|-------|-----------|-------------------|
| 7.1 | **Unificar feedback post-sesión con chat** | `comentarios/[id]/page.tsx` + `mensajes/*` | La nota de la sesión aparece como mensaje en el chat |
| 7.2 | **Card del entreno en chat** | `mensajes/*` | Cuando se habla de una sesión, mostrar card con ejercicios y sets |
| 7.3 | **Cliente mensajes: Quick replies** | `mensajes/page.tsx` | Pills: "Listo", "Dale", "RPE 7", "Pesado" |
| 7.4 | **Cliente mensajes: Contexto** | `mensajes/page.tsx` | Mostrar última sesión del alumno en el header del chat |

### Métrica de éxito
- Chat es el lugar único de comunicación (no hay "comentarios" separados)
- Contexto de sesión siempre visible
- Quick replies reducen tipeo

---

## Resumen de fases

| Fase | Duración | Enfoque | Impacto |
|------|----------|---------|---------|
| 1 | 1-2 sem | Quick wins | Elimina fricción inmediata |
| 2 | 2-3 sem | Cliente loop | Reduce "abrir → empezar" a 3 taps |
| 3 | 2-3 sem | Coach triage | Coach ve quién necesita atención primero |
| 4 | 3-4 sem | Coach builder | Coach entiende qué crea y cómo lo ve el alumno |
| 5 | 2-3 sem | Transversal | Wearables, Gym, Calendario, Deuda técnica |
| 6 | 2-3 sem | Sesión runner | Ejecución sin fricción, registro sin interrupción |
| 7 | 1-2 sem | Mensajes unificado | Chat como único canal de comunicación |

**Total estimado:** 13-20 semanas (~3-5 meses) con 1 desarrollador full-time.

**Con 2 desarrolladores:** Fases 2+3 en paralelo, 4+5 en paralelo. Total: 7-10 semanas.

---

## Criterios de Go/No-Go por fase

### Fase 1
- [ ] 0 emojis en UI
- [ ] 0 colores hex hardcodeados en pages
- [ ] `cuenta/page.tsx` < 300 líneas
- [ ] Auth muestra errores humanos
- [ ] `npx tsc --noEmit` pasa

### Fase 2
- [ ] Semana tiene 1 CTA dominante
- [ ] Panel tiene "Tu día en 20 segundos"
- [ ] Completada cuenta streak/PRs
- [ ] Completada propone next step

### Fase 3
- [ ] Alumnos ordenados por prioridad
- [ ] Alumnos en mobile son cards
- [ ] Detalle muestra acción recomendada
- [ ] Mensajes con contexto y quick replies

### Fase 4
- [ ] Builder tiene preview alumno
- [ ] BlockModal: selector de patrón
- [ ] Presets: Tabata, EMOM, AMRAP
- [ ] Planes: checklist de publicación

### Fase 5
- [ ] Wearables: estados y destrabar
- [ ] Gym: dashboard propio
- [ ] Calendario: vista mes funciona
- [ ] 0 `<style jsx>` en pages

### Fase 6
- [ ] Sesión: stepper macro
- [ ] Sesión: modo ejecución vs registro
- [ ] Sesión: 1 CTA dominante
- [ ] Sesión: próximo paso visible

### Fase 7
- [ ] Feedback post-sesión en chat
- [ ] Card del entreno en chat
- [ ] Quick replies en cliente

---

## Dependencias técnicas

### Antes de empezar Fase 4
- [ ] Componente `PreviewStudent` reutilizable (workouts + planes)
- [ ] Patrones de ejecución definidos en frontend: `executionPattern`
- [ ] API `/coach/workouts/:id/preview` (si no existe)

### Antes de empezar Fase 3
- [ ] API `/coach/clients` enriquecida con: adherencia, energía, último mensaje
- [ ] Endpoint `/coach/clients/:id/insights` (recomendaciones automáticas)

### Antes de empezar Fase 5
- [ ] API `/client/wearables/status` (estado de sync por provider)
- [ ] API `/client/wearables/reconnect` (reconectar sin re-configurar todo)

### Antes de empezar Fase 6
- [ ] API `/client/sessions/:id/next-step` (próximo ejercicio/bloque)

---

## Recomendación de arranque

**Empezar por Fase 1** (quick wins). Son cambios pequeños, de alto impacto, que no requieren diseño nuevo. Generan confianza y momentum.

**En paralelo, diseñar Fase 2 y 3.** Los wireframes ya están hechos (este documento). Se pueden pasar a implementación directa.

**Fase 4 requiere más diseño.** El rediseño del builder por patrón es el cambio más grande. Requiere validación con usuarios reales.

**Fase 5, 6, 7** pueden empezar en paralelo con Fase 4 si hay 2 desarrolladores.

---

*Documentos relacionados:*
- [review-ux-pass6-gap-analysis.md](review-ux-pass6-gap-analysis.md)
- [review-ux-pass6-wireframes.html](review-ux-pass6-wireframes.html)
- [review-ux.md](review-ux.md)
- [review-ux-pass3-solutions.md](review-ux-pass3-solutions.md)
- [training-blocks-ux-redesign-plan.md](training-blocks-ux-redesign-plan.md)
