# Roadmap de Mejoras UX — YourCoachFit

> Basado en Gap Analysis Pass 6 + Wireframes de bloques + Cambios implementados hoy
> Fecha: 2026-06-13

---

## Fase 0 — Fixes rápidos (YA IMPLEMENTADOS)

| # | Cambio | Impacto | Estado |
|---|--------|---------|--------|
| 1 | Panel cliente: HOY primero, SEMANAL después | Alto | ✅ Listo |
| 2 | Panel: Card de entreno de hoy con acción | Alto | ✅ Listo |
| 3 | Panel: Acciones rápidas integradas en resumen de hoy | Alto | ✅ Listo |
| 4 | Ocultar "Mensajes" de nav (cliente + coach) | Medio | ✅ Listo |
| 5 | Media viewer: Video inline, tamaño contenido, badges reposicionados | Medio | ✅ Listo |
| 6 | Logger: Placeholders por ejercicio (no globales) | Alto | ✅ Listo |
| 7 | Logger: Cardio puro con timer (sin formulario de fuerza) | Alto | ✅ Listo |
| 8 | EMOM: Sin input de reps, auto-avanza por minuto | Alto | ✅ Listo |
| 9 | Login: Errores con contexto (401/500/timeout) | Medio | ✅ Listo |
| 10 | Sesión: CTA único "Empezar" (eliminado "Ver") | Alto | ✅ Listo |
| 11 | Completada: "Guardar y cerrar sesión" en vez de "Confirmar" | Medio | ✅ Listo |

---

## Fase 1 — Core del Cliente (Próxima semana)

### Objetivo: Reducir fricción entre "abro la app" y "termino el entreno"

| # | Cambio | Problema actual | Solución propuesta | Esfuerzo |
|---|--------|-----------------|---------------------|----------|
| 1.1 | **Semana: Hero de intención** | Muestra título + tags técnicos. El alumno no entiende qué le espera. | Briefing de sesión: "Hoy toca · 45 min de fuerza · enfocado en piernas · con barra" | Medio |
| 1.2 | **Semana: Contexto semanal** | Solo muestra "Hechas X/Y". No hay narrativa de progreso. | Microcopy: "Semana 3 de 8 · estás en la mitad del bloque de fuerza · 1 más y cerrás" | Bajo |
| 1.3 | **Semana: "Después de hoy" colapsable** | Pendientes y completadas compiten visualmente con "Hoy". | Sección colapsable "Después de hoy" con menor peso visual. | Bajo |
| 1.4 | **Semana: Next step claro** | No hay puente después de terminar. | Al completar, mostrar "Descansá · Mañana toca cardio" o "Cerrar semana" | Medio |
| 1.5 | **Sesión: Refactor (532 líneas → 300)** | Excede límite. Monolito. | Extraer: `SessionHeader`, `BlockRunner`, `ExerciseList`, `RestOverlay`, `CompletionScreen` | Alto |
| 1.6 | **Sesión: Warmup sin contaminar** | El warmup marca "faltan series" al completar. | Warmup como bloque separado sin logger obligatorio. | Medio |
| 1.7 | **Sesión: Progreso macro visible** | No se ve el recorrido completo. | Timeline de bloques arriba: "Calentamiento ✅ → Fuerza (ahora) → Running → Cooldown" | Medio |
| 1.8 | **Onboarding: Sin emojis** | Usa `🔥💪⚖️🏃` violando DESIGN.md. | Reemplazar por Icon component (`flame`, `dumbbell`, `scale`, `run`) | Bajo |

---

## Fase 2 — Core del Coach (Semana 2-3)

### Objetivo: El coach arma entrenos sin pensar en campos técnicos

| # | Cambio | Problema actual | Solución propuesta | Esfuerzo |
|---|--------|-----------------|---------------------|----------|
| 2.1 | **Builder: Selector de patrón** | El coach elige `intervals` y luego `tabata`. No entiende la estructura. | Paso 1: "¿Cómo se ejecuta?" → Lista / Timer / Pasadas / Cardio / Recuperación | Alto |
| 2.2 | **Builder: Formularios contextualizados** | Campos genéricos mezclados (`workSeconds`, `restSeconds`, `rounds`, `setCount`). | Cada patrón muestra solo sus campos: Tabata muestra 20/10/8 rondas. EMOM muestra minutos + tarea. | Alto |
| 2.3 | **Builder: Preview del alumno** | El coach edita a ciegas. No sabe qué ve el alumno. | Panel lateral: "Así lo ve el alumno" con lenguaje humano y timeline. | Alto |
| 2.4 | **Builder: Duración visible** | No se calcula ni se muestra duración total. | Summary: "Total estimado: 13 min · 3 series × 10 rondas · 60s entre series" | Medio |
| 2.5 | **Alumnos: Tablero de atención** | Tabla plana. No prioriza quién necesita acción. | Tarjetas con señales: Riesgo (inactivo 7 días), Adherencia (baja), Plan (sin asignar), Acción sugerida. | Alto |
| 2.6 | **Alumnos: Quick actions** | Hay que entrar al alumno para actuar. | Acciones inline: "Enviar mensaje", "Ver última sesión", "Ajustar plan", "Marcar revisión". | Medio |
| 2.7 | **Planes: Drag & drop de workouts** | Mover workouts entre semanas es manual y lento. | Arrastrar workouts entre semanas en el grid. | Medio |
| 2.8 | **Planes: Preview del alumno** | El coach no ve cómo el alumno ve el plan. | Botón "Vista alumno" en el plan: muestra la semana como la ve el alumno. | Medio |

---

## Fase 3 — Features Nuevas (Semana 4+)

### Objetivo: Agregar valor diferencial

| # | Cambio | Descripción | Esfuerzo |
|---|--------|-------------|----------|
| 3.1 | **Analytics: Dashboard de volumen** | Gráficos de volumen por músculo, progresión de pesos, 1RM estimado. | Alto |
| 3.2 | **Analytics: PRs y records** | Personal Records por ejercicio, comparativa semana a semana. | Medio |
| 3.3 | **Gamification: Streaks y badges** | Racha de días consecutivos, badges por consistencia, PRs, exploración. | Medio |
| 3.4 | **Notificaciones push** | Recordatorios de entreno, alertas de inactividad, resumen semanal. | Alto |
| 3.5 | **Chat enriquecido** | Fotos, notas de voz, mensajes programados (ya ocultamos, ahora enriquecer). | Alto |
| 3.6 | **Wearables: Strava/Apple Health/Garmin** | Importar actividad, sincronizar FC, pasos automáticos. | Alto |
| 3.7 | **TV Mode (Gym)** | Pantalla gigante con timer, countdown, auto-avance entre ejercicios. | Alto |
| 3.8 | **Reviews post-sesión** | RPE global, dolor/molestias, nota para el coach. | Medio |
| 3.9 | **Scoring de comidas mejorado** | Versión configurable por coach, registro de agua, proteína. | Medio |
| 3.10 | **Biblioteca de ejercicios expandida** | Video tutorials, filtros avanzados (músculo, equipment, dificultad), favoritos. | Medio |

---

## Orden de implementación recomendado

### Semana 1: Fase 1 (Cliente)
1. Semana: Hero de intención + contexto semanal (1.1, 1.2)
2. Semana: "Después de hoy" colapsable + next step (1.3, 1.4)
3. Sesión: Refactor + warmup fix (1.5, 1.6)
4. Onboarding: Sin emojis (1.8)

### Semana 2: Fase 2 parte A (Coach Builder)
1. Builder: Selector de patrón (2.1)
2. Builder: Formularios contextualizados (2.2)
3. Builder: Preview del alumno (2.3)

### Semana 3: Fase 2 parte B (Coach Gestión)
1. Alumnos: Tablero de atención (2.5)
2. Alumnos: Quick actions (2.6)
3. Planes: Drag & drop + preview (2.7, 2.8)

### Semana 4+: Fase 3 (Features)
1. Analytics: Dashboard de volumen (3.1)
2. Gamification: Streaks (3.3)
3. Notificaciones push (3.4)

---

## Métricas de éxito

| Fase | Métrica | Objetivo |
|------|---------|----------|
| Fase 1 | Tiempo desde "abrir app" hasta "iniciar entreno" | < 20 segundos |
| Fase 1 | Sesiones abandonadas | Reducir 30% |
| Fase 2 | Tiempo de creación de bloque | < 2 minutos |
| Fase 2 | Errores de entreno (mal configurado) | Reducir 50% |
| Fase 3 | DAU (usuarios activos diarios) | +20% |
| Fase 3 | Retención semanal | +15% |

---

## Notas

- **TypeScript estricto**: Todo cambio debe pasar `npx tsc --noEmit` en web y api.
- **Límites de líneas**: Page ≤ 400, Component ≤ 300, Route ≤ 150, Hook ≤ 100.
- **Sin emojis**: Usar Icon component siempre.
- **Dark mode**: Todos los cambios deben funcionar en modo oscuro (un único tema).