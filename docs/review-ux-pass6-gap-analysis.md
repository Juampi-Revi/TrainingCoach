# UX Audit Pass 6 — Análisis Forense de Brechas (Gap Analysis)

**Revisado:** 2026-06-12
**Objetivo:** Mapear exactamente qué hay implementado hoy vs. qué propusieron las pasadas 1-5, y cuánto falta para cerrar el gap.

**Método:** Lectura directa del código fuente (apps/web y apps/api) + comparación con las propuestas de los documentos anteriores.

---

## Índice de Hallazgos

1. [Auth / Onboarding](#1-auth--onboarding)
2. [Cliente — Semana](#2-cliente--semana)
3. [Cliente — Panel / Hábitos](#3-cliente--panel--hábitos)
4. [Cliente — Sesión](#4-cliente--sesión)
5. [Cliente — Sesión Completada](#5-cliente--sesión-completada)
6. [Cliente — Mensajes](#6-cliente--mensajes)
7. [Cliente — Cuenta / Perfil / Settings](#7-cliente--cuenta--perfil--settings)
8. [Cliente — Wearables / Salud](#8-cliente--wearables--salud)
9. [Coach — Alumnos](#9-coach--alumnos)
10. [Coach — Detalle de Alumno](#10-coach--detalle-de-alumno)
11. [Coach — Workouts (Listado)](#11-coach--workouts-listado)
12. [Coach — Workout Builder (Editor)](#12-coach--workout-builder-editor)
13. [Coach — Planes](#13-coach--planes)
14. [Coach — Mensajes](#14-coach--mensajes)
15. [Coach — Calendario](#15-coach--calendario)
16. [Gym — Dashboard](#16-gym--dashboard)
17. [Transversal — Deuda Técnica UX](#17-transversal--deuda-técnica-ux)
18. [Resumen Ejecutivo](#resumen-ejecutivo)

---

## 1. Auth / Onboarding

### Código actual
- **Archivo:** `apps/web/app/login/page.tsx` (177 líneas)
- **Estructura:** Formulario simple (email, password, Google OAuth), max-width 380px centrado
- **Estados:** `loading`, `error` (string genérico), sin granularidad
- **Redirect:** Automático según `user.role` (coach → /coach, gym → /gym, client → /semana)

### Qué está bien
- Visual limpio y consistente con el sistema de diseño
- CTA principal claro ("Ingresar")
- Google OAuth visible
- Error básico de 401 ("Email o contraseña incorrectos")

### Qué falta (Gap vs. Propuesta Pass 3-4)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| Estados de auth explícitos (checking-session, session-invalid, api-unreachable) | ❌ No existe | **Crítico** — falla silenciosa cuando el backend no responde |
| Identificación de rol / promesa de la app | ❌ No existe | **Alto** — el login no dice "¿para quién es esta app?" |
| Mensajes de error humanos | ⚠️ Parcial — solo 401 | **Alto** — 500, timeout, CORS, token expired no se explican |
| Onboarding post-login (primer paso claro) | ⚠️ Stub en `/onboarding` | **Alto** — usa emojis (`🔥💪⚖️🏃`) violando DESIGN.md |
| Recuperación de sesión (retry, re-login) | ❌ No existe | **Medio** — refresh token automático pero sin feedback visual |
| Password visibility toggle | ✅ Existe | — |

### Código problemático
```tsx
// login/page.tsx:27-37
if (e instanceof ApiError) {
  if (e.status === 401) setError("Email o contraseña incorrectos");
  else setError(e.message || "Error al ingresar");
} else {
  setError(e instanceof Error ? e.message : "Error al ingresar");
}
```
**Problema:** Los errores 500, 503, timeout, CORS, etc. llegan como "Error al ingresar" — el usuario no sabe si es su culpa o del sistema.

### Estrategia recomendada
- Crear capa de estados de auth: `checking`, `valid`, `invalid`, `api-down`, `oauth-misconfigured`
- Mostrar mensajes accionables: "No pudimos hablar con el servidor. Reintentar en 5s."
- Agregar contexto de rol: "Entrá como alumno", "Entrá como coach" (o detectar pero explicar)
- Reemplazar emojis en onboarding por Icon component

---

## 2. Cliente — Semana

### Código actual
- **Archivo:** `apps/web/app/(client)/semana/page.tsx` (399 líneas, límite: 400)
- **Estructura:** Header con nombre + strip de días + summary "Hechas/X" + plan activo + CTA principal
- **CTA principal:** Card lime "Hoy" con "Empezar" / "Continuar" + "Ver"
- **Secciones:** En curso / Pendientes / Completadas

### Qué está bien
- Week strip visual con día actual resaltado en lime
- Card principal de "Hoy" bien destacada
- Estados de sesión (in_progress, pending, completed)
- Bottom nav mobile (oculta en sesión)
- Estadísticas básicas (completas / parciales / en curso)

### Qué falta (Gap vs. Propuesta Pass 3-4)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Hero de intención** con "Hoy toca", "por qué importa", "duración", "objetivo" | ⚠️ Parcial — muestra título + tags pero no contexto | **Alto** — falta briefing editorial de la sesión |
| **Microcopy de contexto semanal** (progreso, racha, motivación) | ❌ No existe | **Alto** — solo muestra "Hechas X/Y" sin narrativa |
| **Pendientes agrupados como "Después de hoy"** | ⚠️ Parcial — están separados pero compiten visualmente | **Medio** — "Pendientes" y "Completadas" usan mismo lenguaje visual que "Hoy" |
| **Barra lateral con menor protagonismo** | ⚠️ Sidebar visible en desktop | **Bajo** — en mobile no hay sidebar, ok |
| **Next step claro** (qué pasa después de terminar) | ❌ No existe | **Alto** — no hay puente hacia la siguiente acción |
| **Estado vacío** (sin plan) | ✅ Existe | — Bien resuelto con "Tu coach está armando tu programa" |

### Código problemático
```tsx
// semana/page.tsx:247-253
<div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-.02em", marginTop: 2 }}>
  {today.title}
</div>
<div style={{ fontSize: 13, fontWeight: 500, opacity: 0.75, marginBottom: 18 }}>
  {today.description ?? today.tags.join(" · ")} · {today.exerciseCount} ej
</div>
```
**Problema:** El subtítulo muestra datos técnicos (`ej · tags`) pero no una **promesa de experiencia** ("45 min de fuerza y cardio, enfocado en piernas").

```tsx
// semana/page.tsx:285-298
<Link href={workoutHref(today)} style={{ flex: 1, textDecoration: "none" }}>
  <Button block size="lg" icon="play" style={{ background: "#0B0B0C", color: "var(--lime)" }}>
    Empezar
  </Button>
</Link>
<Link href={workoutHref(today)} style={{ textDecoration: "none" }}>
  <Button size="lg" variant="ghost" style={{ background: "rgba(11,11,12,.08)", color: "#0B0B0C", border: "1px solid rgba(11,11,12,.2)" }}>
    Ver
  </Button>
</Link>
```
**Problema:** Dos botones que llevan a la misma página. El usuario duda "¿Empezar o Ver?" — en mobile, el "Ver" es casi tan grande como "Empezar".

### Estrategia recomendada
- Reemplazar la card "Hoy" por un **briefing de sesión** con: objetivo, duración, modalidad, equipamiento
- Añadir microcopy motivacional sobre el plan ("Semana 3 de 8 — estás en la mitad del bloque de fuerza")
- Reducir peso visual de "Ver" (o eliminarlo, el título ya es clicable)
- Añadir progreso semanal con storytelling ("Llevás 3 de 4 esta semana, 1 más y cerrás")
- Añadir "Después de hoy" como sección colapsable

---

## 3. Cliente — Panel / Hábitos

### Código actual
- **Archivo:** `apps/web/app/(client)/panel/page.tsx` (275 líneas)
- **Estructura:** ScoreHeader + QuickLogStrip + 4 KPI cards (Fuerza, Aeróbico, Pasos, Sueño) + 2 secondary cards (Energía, Nutrición) + WeekHeatmap + MonthSummary
- **Modales:** QuickHealthModal para pasos y sueño

### Qué está bien
- KPIs bien visualizados con progreso (dots, bars, rings)
- Heatmap semanal de actividad
- Quick log para pasos y sueño
- Trend en pasos (comparación semana anterior)

### Qué falta (Gap vs. Propuesta Pass 5)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **"Tu día en 20 segundos"** — señales mínimas + acciones | ❌ No existe | **Crítico** — es un dashboard denso, no una guía de acción |
| **Quick actions para hábitos** (agregar comida, proteína, agua) | ❌ No existe | **Alto** — solo hay "+ Registrar comida" como link |
| **Checklist pre-entreno** | ❌ No existe | **Alto** — no hay conexión entre panel y sesión |
| **Siguiente paso dominante** (CTA principal del día) | ❌ No existe | **Alto** — no hay un "hacé esto ahora" |
| **Estados de recuperación / recomendación** | ⚠️ ScoreHeader existe pero no es accionable | **Medio** — muestra score pero no dice "bajá intensidad" |
| **Colapsar lo secundario** | ❌ Todo visible | **Medio** — mucho scroll, muchas secciones |

### Código problemático
```tsx
// panel/page.tsx:194-224
<div className="panel-section">
  <div className="panel-section-title">RESUMEN DE LA SEMANA</div>
  <div className="stats-grid-main">
    <MetricCard label="FUERZA" value={...} sub={...} accent="var(--lime)">
      <DotProgress count={strengthTarget} done={d.strengthCompleted} color="var(--lime)" />
    </MetricCard>
    <MetricCard label="AERÓBICO" value={...} sub={...} accent="var(--info)">
      <DotProgress count={cardioTarget} done={d.cardioCompleted} color="var(--info)" />
    </MetricCard>
    <MetricCard label="PASOS · 7D" value={...} sub={...} trend={trend} accent="var(--lime)">
      <MiniBars data={dailyStepsK} target={stepsGoalK} color="var(--lime)" unit="k" />
    </MetricCard>
    <MetricCard label="SUEÑO" value={...} sub={...} accent="var(--sleep)">
      <SleepRing hours={sleepHours} targetHours={sleepGoalHours} size={40} />
    </MetricCard>
  </div>
</div>
```
**Problema:** 4 KPIs compiten por atención. El usuario entra al panel y no sabe qué hacer. No hay un "CTA del día".

### Estrategia recomendada
- Convertir el panel en **"Tu día en 20 segundos"**: 3 señales mínimas + 1 acción principal
- CTA dominante: "Registrá comida en 15s" / "Empezá el entreno de hoy" / "Conectá Strava"
- Hábitos como quick actions (pills): "Tomé agua", "Solo proteína", "Agregar comida"
- Lo demás: colapsable o en sección secundaria
- Conectar con sesión: si hay entreno pendiente, mostrarlo arriba

---

## 4. Cliente — Sesión

### Código actual
- **Archivo:** `apps/web/app/(client)/sesion/[sessionId]/page.tsx` (532 líneas, **EXCEDE LÍMITE**)
- **Estructura:** Header + timeline de bloques + ejercicio actual + timer/logger + media viewer + warmup overlay + alternativas picker
- **Features:** Timer, sets/reps logger, rest timer, exercise swaps, media viewer, notes, offline queue

### Qué está bien
- Runner/timer funcional
- Logger de sets/reps
- Offline queue (localStorage si falla red)
- Keyboard handling (visualViewport)
- Warmup overlay
- Alternativas de ejercicios
- Media viewer con thumbnails

### Qué falta (Gap vs. Propuesta Pass 3-4)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Stepper macro de sesión** (bloque 1 de 5) | ❌ No existe | **Alto** — el usuario no ve progreso macro |
| **Labels explícitos de fase** (prep / work / rest / next) | ⚠️ Parcial — el runner tiene estados pero no son explícitos | **Medio** — en intervalos sí, pero no en fuerza |
| **CTA dominante según estado** | ⚠️ Parcial — play/pause/continue pero pueden confundir | **Medio** — "Continuar" vs "Play" vs "Iniciar" no son consistentes |
| **Feedback háptico/sonoro** | ❌ No existe | **Bajo** — nice to have, no crítico |
| **Próximo paso siempre visible** | ⚠️ Parcial — siguiente ejercicio existe | **Medio** — pero no se siente como "guía" |
| **Separación clara: modo ejecución vs modo registro** | ❌ No existe | **Crítico** — hoy todo convive en la misma pantalla |

### Código problemático
```tsx
// sesion/[sessionId]/page.tsx tiene 532 líneas (límite: 400)
```
**Problema:** La página excede el límite de 400 líneas. Debe extraerse a `_components/` y `_hooks/`.

### Estrategia recomendada
- Extraer a sub-componentes: `SessionRunner`, `SessionLogger`, `SessionTimeline`, `SessionWarmup`
- Agregar stepper macro: "Bloque 2 de 4 · Paso 3 de 6"
- Separar: **modo ejecución** (pantalla inmersiva, timer, CTA grande) vs **modo registro** (drawer/bottom sheet, sets/reps)
- Labels más explícitos: "Calentamiento" → "Trabajo principal" → "Descanso" → "Siguiente"
- Integrar feedback háptico/sonoro en cambios de fase

---

## 5. Cliente — Sesión Completada

### Código actual
- **Archivo:** `apps/web/app/(client)/sesion/[sessionId]/completada/page.tsx` (389 líneas, límite: 400)
- **Estructura:** Hero con gradiente + stats grid (Volumen, Series, Ejercicios) + Strava card + Energy rating 1-5 + Highlights + Nota para coach + Bottom actions (Comentarios / Confirmar)

### Qué está bien
- Hero con gradiente lime celebra el esfuerzo
- Stats grid clara (Volumen, Series, Ejercicios)
- Strava card con planificado vs ejecutado
- Energy rating 1-5 con labels (BAJA, MEDIA, ALTA)
- Highlights de top sets
- Nota para coach

### Qué falta (Gap vs. Propuesta Pass 3)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Celebración emocional** (logro del día, consistencia, streak) | ⚠️ Parcial — gradiente lime pero no cuenta historia | **Alto** — "Sesión completada" es frío; debería ser "¡Cerraste el Día B!" |
| **Feedback guiado** (cómo te sentiste, qué ajustar, mensaje opcional) | ⚠️ Parcial — energy rating + nota libre | **Medio** — no guía al usuario, deja todo libre |
| **Next step claro** (volver a semana, ver progreso, avisar al coach) | ❌ No existe | **Crítico** — solo hay "Comentarios" y "Confirmar", sin contexto |
| **Resumen de progreso reciente** (streak, adherencia, PRs) | ❌ No existe | **Alto** — no conecta esta sesión con el historial |
| **Cierre más humano** (mensaje del coach, recomendación de recuperación) | ❌ No existe | **Medio** — la pantalla termina en un formulario |

### Código problemático
```tsx
// completada/page.tsx:358-370
<div style={{ padding: "10px 16px 28px", borderTop: "1px solid var(--line)", display: "flex", gap: 8, background: "var(--bg)" }}>
  <Button size="lg" variant="secondary" icon="msg" style={{ flex: 1 }} onClick={() => router.push(`/comentarios/${sessionId}`)}>
    Comentarios
  </Button>
  <Button size="lg" style={{ flex: 1.4 }} disabled={saving} onClick={save}>
    {saving ? "Guardando…" : "Confirmar"}
    {!saving && <Icon name="check" size={14} color="#0B0B0C" />}
  </Button>
</div>
```
**Problema:** "Confirmar" es un CTA técnico. "Comentarios" lleva a otra pantalla. No hay: "Ver tu progreso", "Compartir con el coach", "Próximo entreno".

### Estrategia recomendada
- Header más emocional: "¡Cerraste el Día B!" + icono de trophy
- Bloque de "Tu progreso": streak, adherencia semanal, PRs de hoy
- Feedback guiado: "¿Cómo te sentiste?" + "¿Algo para ajustar?" (quick options: "Pesado", "Bien", "Podría más")
- Next step: "Volver a semana", "Ver progreso", "Mandar feedback al coach"
- Strava: mejor integrado como "Vinculá tu actividad" (no como card separada)

---

## 6. Cliente — Mensajes

### Código actual
- **Archivo:** `apps/web/app/(client)/mensajes/page.tsx` (no leído en profundidad, pero inferido del agente)
- **Estructura:** Chat estilo WhatsApp (burbujas lime para usuario, bg-1 para coach) + input redondeado + ref picker para adjuntar sesión
- **Features:** SSE para mensajes nuevos, adjuntar sesión, polling

### Qué está bien
- Chat funcional en tiempo real
- Adjuntar sesión (ref picker)
- Polling de mensajes

### Qué falta (Gap vs. Propuesta Pass 5)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Context card del entreno** en el chat | ⚠️ Parcial — ref picker existe pero no es una card | **Alto** — el coach no ve el contexto de la última sesión |
| **Quick replies** (RPE 6, RPE 7, etc.) | ❌ No existe | **Alto** — cada mensaje requiere tipeo completo |
| **Quick intents** (seguimiento, felicitación, ajuste) | ❌ No existe | **Alto** — el coach no tiene atajos |
| **Unificación de feedback post-sesión + chat** | ❌ Son dos mundos | **Crítico** — comentarios de sesión y chat son separados |
| **Contexto automático** (última sesión, estado del plan, adherencia) | ❌ No existe | **Alto** — el coach entra al chat "a ciegas" |

### Estrategia recomendada
- Integrar **context card**: mostrar la última sesión del alumno al abrir el chat
- Quick replies: pills de RPE, "Listo", "Dale", "Bajá 2kg"
- Quick intents para coach: "Seguimiento", "Felicitación", "Ajuste", "Recordatorio"
- Unificar feedback post-sesión con chat: la nota de la sesión debería aparecer como mensaje
- Mostrar adherencia del alumno en el header del chat

---

## 7. Cliente — Cuenta / Perfil / Settings

### Código actual
- **Archivo:** `apps/web/app/(client)/cuenta/page.tsx` (493 líneas, **EXCEDE LÍMITE**)
- **Estructura:** Header + Profile banner (avatar + nombre + email) + card-cuenta rows (Editar perfil, Notificaciones, Tema) + card-cuenta rows (Metas, Dispositivos, Mediciones) + Logout
- **Estilo:** `<style jsx>` masivo con media queries para 768px, 1200px

### Qué está bien
- Patrón de settings list consistente con DESIGN.md
- Toggle de tema funcional
- Iconos en cada row
- Responsive con media queries

### Qué falta (Gap)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Límite de 400 líneas** | ❌ 493 líneas | **Crítico** — necesita extracción a componentes |
| **Cerrar sesión en `/cuenta`**, no en subpantallas | ✅ Correcto | — |
| **Consistencia de estilos** (no inline, no `<style jsx>`) | ❌ `<style jsx>` masivo | **Alto** — viola el patrón de usar variables CSS |
| **Settings desparramados** en múltiples páginas | ✅ Agrupados en cuenta | — Bien resuelto |
| **Wearables como subpantalla** | ✅ Existe | — |

### Código problemático
```tsx
// cuenta/page.tsx:105-490 — todo el archivo es <style jsx>
```
**Problema:** 385 líneas de CSS inline. Esto dificulta el mantenimiento, rompe consistencia, y viola el principio de usar variables CSS del sistema.

### Estrategia recomendada
- Extraer todo `<style jsx>` a un CSS module: `cuenta/page.module.css`
- Extraer sub-componentes: `ProfileBanner`, `SettingsCard`, `SettingsRow`, `ThemeToggle`
- Separar en `cuenta/_components/`
- Reducir a < 300 líneas la página

---

## 8. Cliente — Wearables / Salud

### Código actual
- **Archivo:** `apps/web/app/(client)/cuenta/wearable/page.tsx` (no leído en profundidad)
- **Estructura:** Lista de providers (Garmin, Google Health, Strava) + cards con estado conectado/desconectado + modal para credenciales Garmin

### Qué está bien
- OAuth funcional para Garmin, Google Health, Strava
- Sync de datos
- Cards con estado básico

### Qué falta (Gap vs. Propuesta Pass 5)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Estado visible** (último sync, tipo de datos, errores) | ⚠️ Parcial — conectado/sí | **Alto** — no muestra "último sync hace 2h" ni "faltan pasos de ayer" |
| **Un botón para destrabar** cuando falla | ❌ No existe | **Crítico** — cuando falla OAuth, el usuario no sabe qué hacer |
| **Trazabilidad visible** | ❌ No existe | **Alto** — "No pasó nada" es la experiencia de error |
| **Calidad de datos** (gaps, inconsistencias) | ❌ No existe | **Medio** — no avisa si faltan datos |
| **Estado inequívoco** (conectado / autorizado / sync / útil) | ⚠️ Parcial — solo conectado/sí | **Alto** — las 4 capas no están separadas |

### Estrategia recomendada
- Crear **centro de sincronización** con estados por provider:
  - `Conectado` / `Necesita atención` / `Desconectado`
  - Último sync: "Hace 2h"
  - Qué se sincroniza: "Pasos, sueño, actividades"
  - Calidad: "Te faltan pasos de ayer"
- CTA de destrabar: "Reconectar Google" con 1 click + explicación
- Banner de error cuando falla: no silencioso

---

## 9. Coach — Alumnos

### Código actual
- **Archivo:** `apps/web/app/coach/alumnos/page.tsx` (165 líneas)
- **Estructura:** DesktopShell + search bar + tabla de alumnos (nombre, plan, última sesión, status) + paginación (50 por página)
- **Status:** `On track` (lime), `Atención` (warn), `Inactiva` (danger), `Sin plan` (danger)
- **Orden:** Alfabético

### Qué está bien
- Tabla clara con información básica
- Status badges por última sesión
- Búsqueda por nombre
- Paginación para grandes carteras

### Qué falta (Gap vs. Propuesta Pass 3)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Tablero de triage** (cards, no tabla) | ❌ Tabla plana | **Crítico** — en mobile no funciona, en desktop no prioriza |
| **Orden por prioridad** (quién necesita atención) | ❌ Alfabético | **Crítico** — el coach no ve quién está "mal" primero |
| **Grupos rápidos** (requieren atención, sin plan, activos, sin actividad) | ❌ No existe | **Alto** — no hay filtros por estado |
| **Señal mínima útil por fila** (adherencia, energía, última interacción) | ❌ Solo última sesión | **Alto** — no muestra energía promedio, adherencia semanal |
| **CTA por alumno** (mensaje, ajustar, asignar) | ❌ Click lleva a detalle | **Medio** — requiere navegación extra |
| **Mobile: cards en vez de tabla** | ❌ Tabla en mobile | **Crítico** — imposible de usar en celular |

### Código problemático
```tsx
// alumnos/page.tsx:46-50
return [...base].sort((a, b) => {
  const an = (a.name ?? a.email).toLowerCase();
  const bn = (b.name ?? b.email).toLowerCase();
  return an.localeCompare(bn);
});
```
**Problema:** Orden alfabético. Un coach con 50 alumnos nunca verá quién necesita atención primero.

### Estrategia recomendada
- **Mobile:** Reemplazar tabla por cards con señal mínima + acciones rápidas
- **Desktop:** Agregar filtros rápidos: `Requieren atención`, `Sin plan`, `Activos`, `Sin actividad`
- **Orden por prioridad:** inactivos primero, luego atención, luego on track
- **Enriquecer fila:** adherencia semanal, energía promedio, último mensaje
- **CTA inline:** Mensaje, Ajustar, Asignar plan (sin entrar al detalle)

---

## 10. Coach — Detalle de Alumno

### Código actual
- **Archivo:** `apps/web/app/coach/alumnos/[clientUserId]/page.tsx` (281 líneas)
- **Estructura:** DesktopShell + breadcrumb + 5 tabs (Resumen, Entrenos, Actividad, Progreso, Privado) + ClientHeader + RightSidebar (notas del coach)
- **Actions:** Volver, Mensaje, Cambiar/Asignar plan, Ver plan, Quitar plan, Desvincular

### Qué está bien
- Tabs bien organizados
- ClientHeader con info del alumno
- RightSidebar para notas del coach
- Actions principales presentes
- Hooks extraídos (useClientDetail, useTabData, etc.) — buena arquitectura

### Qué falta (Gap vs. Propuesta Pass 3)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Hero con diagnóstico** (estado, riesgos, siguiente acción) | ❌ No existe | **Crítico** — el coach ve datos pero no un diagnóstico |
| **Bloque de decisión** (qué conviene hacer ahora) | ❌ No existe | **Alto** — 5 tabs pero no dice "intervení acá" |
| **Insights automáticos** (baja adherencia, conviene escribir) | ❌ No existe | **Alto** — el coach tiene que interpretar todo solo |
| **Reordenar tabs por frecuencia real** | ⚠️ Resumen primero | **Medio** — ok, pero podría adaptarse según el alumno |
| **Mobile:** 2 columnas → 1 | ⚠️ coach-two-col existe | **Medio** — RightSidebar se pierde en mobile |
| **Contexto de última sesión** en el header | ❌ No existe | **Medio** — no se ve la última sesión sin entrar a "Entrenos" |

### Código problemático
```tsx
// alumnos/[clientUserId]/page.tsx:109-171
actions={
  <>
    <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push("/coach/alumnos")}>Volver</Button>
    <Button variant="outline" size="sm" icon="msg" onClick={() => router.push(`/coach/mensajes/${clientUserId}`)}>Mensaje</Button>
    <Button variant="outline" size="sm" icon="calendar" onClick={() => setShowAssign(true)}>Cambiar plan</Button>
    <Button variant="outline" size="sm" icon="edit" onClick={() => router.push(`/coach/planes/${client.assignment!.plan!.id}`)}>Ver plan</Button>
    <Button variant="outline" size="sm" style={{ color: "var(--warn)", borderColor: "var(--warn)" }}>Quitar plan</Button>
    <Button variant="outline" size="sm" style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Desvincular</Button>
  </>
}
```
**Problema:** 6 botones en el header. No hay jerarquía: "Volver", "Mensaje", "Cambiar plan", "Ver plan", "Quitar plan", "Desvincular" parecen igual de importantes. El coach no sabe qué hacer primero.

### Estrategia recomendada
- **Hero superior:** estado del alumno (plan activo, semana, adherencia, riesgo) + **acción recomendada**
- Ejemplo: "Baja adherencia esta semana → Conviene escribir" o "No entrenó hace 5 días → Enviar mensaje"
- **Agrupar actions:** Primarios (Mensaje, Ajustar plan) vs Secundarios (Ver plan, Quitar, Desvincular) en dropdown
- **Resumen tab:** Convertir en dashboard de decisión con insights automáticos
- **Mobile:** RightSidebar como bottom sheet o colapsable

---

## 11. Coach — Workouts (Listado)

### Código actual
- **Archivo:** `apps/web/app/coach/workouts/page.tsx` (233 líneas)
- **Estructura:** DesktopShell + grid de cards (o lista con tabla) + tags + botones duplicar/eliminar
- **Estados:** Sin estados claros (borrador, listo, en uso, requiere revisión)
- **Acciones:** Nuevo entrenamiento, Duplicar, Eliminar

### Qué está bien
- Grid de cards con tags
- Duplicar y eliminar funcionales
- Navegación al editor

### Qué falta (Gap vs. Propuesta Pass 3)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Estados claros** (borrador, listo, en uso, requiere revisión) | ❌ No existe | **Crítico** — no se sabe qué está listo para usar |
| **Acceso rápido a preview alumno** | ❌ No existe | **Crítico** — solo existe en planes, no en workouts |
| **Clasificación por objetivo/deporte** | ⚠️ Tags existen | **Medio** — pero no filtra ni agrupa |
| **Preparar paso mental hacia "cómo lo verá el alumno"** | ❌ No existe | **Alto** — el coach edita a ciegas |
| **Mobile:** lista de cards en vez de tabla | ⚠️ Existe en algunas vistas | **Medio** — grid de cards funciona en mobile |

### Estrategia recomendada
- Agregar **status badges**: `Borrador` (gris), `Listo` (lime), `En uso` (info), `Requiere revisión` (warn)
- CTA rápido: `Preview alumno` en cada card
- Filtros: `Todos`, `Borradores`, `Listos`, `En uso`
- En `coach/workouts/[id]`: agregar tab `Preview alumno` (como existe en planes)
- Mostrar cuántos alumnos usan cada workout

---

## 12. Coach — Workout Builder (Editor)

### Código actual
- **Archivo:** `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx` (416 líneas, **EXCEDE LÍMITE**)
- **Estructura:** Layout 2 columnas: izquierda lista de bloques + ejercicios, derecha inspector (ExerciseInspector o WorkoutProperties)
- **Bloques:** Header con icono según tipo (warmup=flame, cooldown=moon, etc.) + exercises + botones mover/configurar/biblioteca/agregar
- **Modal:** BlockModal para crear/editar bloques

### Qué está bien
- Editor potente con bloques, ejercicios, supersets
- Reorder de bloques y ejercicios
- Inspector de ejercicios (sets, reps, RPE, etc.)
- Properties del workout (título, descripción, deporte)
- Colores de bloque por tipo (warmup, cooldown, cardio, etc.)

### Qué falta (Gap vs. Propuesta Pass 1-2 de Bloques)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Builder por patrón** (lista/timer/pasadas/cardio/recovery) | ❌ Modal técnico con campos condicionales | **Crítico** — el coach piensa en campos, no en recetas |
| **Preview alumno** en el builder | ❌ No existe | **Crítico** — el coach no ve cómo lo ve el alumno |
| **Duración estimada visible** por bloque y total | ⚠️ Parcial — `totalEstimated` existe | **Medio** — pero no es información de primer nivel |
| **Resumen humano** del bloque ("8 rondas · 20s on / 10s off") | ⚠️ Parcial — `blockCoachSummary` existe | **Medio** — pero es técnico, no narrativo |
| **Selector de patrón de ejecución** (primero intención, después detalle) | ❌ No existe | **Crítico** — el modal pregunta tipo técnico primero |
| **Recetas pre-configuradas** (Tabata preset, EMOM, etc.) | ❌ No existe | **Medio** — cada bloque se arma desde cero |
| **Límite de 400 líneas** | ❌ 416 líneas | **Crítico** — necesita extracción |

### Código problemático
```tsx
// workouts/[id]/page.tsx:221-276
// Block Header: 56 líneas de JSX inline para un header
<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--bg-2)" }}>
  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,142,114,.12)", ... }}>
    <Icon name={b.type === "warmup" ? "flame" : ...} size={14} color={...} />
  </div>
  <div style={{ flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 10, fontWeight: 800, color: ..., letterSpacing: ".08em" }}>
      {blockTypeLabel(b.type, b.intervalType).toUpperCase()} {b.label ? `· ${b.label}` : ""}
    </div>
    <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
      {blockPatternLabel(b)} · {blockCoachSummary(b)}
      <span style={{ margin: "0 6px" }}>·</span>
      {blockExercises.length} ejercicio{blockExercises.length === 1 ? "" : "s"}
      {b.restBetweenExercisesSeconds ? ` · descanso ${b.restBetweenExercisesSeconds}s` : ""}
      {b.restAfterSeconds ? ` · descanso post ${b.restAfterSeconds}s` : ""}
    </div>
  </div>
  {/* 6 botones inline */}
</div>
```
**Problema:** El header de bloque tiene 56 líneas de JSX inline con colores hardcodeados (`rgba(255,142,114,.12)`), iconos condicionales, y 6 botones. Esto debería ser un componente `BlockHeader`.

### Estrategia recomendada
- **Extraer a componentes:** `BlockHeader`, `BlockExercises`, `BlockEmpty`, `WorkoutToolbar`
- **Agregar Preview alumno:** Tab o panel lateral que muestre cómo ve el alumno cada bloque
- **Rediseñar BlockModal:** Selector de patrón primero ("¿Querés un timer? ¿Una lista? ¿Pasadas?") y luego detalles
- **Agregar presets:** Tabata (20/10 · 8 rondas), EMOM (cada minuto), etc.
- **Resumen humano:** "El alumno va a ver: 8 rondas de 20s trabajo + 10s descanso. Total 4 min."
- **Reducir a < 300 líneas** la página principal

---

## 13. Coach — Planes

### Código actual
- **Archivos:** `apps/web/app/coach/planes/page.tsx` + `apps/web/app/coach/planes/[planId]/page.tsx` + `apps/web/app/coach/planes/[planId]/preview/page.tsx`
- **Estructura:** Listado de planes (cards con status) + editor de plan (matriz semana/día) + preview del alumno

### Qué está bien
- **Preview del alumno existe** en planes (a diferencia de workouts)
- Editor de plan con matriz semana/día
- Status de asignación visible
- Cards con progress bar

### Qué falta (Gap vs. Propuesta Pass 5)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Estados claros** (draft / publicado / asignado) | ⚠️ Parcial — existe "borrador" / "publicado" | **Medio** — pero no es el eje de la UI |
| **Checklist de publicación** (preview, notas, coherencia de volumen) | ❌ No existe | **Alto** — el coach puede publicar sin validar |
| **Asignación directa** desde el plan | ⚠️ Botón existe | **Medio** — pero no es el CTA principal |
| **Versionado simple** | ❌ No existe | **Bajo** — cada plan es único, no hay versiones |
| **Vista alumno casi gemela** a la experiencia real | ⚠️ Existe preview | **Medio** — pero no es idéntica a la semana del alumno |
| **Acción principal dominante** | ❌ No existe | **Medio** — el editor tiene muchos CTAs |

### Estrategia recomendada
- Agregar **checklist de publicación** antes de publicar:
  - Vista alumno validada
  - Notas del coach completas
  - Volumen semanal comparable
- Hacer del preview una **experiencia gemela** a la vista del alumno (no aproximada)
- Agregar **status más visible** en el listado (borrador vs publicado)
- CTA principal en editor: "Publicar" o "Asignar a alumno" (según estado)
- Mostrar **cuántos alumnos** usan el plan y en qué semana están

---

## 14. Coach — Mensajes

### Código actual
- **Archivos:** `apps/web/app/coach/mensajes/page.tsx` + `apps/web/app/coach/mensajes/[clientUserId]/page.tsx`
- **Estructura:** Lista de threads + chat individual
- **Features:** SSE, polling, adjuntar sesión

### Qué está bien
- Chat funcional
- Lista de threads con badge de no leídos
- SSE para mensajes en tiempo real

### Qué falta (Gap vs. Propuesta Pass 5)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Contexto del alumno** en el chat (última sesión, plan, adherencia) | ❌ No existe | **Crítico** — el coach entra al chat sin saber el estado del alumno |
| **Quick intents** (seguimiento, felicitación, ajuste, recordatorio) | ❌ No existe | **Alto** — cada mensaje requiere tipear desde cero |
| **Quick replies** (RPE, "Listo", "Dale", "Bajá 2kg") | ❌ No existe | **Alto** — respuestas comunes deberían ser 1 click |
| **Card del entreno adjuntado** | ⚠️ Ref picker existe | **Medio** — pero no es una card rica con contexto |
| **Unificación con feedback post-sesión** | ❌ Son separados | **Crítico** — comentarios de sesión y chat no conversan |

### Estrategia recomendada
- **Sidebar de contexto:** al abrir chat con alumno, mostrar:
  - Plan actual y semana
  - Última sesión y estado
  - Adherencia semanal
  - Energía promedio
- **Quick intents:** "Seguimiento", "Felicitación", "Ajuste", "Recordatorio", "Mandá RPE"
- **Quick replies:** Pills de RPE 6-9, "Dale", "Bajá 2kg", "Mantené reps"
- **Unificar feedback:** Las notas post-sesión del alumno deberían aparecer como mensajes en el chat
- **Card del entreno:** cuando se habla de una sesión, mostrarla como card con ejercicios y sets

---

## 15. Coach — Calendario

### Código actual
- **Archivo:** `apps/web/app/coach/calendario/page.tsx` (391 líneas, **EXCEDE LÍMITE**)
- **Estructura:** Filtros + vista de calendario (día/semana/mes)
- **Estado:** La vista "Mes" tiene un return temprano (no carga datos)

### Qué está bien
- Navegación básica de calendario
- Filtros por alumno

### Qué falta

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Funcionalidad completa** | ⚠️ Vista mes incompleta | **Alto** — no se puede usar la vista mes |
| **Límite de 400 líneas** | ❌ 391 líneas, cerca del límite | **Medio** — necesita extracción |
| **Mobile responsive** | ❌ No adaptado | **Alto** — calendario en mobile es difícil de usar |
| **Integración con operación** (clics que llevan a acción) | ⚠️ Parcial | **Medio** — navega pero no actúa |

### Estrategia recomendada
- Completar vista mes
- Extraer a componentes: `CalendarDay`, `CalendarWeek`, `CalendarMonth`, `CalendarFilters`
- Considerar **simplificar**: en vez de calendario completo, mostrar "Próximas sesiones" o "Agenda de hoy"
- Mobile: lista de eventos en vez de grid de calendario

---

## 16. Gym — Dashboard

### Código actual
- **Archivo:** `apps/web/app/gym/page.tsx` (98 líneas)
- **Estructura:** DesktopShell + grid de 8 cards (Alumnos, Clases, Grupos, Planes, Entrenamientos, Ejercicios, Mensajes, Calendario)
- **Navegación:** Redirige a `/coach/alumnos` para la mayoría

### Qué está bien
- Grid de cards simple
- DesktopShell para gym

### Qué falta (Gap)

| Propuesta | Estado actual | Gap |
|-----------|-------------|-----|
| **Operación real de gym** (clases, asistencia, tele) | ⚠️ Existe `/gym/clases` | **Alto** — pero el dashboard es solo un menú |
| **Dashboard con métricas** (alumnos activos, clases hoy, ingresos) | ❌ No existe | **Alto** — es un menú, no un dashboard |
| **Mobile adaptado** | ⚠️ DesktopShell maneja mobile | **Medio** — pero no hay bottom nav específico de gym |
| **Separación clara de gym vs coach** | ❌ No existe | **Alto** — el gym usa las mismas páginas que el coach |
| **Modo tele** (pantalla para TV) | ✅ Existe `/gym/tele/[classId]` | — Funciona |

### Código problemático
```tsx
// gym/page.tsx:22-94
// 8 cards que todas redirigen a /coach/* o /gym/*
<div onClick={() => router.push("/coach/alumnos")}>Alumnos</div>
<div onClick={() => router.push("/gym/clases")}>Clases</div>
<div onClick={() => router.push("/coach/alumnos/grupos")}>Grupos</div>
<div onClick={() => router.push("/coach/planes")}>Planes</div>
<div onClick={() => router.push("/coach/workouts")}>Entrenamientos</div>
<div onClick={() => router.push("/coach/ejercicios")}>Ejercicios</div>
<div onClick={() => router.push("/coach/mensajes")}>Mensajes</div>
<div onClick={() => router.push("/coach/calendario")}>Calendario</div>
```
**Problema:** El gym no tiene sus propias páginas de operación. Usa las del coach. Esto rompe el modelo mental: un gym no tiene "alumnos" como un coach, tiene "miembros" o "asistentes".

### Estrategia recomendada
- **Gym Dashboard real:** métricas de hoy (clases programadas, asistencia, miembros activos)
- **Gym tiene sus propias páginas:** no redirigir a `/coach/*`
- **Gym nav diferente:** Miembros, Clases, Tele, Reportes, Settings
- **Mobile:** lista de clases de hoy, check-in rápido
- **Tele:** mantener como está (funciona bien)

---

## 17. Transversal — Deuda Técnica UX

### Hallazgos de código

#### 1. Emojis en UI (VIOLACIÓN DURA de DESIGN.md)
```
Archivos afectados:
- apps/web/app/(client)/onboarding/page.tsx — emojis: 🔥💪⚖️🏃⭐🏋️🏋️‍♀️🏠🤸🎯💪🦵🧘❤️
- apps/web/app/(client)/logros/page.tsx — emojis: 🏆🥇🥈🥉
- apps/web/app/(client)/clasificacion/page.tsx — emojis: 🥇🥈🥉
- apps/web/app/(client)/desafios/page.tsx — posiblemente emojis
```
**Impacto:** Rompe consistencia visual, no escala, no es accesible (screen readers), y viola explícitamente DESIGN.md.

#### 2. Colores hardcodeados (VIOLACIÓN de DESIGN.md)
```
- #FF8E72 (warmup) — workouts/[id]/page.tsx
- #FC4C02 (Strava) — completada/page.tsx
- #FFD700, #C0C0C0, #CD7F32 (medallas) — clasificacion/page.tsx
- #fff, #0B0B0C (tele) — tele/[classId]/page.tsx
- #4285F4, #34A853, #FBBC05, #EA4335 (Google) — login/page.tsx
- #FF8E72 (comida) — comida/page.tsx
```
**Impacto:** No se adaptan al tema light/dark, difícil de mantener, inconsistentes.

#### 3. Límites de líneas EXCEDIDOS (VIOLACIÓN de AGENTS.md)
| Archivo | Líneas | Límite | Exceso |
|---------|--------|--------|--------|
| `historial/page.tsx` | 606 | 400 | +206 |
| `comentarios/[sessionId]/page.tsx` | 533 | 400 | +133 |
| `sesion/[sessionId]/page.tsx` | 532 | 400 | +132 |
| `cuenta/page.tsx` | 493 | 400 | +93 |
| `coach/settings/page.tsx` | 475 | 400 | +75 |
| `coach/workouts/[id]/page.tsx` | 416 | 400 | +16 |
| `coach/calendario/page.tsx` | 391 | 400 | -9 |
| `coach/page.tsx` | 358 | 400 | -42 |
| `coach/alumnos/[id]/page.tsx` | 281 | 400 | -119 |

**Impacto:** Dificulta mantenimiento, review, testing, y comprensión del código.

#### 4. Estilos inline masivos
- **100+ matches** de `style={{` en pages
- Casi TODAS las páginas usan estilos inline
- No hay CSS Modules (solo `globals.css` + `<style jsx>`)

**Impacto:** Dificulta cambios globales, inconsistencia, no aprovecha el sistema de diseño.

#### 5. 100% Client Components (sin Server Components)
- Todas las páginas usan `"use client"`
- No hay SSR, no hay streaming, no hay loading states automáticos de Next.js

**Impacto:** Performance subóptima, no aprovecha el App Router.

#### 6. Sin CSS Modules
- Todo estilo es inline o `<style jsx>`
- No hay encapsulación de estilos por componente

**Impacto:** Colisiones de estilos, dificultad para mantener, no aprovecha el bundling de Next.js.

#### 7. Sin tests
- No se encontraron archivos de test
- No hay Storybook para componentes UI

**Impacto:** Regresiones fáciles, refactor riesgoso.

#### 8. Polling en vez de SSE/Socket para todo
- Notificaciones: cada 60s
- Chat: cada 2s (coach), 5s (comentarios)
- Mensajes: SSE (bien)

**Impacto:** Carga innecesaria de servidor, latencia en chat.

---

## Resumen Ejecutivo

### Prioridad Crítica (P0)
1. **Auth con estados visibles** — hoy falla silenciosamente
2. **Builder por patrón + preview alumno** — el coach no entiende qué crea
3. **Coach Alumnos como tablero de triage** — orden alfabético no sirve para operar
4. **Emojis → Icon component** — violación dura de DESIGN.md
5. **Colores hardcodeados → variables CSS** — violación de DESIGN.md
6. **Extracción de pages que exceden 400 líneas** — violación de AGENTS.md

### Prioridad Alta (P1)
7. **Cliente Semana como hero de intención** — briefing editorial + microcopy
8. **Cliente Panel como "Tu día en 20s"** — CTA dominante + quick actions
9. **Cliente Sesión Completada con celebración** — story + next step
10. **Coach Detalle con diagnóstico** — hero de decisión + insights
11. **Mensajes con contexto + quick replies** — chat no es "mensajes", es operación
12. **Wearables con estado y destrabar** — OAuth sin feedback es fricción
13. **Gym con dashboard real** — no es un menú de links

### Prioridad Media (P2)
14. **Calendario coach completo** — vista mes incompleta
15. **CSS Modules en vez de inline** — deuda técnica visual
16. **Server Components donde sea posible** — performance
17. **Tests + Storybook** — calidad a largo plazo

### Métricas de Gap

| Módulo | Gap % | Esfuerzo estimado |
|--------|-------|-------------------|
| Auth | 40% | 2-3 días |
| Cliente Semana | 30% | 3-4 días |
| Cliente Panel | 60% | 4-5 días |
| Cliente Sesión | 25% | 3-4 días |
| Cliente Completada | 45% | 2-3 días |
| Coach Alumnos | 70% | 4-5 días |
| Coach Detalle | 50% | 3-4 días |
| Coach Workouts | 30% | 2 días |
| Coach Builder | 65% | 5-7 días |
| Coach Planes | 25% | 2-3 días |
| Mensajes | 60% | 4-5 días |
| Wearables | 55% | 3-4 días |
| Gym | 80% | 5-7 días |
| Deuda técnica | 40% | 5-7 días |

**Total estimado:** ~60-80 días de trabajo para cerrar todos los gaps.

**Recomendación:** No intentar todo a la vez. El loop principal (Coach programa → Alumno entiende → Alumno ejecuta → Coach interpreta) es lo que más valor genera. Empezar por ahí.

---

*Documentos relacionados:*
- [review-ux.md](review-ux.md)
- [review-ux-deep-dive.md](review-ux-deep-dive.md)
- [review-ux-pass3-solutions.md](review-ux-pass3-solutions.md)
- [review-ux-pass4-vision.md](review-ux-pass4-vision.md)
- [review-ux-pass5-vision.html](review-ux-pass5-vision.html)
- [training-blocks-ux-redesign-plan.md](training-blocks-ux-redesign-plan.md)
