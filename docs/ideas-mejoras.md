# Ideas & Mejas — Hacia una app robusta y sofisticada

> Inspiración: Fuertafit+, Hevy, FitKeeper, Nike Training Club, session runner del repo  
> Foco: UX/UI del entrenamiento + robustez técnica  
> Sin community/social features  
> Fecha: 2026-07-13

---

## Tabla de contenidos

1. [Visión](#visión)
2. [Mejoras de UX/UI al entrenar](#mejoras-de-uxui-al-entrenar)
3. [Mejoras de UX/UI al coach](#mejoras-de-uxui-al-coach)
4. [Mejoras de robustez y sofisticación](#mejoras-de-robustez-y-sofisticación)
5. [Plan de ejecución sugerido](#plan-de-ejecución-sugerido)

---

## Visión

El producto actual combina dos cosas raras de encontrar juntas:
- **Coaching real** (planes hechos por un coach asignado, no catálogo pre-hecho)
- **Tracking sofisticado** (sets, reps, RPE, RIR, timers Tabata/EMOM/AMRAP, Strava/Google Health)

El objetivo es llevar esos dos pilares a un nivel de **detalle y pulido** que se sienta premium sin perder la fluidez. Esto no es añadir features — es profundizar lo que ya existe.

Las apps competidoras (Fuertafit, Freeletics, Hevy) hacen muchas cosas pero poco profundas. La diferencia será **hacer pocas cosas pero con una profundidad obsessed**: el entreno se siente guiado, el coach tiene control fino, el feedback es claro.

---

## Mejoras de UX/UI al entrenar

### 1. Session briefing — "Quest" antes de empezar

**Problema actual**: El usuario abre la sesión y ve una lista de ejercicios. No hay contexto de "qué voy a hacer hoy y por qué".

**Propuesta**:
Antes de la primera serie, mostrar una pantalla de "briefing" full-screen con:
- **Hero card**: "Hoy toca Upper Body · 45 min · Fuerza" + icono de objetivo
- **Timeline visual de bloques**: warmup (5') → fuerza (30') → cardio (10') → cooldown (5')
- **Equipamiento necesario**: "Necesitas: banco, mancuernas, barra" (extraído de los ejercicios)
- **Nota del coach** (si existe): texto o audio inline
- **Racha/día del plan**: "Día 3 de 5 esta semana · Racha 12 días"
- **Single CTA**: "Empezar" (pantalla siguiente: warmup o primer bloque)

**Base técnica**: nuevo componente `_components/session-briefing.tsx` que recorre `sessionDetail.blocks` y agrupa por tipo para la timeline. Datos ya disponibles en `SessionDetail` (`packages/types/index.ts`).

### 2. Macro progress — stepper visible durante toda la sesión

**Problema actual**: El usuario no sabe "voy 3 de 8 ejercicios". No hay sensación de avance.

**Propuesta**:
Barra de progreso sutil fija en la parte superior del runner, entre el header y el contenido:
```
●───●───●───○───○───○───○───○
Warmup  Bench  Row   Press  Curl  Cardio CD
```
- Punto activo = bloque actual
- Puntos completados = fill con `var(--lime)`
- Tooltip con nombre del ejercicio al hacer tap en un punto completado
- No es navegable (evita saltar bloques) pero da noción de cuánto falta

**Base técnica**: nuevo `session-progress-bar.tsx` usando `sessionDetail.exercises` con prop `currentIndex`. CSS con `display: flex` + CSS variables `--lime`/`--text-dim`.

### 3. Rest timer — sofisticado, no solo visual

**Problema actual**: El timer de descanso es un círculo SVG con countdown. No hay feedback háptico, no hay audio, no hay sugerencia inteligente de descanso.

**Propuesta**:

**A. Descanso adaptativo por tipo de ejercicio**
- Fuerza pesada (≥85% 1RM): 3-5 min
- Fuerza moderada (70-85%): 2-3 min
- Hipertrofia (60-70%): 60-90s
- Resistencia/endurance: 30-45s
- Calentamiento: 20-30s

Calcular automáticamente al observar los datos del set anterior. Botón "ajustar" para override manual.

**B. Feedback multi-modal**
- **Haptic** (vibración) en los últimos 3 segundos del descanso: 600ms firm
- **Audio cue**: beep sutil en 5-4-3-2-1 (configurable)
- **Cambio de fase**: tinte del círculo cambia de `--warn` (descansando) a `--lime` (listo)

**C. "Ready early"**: si el usuario toca la pantalla antes de que termine el timer, confirmación "¿Empezar ahora?" con feedback inmediato.

**D. Sugerencia contextual en descanso**:
- "El último set te dejó en RPE 8 →救援 2-3 min"
- "Vas progressing +5% vs última sesión"
- "Próximo: 3x10 Press banca a 60kg"

**Base técnica**: `rest-timer-overlay.tsx` ya existe. Añadir prop `recommendedRestSec` calculada en `use-logger-actions.ts`. Haptic: `navigator.vibrate()` (web API). Audio: small beep via Web Audio API.

### 4. Logger sheet — reducir fricción sin perder detalle

**Problema actual**: `logger-sheet.tsx` es 361 líneas. Para cada set: peso, reps, RPE/RIR. El usuario toca mucho para registrar.

**Propuesta**:

**A. Auto-fill inteligente del siguiente set**
- Al guardar set 2, pre-fill set 3 con el peso + reps del set 2 (porque la mayoría repite)
- Si RPE fue ≥9 en el último set, sugerir bajar 5% en el siguiente (badge "Sugerido -5%")
- Si RPE fue ≤6, sugerir subir 5% (badge "Sugerido +5%")

**B. Quick-log presets**
- "Same as last" (botón grande, 90% de casos)
- "+5%" / "−5%" como chips a un toque
- Edit manual solo para cambios reales

**C. Input UX mejorado**
- Inputs con `inputMode="decimal"` para teclado numérico en mobile
- Tab auto entre peso → reps → RPE → "Guardar"
- "Guardar" button sticky en bottom, accesible sin scroll

**D. Estado por set visible sin expandir**
- Card de cada set con summary inline: `60kg × 10 · RPE 8 ✅`
- Only expand si el usuario quiere editar

### 5. Phase labels explícitos durante ejecución

**Problema actual**: El usuario no sabe si está en "prep", "trabajo" o "descanso" en intervalos.

**Propuesta**:
Banner superior con label grande y color de fase:
- **PREPARACIÓN**: color `--warn`, 10s countdown, "Prepárate..."
- **TRABAJO**: color `--lime`, timer activo, "¡Vamos!"
- **DESCANSO**: color `--info`, timer activo, "Respira..."
- **TRANSICIÓN**: color `--text-dim`, "Siguiente: [ejercicio]"

Label grande (32-48px mobile), centrado, animación de fade entre transiciones.

### 6. Tabata / EMOM / AMRAP — enrichcer la experiencia guiada

**Problema actual**: Los runners (tabata, amrap, circle-timer) son visuales pero mudos.

**Propuesta**:

**A. Audio coach opcional**
- "3, 2, 1, go!" al empezar trabajo
- "Rest 10 seconds" al empezar descanso
- "Round 5 of 8" al empezar cada ronda
- Voz sintetizada via Web Speech API (gratis, sin assets) o pre-recordada

**B. Visual cues más claros**
- En Tabata: color de background hace flash entre work (`--lime`) y rest (`--bg-2`) para feedback periférico
- En EMOM: contador de segundos del minuto, barra horizontal de "cuánto del minuto quedó"
- En AMRAP: contador de rondas visible, botón "marca ronda" para autologgear

**C. Ejercicio visible durante el intervalo**
- Durante "REST" mostrar: "Siguiente: [Nombre] [Foto thumbnail]"
- Durante "WORK" mostrar: [Nombre] + set actual + video de referencia (auto-play muted)

### 7. Completada — momento emocional y puente

**Problema actual**: "Guardar y cerrar sesión" ya mejora, pero sigue siendo un form técnico sin celebración.

**Propuesta**:

**A. Resumen stats visuales**
- Volumen total: "2,340 kg movidos" (sumatoria de peso × reps)
- Duration real: "38 min"
- Intensidad promedio: "RPE 7.5"
- +5% vs última sesión del mismo workout → arrow up verde

**B. Achievement del momento**
- Si marcó PR (personal record): confetti animation
- Si completó todos los sets: "Perfect form" badge
- Si incrementó peso: "Strength up" badge
- Usar `canvas-confetti` (ya en deps) para celebraciones pequeñas

**C. Next step CTA claro**
- Card grande: "Bien hecho. Volvé mañana."
- Link: "Ver semana" / "Ver progreso" / "Contar al coach"
- Si plan tiene mañana: "Mañana: [siguiente workout]"

**D. Feedback guiado (RPE de sesión)**
- Pill selector de RPE overall de la sesión (1-10)
- Optional text field "¿Cómo te sentiste?" → send al coach como comentario

### 8. Warmup como primera clase

**Problema actual**: El warmup es un overlay separado, casi apendice. Se confunde con el logger.

**Propuesta**:
- Warmup es un bloque más del plan, no un overlay especial
- Vista del warmup: lista de movilizaciones con GIF/video corto + timer por ejercicio
- "Done" automático al terminar el tiempo (sin loggear sets)
- Progress bar del warmup separada (más corta, menos prominente)
- Se puede saltar con confirmación ("¿Saltar calentamiento?")

### 9. Exercise swap inteligente

**Problema actual**: "Cambiar" es un botón confuso. El usuario no sabe si cambia ejercicio, peso, etc.

**Propuesta**:
- Rename a "Alternativas" con icono de swap
- Mostrar **antes** de abrir el logger: como chip visible en la card del ejercicio
- Lista de alternativas con: nombre, foto, músculo principal, equipamiento
- Tag "Recomendado por coach" si el coach lo marcó como alternativa preferida
- Badge "Mismo equipamiento" vs "Cambio de equipo"

**Base técnica**: `WorkoutExerciseAlternative` ya existe en Prisma. Solo hay que exponer las alternativas en el session runner.

### 10. Endurance sin Strava — modo manual

**Problema actual**: El endurance view depende de Strava. Si no está conectado, no hay experiencia.

**Propuesta**:
- Si Strava no conectado: timer manual + input de distancia/duración al finalizar
- "Connected later": opción de linkear Strava desde aquí, post-completado
- GPS track opcional: usar `navigator.geolocation` para trackear distancia en vivo (sin Strava)

### 11. Offline first de verdad

**Problema actual**: Hay un offline queue banner pero no precarga.

**Propuesta**:
- Al abrir `/semana` → service worker precarga workout templates + exercise media de la semana
- En `/sesion` → todo funciona sin internet (sets se guardan en IndexedDB y sync al volver)
- Indicator sutil: "Offline · guardando localmente" (no un banner enorme)
- Auto-sync al reconectar: indicador "3 sets pendientes → syncing..." (toast)

**Base técnica**: IndexedDB (via `idb` o raw). Service Worker ya parcialmente registrado en `layout.tsx`.

---

## Mejoras de UX/UI al coach

### 12. Builder con "Vista alumno" persistente

**Problema actual**: El coach edita workouts a ciegas. No sabe cómo lo verá el alumno.

**Propuesta**:
- Toggle sticky arriba: "Editar | Vista alumno"
- Vista alumno = render del workout con el mismo componente que usa `/sesion/[sessionId]/_components/` (session briefing preview)
- En desktop: split view ( editor izquierda, preview derecha)
- En mobile: tabs (uno a la vez)
- El preview se actualiza en vivo al editar (debounced 300ms)

### 13. Plan editor — vista dual estructura/detalle

**Problema actual**: El grid del plan es denso. Ver estructura y detalle a la vez es difícil.

**Propuesta**:

**A. Zoom levels**
- "Vista estructura": solo semanas + bloques (cards pequeñas, sin ejercicios)
- "Vista detalle": semanas + workouts + ejercicios expandibles
- "Vista alumno": preview de cómo lo ve el cliente

**B. Quick actions en celda** (menos clicks)
- Tap celda → menu inline: "Asignar workout | Clear | Duplicar | Nota"
- No context menu flotado (frágil con `window.innerWidth`)

**C. Drag entre días**
- Long-press en celda → drag a otro día (cambia `dayOfWeek`)
- Feedback visual: celda origen atenuada, celda destino highlight

### 14. Alumno detail — "Diagnóstico" arriba de los tabs

**Problema actual**: 7 tabs planos (overview, sessions, progress, metrics, health, food, goals). El coach ve data pero no "qué hacer con esta persona".

**Propuesta**:

**A. Hero diagnosis card** (siempre visible arriba):
- Adherencia: "85% (3 semanas)" con trend
- Última sesión: "Hace 2 días · Upper Body · RPE 8"
- Próxima sesión: "Mañana · Lower Body"
- Risk signal: "Sin actividad 5+ días" / "RPE subiendo 3 sesiones seguidas" → color `--warn`
- Inline CTA: "Mensaje" | "Ajustar plan" | "Ver última sesión"

**B. Reordenar tabs por frecuencia de uso**:
1. Sesiones recientes (lo más usado)
2. Resumen (overview)
3. Progreso
4. Métricas
5. Salud
6. Comida
7. Objetivos

**C. Reducir a 5 tabs**: combinar metrics+health en "Salud", combinar progress+goals en "Progreso"

### 15. Batch operations para coach

**Problema actual**: No hay operaciones en lote.

**Propuesta**:
- Alumno list: multi-select → "Asignar plan a 5" | "Enviar mensaje a 3"
- Plan list: "Duplicate plan" | "Archive plan"
- Workout list: "Duplicate" (ya existe en backend) | "Delete" con confirm

---

## Mejoras de robustez y sofisticación

### 16. Precarga y caché de workout media

**Problema actual**: La media (fotos/videos) carga on-demand. En gym con mala señal, lag.

**Propuesta**:
- Service Worker cachea `ExerciseMedia` para los workouts de la semana actual al abrir `/semana`
- `cacheFirst` strategy para fotos/videos de ejercicio
- Background sync: si una foto falla, retry en siguiente online
- Mostrar skeleton blur-up mientras carga: placeholder con blur de la imagen anterior

**Base técnica**: SW ya registrado en `layout.tsx`. Falta `precarga` route y estrategia `cacheFirst` para assets.

### 17. Undo / redo en el builder

**Problema actual**: Si el coach borra un bloque por error, no hay undo.

**Propuesta**:
- Command pattern en `use-plan-editor.ts`: `addBlock`, `deleteBlock`, `reorderBlock` como comandos reversibles
- Stack de undo/redo (max 20 acciones)
- Botón "Deshacer" sutil en toolbar + atajo `Cmd+Z` / `Ctrl+Z`
- Toast de confirmación al borrar: "Bloque eliminado · [Deshacer]"

### 18. Autoguardado en el plan editor

**Problema actual**: El coach debe guardar manualmente. Si se va sin guardar, pierde cambios.

**Propuesta**:
- Debounced auto-save cada cambio (2 segundos sin actividad)
- Indicator sutil en header: "Guardando..." → "Guardado ✓" → nada
- Quit prompt: `beforeunload` solo si hay cambios no guardados (raro con auto-save)
- Mockup: badge en header "Guardado hace 5s"

### 19. Search global con atajo

**Problema actual**: No hay search. El coach navega menús para encontrar un alumno, plan o exercise.

**Propuesta**:
- `Cmd+K` / `Ctrl+K` abre palette de search
- Busca: alumnos, planes, workouts, ejercicios
- Resultados agrupados por tipo con icono
- Enter navega al primer resultado
- Para coach: "[Alumno] Juan Pérez > ver detalle"
- Para cliente: no se aplica (solo entrena)

### 20. Timeline de progreso visual (no tablas)

**Problema actual**: `/progreso` muestra tablas y números. Mucho texto.

**Propuesta**:
- Sparklines por ejercicio: serie temporal de volumen/1RM
- Heatmap de consistencia: "365 grid" con color por intensidad de día (GitHub-style contribution graph)
- Muscle map: body silhouette con músculos coloreados por volumen accumulated
- PR timeline: cuando se alcanzaron PRs, con animación al cargar

### 21. Notificaciones contextuales — no genéricas

**Problema actual**: Las notificaciones son tipo-based (new_message, session_completed) pero sin contexto.

**Propuesta**:
- "Juan completó Upper Body con RPE 9 → [Ver]"
- "María no training 3 días → [Mensaje]"
- "Carlos incrementó 5% en bench → [Ver sesión]"
- El payload de `notify()` ya incluye `linkUrl` pero falta `contextData`. Schema: `context JSONB` en `Notification` model.

### 22. Tema del coach — branding personalizado

**Problema actual**: Todos los coach ven la misma UI sin identidad.

**Propuesta**:
- Coach puede subir logo + color de acento
- Alumnos ven el color del coach al entrar al plan
- Generar sensación de "mi coach" vs "app genérica"
- `CoachProfile` model ya tiene `displayName` → añadir `accentColor` y `logoUrl`

### 23. Planing inteligente — sugerencias de progresión

**Problema actual**: El coach debe calcular manualmente cuánto subir/bajar de peso.

**Propuesta**:
- En el plan editor, al asignar un workout: chip "Sugerir progresión basada en última sesión"
- Calcula: si la última vez hizo 60kg × 10 RPE 8, sugiere 62.5kg × 10 o 60kg × 12
- Inline en el `plan-grid-cell.tsx`: row expand'a mostra la progresión sugerida
- No es automático — es un atajo para que el coach decida

### 24. PWA installable desde el browser

**Propuesta**:
- `manifest.json` con iconos full-size, nombre "TrainApp", `display: standalone`
- Prompt de instalación en mobile: "Instalar app" banner si visitas 3+ veces
- Los shortcuts del manifest: "Empezar sesión de hoy" / "Ver semana" como atajos desde home screen

### 25. Accent token system unificado

**Problema actual**: 74 hardcodes de `#0B0B0C` como "texto sobre lime".

**Propuesta**:
```css
:root {
  --text-on-accent: var(--bg);
  --text-on-accent-dim: var(--text-dim);
  --accent: var(--lime);
  --accent-hover: var(--lime-600);
  --accent-soft: var(--lime-200);
}
```

Reemplazar todos los `#0B0B0C` con `var(--text-on-accent)`, todos los `#fff` en media viewers con `var(--text)`. Esto automaticamente arregla el light mode en esos componentes.

### 26. Focus-visible polishes

**Problema actual**: No hay focus-visible styles consistentes. Navegación con teclado es invisible.

**Propuesta**:
```css
*:focus-visible {
  outline: 2px solid var(--lime);
  outline-offset: 2px;
}
button:focus-visible, a:focus-visible {
  box-shadow: 0 0 0 3px rgba(215, 255, 58, 0.3);
}
```

Aplicar global en `globals.css`. Costo: 5 línas, impacto: enorme.

### 27. Empty states con intención

**Problema actual**: `StateBlock` muestra solo título + body. Si no hay sesiones, dice "No hay sesiones" a secas.

**Propuesta**:
- "No tenés sesiones esta semana todavía" + ilustración + CTA "Hablar con el coach"
- "No encontramos exercises para este filtro" + CTA "Limpiar filtros"
- "Todavía no conectaste tu wearable" + ilustración + CTA "Conectar Strava"

### 28. Microinteractions que comunican

**Patrones que se pueden aplicar:**

- **Guardar button**: estado loading → estado success → reset. Micro-animation: "Guardado ✓" desaparece a los 2s.
- **Long-press en card de exercise**: feedback háptico + menú contextual (sin lib, solo `touchstart` + timeout 500ms)
- **Pull to refresh** en listas (historial, planes): refresh manual cuando no hay auto-refresh
- **Sheet snap**: `logger-sheet` snap a 3 alturas (peek 25%, half 50%, full 90%) con animación spring (CSS only)
- **Toast undo**: cuando borras algo, toast con botón "Deshacer" que restaura la acción

---

## Plan de ejecución sugerido

### Sprint A — Session experience (2-3 semanas)

- [x] Session briefing con timeline visual
- [x] Macro progress bar en runner
- [x] Rest timer adaptativo + haptic + sugerencia contextual
- [x] Phase labels explícitos (PREP / WORK / REST / TRANSITION)
- [x] Logger quick-log presets ("Same as last", "+5%", "−5%")
- [x] Completada con stats + celebration + next step

### Sprint B — Coach experience (2-3 semanas)

- [x] Builder con "Vista alumno" (toggle Editar | Vista alumno)
- [x] Alumno detail: diagnosis hero + tabs (Entrenos primero)
- [x] Plan editor: zoom levels (estructura / detalle / vista alumno)
- [x] Undo/redo en builder + plan editor
- [x] Autoguardado visible en plan editor (estado Guardando/Guardado)
- [x] Batch select en alumnos list (selección + acciones 1:1)

### Sprint C — Robustness (2-3 semanas)

- [x] SW precarga de media para la semana
- [x] Offline-first en `/sesion` (IndexedDB)
- [x] Auto-fill inteligente del siguiente set
- [x] Exercise swap como chip pre-logger
- [x] Endurance sin Strava (modo manual + GPS opcional)
- [x] Empty states con intención + CTA

### Sprint D — Sofisticación (1-2 semanas)

- Search global `Cmd+K`
- Notificaciones contextuales con `contextData`
- PWA installable
- Accent token system unificado (74 hardcodes)
- Focus-visible global
- Microanimations de guardar/undo/toast
- Pull to refresh en listas
- Logger sheet snap

### Incrementales (sin fecha)

- Audio coach en interval timers (Web Speech API)
- Timeline de progreso visual (sparklines, heatmap)
- Coaching inteligente sugerido progresión por exercise
- Warmup como primera clase (sin overlay)
- Batch operations para coach
- Coach branding (accent color, logo)

---

## Medidas de éxito (target post-implementación)

| Métrica | Actual | Target |
|---------|--------|--------|
| Taps para registrar un set | 4-5 (peso, reps, RPE, guardar) | 1-2 (con quick-log) |
| "Abrir app → empezar entreno" | ~30s (varias pantallas) | <15s (briefing → CTA directo) |
| Session commencement rate | ? | +30% (briefing emocional) |
| Coach setup time per workout | <30 min | <15 min (preview + autoguardado) |
| Plan editor abandon rate | ? | -50% (autoguardado + undo) |
| Offline usable | Parcial (banner) | 100% core flow |
| Hardcoded colors | 74 | 0 |
| Quick wins accesibilidad | 0 | 100% (focus-visible, role=dialog, aria-live) |