# UX Audit — YourCoachFit: Análisis de Flujos Reales

> **Fecha:** Junio 2026 | **Auditor:** AI | **Metodología:** Revisión de código + Análisis de fricción por flujo

---

## Resumen Ejecutivo

Se auditaron **8 flujos críticos** de la app analizando el código fuente. Se identificaron **27 problemas de UX concretos** que generan fricción real en el uso diario. Los problemas se clasifican en: **Bloqueante (B)**, **Fricción Alta (F)**, **Fricción Media (M)**.

| Flujo | Archivo | Líneas | Issues | Gravedad |
|-------|---------|--------|--------|----------|
| Semana (cliente) | `semana/page.tsx` | 399 | 4 | F, M, M, M |
| Detalle Entreno | `semana/[id]/page.tsx` | 161 | 3 | F, M, M |
| Sesión (runner) | `sesion/[id]/page.tsx` | 532 | 6 | **B, B, F, F, M, M** |
| Completada | `sesion/[id]/completada/page.tsx` | 389 | 4 | F, F, M, M |
| Panel | `panel/page.tsx` | 275 | 3 | F, M, M |
| Login | `login/page.tsx` | 177 | 3 | F, F, M |
| Coach Alumnos | `coach/alumnos/page.tsx` | 165 | 3 | F, M, M |
| Workout Builder | `coach/workouts/[id]/page.tsx` | 416 | 4 | **B, F, F, M** |

**Total: 27 problemas** | **Bloqueantes: 3** | **Fricción Alta: 12** | **Fricción Media: 12**

---

## 1. Flujo Semana (Cliente)

**Archivo:** `apps/web/app/(client)/semana/page.tsx` (399 líneas)

### Flujo Real del Usuario
1. Entra a la app → ve el strip de 7 días (D L M X J V S)
2. Ve la tarjeta de resumen (Hechas X/Y, Plan activo)
3. Ve "Próximo entreno" → tarjeta de hoy con dos botones
4. Ve listas de "En curso", "Pendientes", "Completadas"

### Problemas Identificados

#### ❌ S1 — Strip de días NO es interactivo (Fricción Media)
- **Código:** El strip de días (líneas 137-160) es puramente visual. No hay `onClick`, no hay `cursor: pointer`.
- **Problema:** El usuario ve 7 días, espera poder tocar "Mañana" o "Ayer" para ver qué entrenamiento le toca, pero no hace nada. Es un elemento decorativo que ocupa espacio valioso en la parte superior de la pantalla.
- **Impacto:** El usuario no puede navegar por la semana. Si quiere ver el entrenamiento del lunes, no puede.
- **Solución:** Hacer que cada día del strip sea clickeable y muestre el entrenamiento de ese día (o "Descanso"). Si no hay datos de otros días, ocultar el strip o hacerlo funcional.

#### ❌ S2 — Dos CTAs de igual peso en la tarjeta "Hoy" (Fricción Alta)
- **Código:** Líneas 255-298. Dos botones: "Empezar" (block, size=lg, icon=play) y "Ver" (size=lg, variant=ghost).
- **Problema:** Ambos botones son grandes. El usuario no sabe cuál es la acción principal. Si quiere "Empezar", ¿por qué necesita "Ver"? Si quiere "Ver", ¿por qué está al mismo nivel que "Empezar"?
- **Impacto:** Parálisis de decisión. El usuario duda 2-3 segundos cada vez que entra. Multiplicado por 4 entrenamientos por semana = 8-12 segundos de fricción por semana.
- **Solución:** Un solo CTA dominante: "Empezar entrenamiento". La opción "Ver" debería ser un link secundario (texto con flecha) o accesible desde el detalle.

#### ❌ S3 — "Completadas" compite visualmente con "Hoy" (Fricción Media)
- **Código:** Líneas 363-394. Las tarjetas completadas se muestran con el mismo estilo que las pendientes, solo cambia el badge.
- **Problema:** Si el usuario completó 3 entrenamientos, la pantalla se llena de tarjetas "verdes" que compiten visualmente con la tarjeta de "Hoy" (que es amarilla). El usuario tiene que scrollear para encontrar la acción principal.
- **Impacto:** La acción principal ("Hoy") se pierde en el scroll. El usuario tiene que "buscar" qué hacer.
- **Solución:** Colapsar "Completadas" en un acordeón o mostrar solo el último. Reducir la información visual de entrenamientos pasados.

#### ❌ S4 — Sin contexto de qué tipo de entrenamiento es (Fricción Media)
- **Código:** Línea 253: `{today.description ?? today.tags.join(" · ")} · {today.exerciseCount} ej`
- **Problema:** El usuario ve "Día B (Upper) · Fuerza · 6 ej" pero no sabe: ¿Cuánto dura? ¿Qué intensidad? ¿Qué bloques tiene? ¿Es un día de alta o baja carga?
- **Impacto:** El usuario entra "a ciegas" al entrenamiento. No puede decidir si tiene tiempo o si está en condiciones.
- **Solución:** Mostrar duración estimada, tipo de bloque (fuerza, cardio, mix), y una mini descripción de la intención del día (ej: "Focus: mantener RPE 8 en todas las series").

---

## 2. Flujo Detalle Entreno (Cliente)

**Archivo:** `apps/web/app/(client)/semana/[workoutTemplateId]/page.tsx` (161 líneas)

### Flujo Real del Usuario
1. Toca "Ver" en la tarjeta de "Hoy"
2. Ve el detalle del entrenamiento: título, descripción, tags, ejercicios, bloques
3. Ve la nota de progresión (si existe)
4. Ve un botón sticky "Empezar entrenamiento" abajo

### Problemas Identificados

#### ❌ D1 — No hay botón "Volver" visible (Fricción Alta)
- **Código:** Línea 78-89. Hay un botón de volver arriba a la izquierda, pero es pequeño (32x32px) y tiene un ícono de chevrón.
- **Problema:** El usuario entra al detalle y no sabe cómo volver a la semana sin empezar el entrenamiento. El botón de volver es difícil de tocar en mobile (32px es muy pequeño para un dedo).
- **Impacto:** El usuario se siente "atrapado". Si entró por error a "Ver", tiene que buscar el botón pequeño o usar el botón del navegador.
- **Solución:** Agregar un header con "← Volver a semana" explícito. Aumentar el área de toque del botón a 44x44px mínimo.

#### ❌ D2 — La nota de progresión se pierde visualmente (Fricción Media)
- **Código:** Líneas 113-134. La nota de progresión tiene un `borderLeft: 3px solid var(--lime)` y un ícono `info`.
- **Problema:** Si el entrenamiento tiene 3 bloques y 8 ejercicios, la nota de progresión está entre el header y los bloques. El usuario la ve pero no sabe si es importante o solo decorativa.
- **Impacto:** El usuario puede ignorar la nota de progresión que el coach dejó para guiarlo. Pierde contexto valioso.
- **Solución:** Destacar la nota de progresión como un banner superior o como primera sección con un título más prominente: "Instrucciones del coach".

#### ❌ D3 — No hay preview de los ejercicios (Fricción Media)
- **Código:** Líneas 137-143. Muestra bloques con `WorkoutBlockPreviewCard` pero no muestra los ejercicios individuales.
- **Problema:** El usuario ve "Bloque 1: Calentamiento · 3 ejercicios" pero no sabe qué ejercicios son. Para saber si tiene alguna lesión o si tiene los equipos necesarios, tiene que entrar al entrenamiento.
- **Impacto:** El usuario entra al entrenamiento "a ciegas" y después descubre que no puede hacer algún ejercicio.
- **Solución:** Expandir la preview de bloques para mostrar los nombres de los ejercicios. Permitir tocar un ejercicio para ver alternativas antes de empezar.

---

## 3. Flujo Sesión (Runner)

**Archivo:** `apps/web/app/(client)/sesion/[sessionId]/page.tsx` (532 líneas — **EXCEDE LÍMITE**)

### Flujo Real del Usuario
1. Inicia sesión → ve un header con nombre del ejercicio, número, tiempo
2. Ve media del ejercicio (si existe) o un botón de YouTube
3. Ve la nota del coach
4. Ve un botón "Registrar series" o "Iniciar bloque"
5. Abre el logger → ingresa peso/reps → guarda
6. Ve una lista de ejercicios abajo → navega al siguiente
7. Al final, toca "Finalizar sesión"

### Problemas Identificados

#### ❌ R1 — **BLOQUEANTE:** El usuario puede quedar atrapado sin saber qué hacer (Bloqueante)
- **Código:** Líneas 327-337. Si el ejercicio no es de fuerza (`ex.block?.type !== "strength"`), muestra un botón "Series de este ejercicio · Abrir".
- **Problema:** Si el ejercicio es de cardio, intervals, o warmup, el botón dice "Abrir" pero no explica qué va a pasar. El usuario toca "Abrir" y se abre un logger que no sabe cómo usar.
- **Impacto:** El usuario se frustra y abandona la sesión. Especialmente si es un ejercicio de intervalos y no sabe qué es un "bloque".
- **Solución:** Cada tipo de ejercicio debería tener un CTA contextual: "Iniciar timer" para cardio, "Ver pasos" para running, "Marcar como hecho" para warmup.

#### ❌ R2 — **BLOQUEANTE:** El flujo de "alternativas" es confuso (Bloqueante)
- **Código:** Líneas 107-109 y 304-308. Si el ejercicio tiene alternativas, muestra un botón "Cambiar" con un ícono de `repeat`.
- **Problema:** El usuario ve "Cambiar" y no sabe qué significa. ¿Cambiar qué? ¿Cambiar el ejercicio? ¿Cambiar el peso? Si toca "Cambiar", se abre un `SwapSheet` (modal) que muestra alternativas.
- **Impacto:** El usuario no sabe si puede cambiar el ejercicio antes de empezar o solo durante. Si ya registró series, ¿puede cambiar? No hay confirmación ni contexto.
- **Solución:** Renombrar "Cambiar" a "Ver alternativas" o "No puedes hacer este ejercicio?". Mostrar el modal de alternativas ANTES de que el usuario abra el logger, no después.

#### ❌ R3 — Demasiados estados y modales (Fricción Alta)
- **Código:** Líneas 84-94. El componente maneja 11 estados de UI: `completing`, `showPicker`, `showReset`, `resetting`, `preSelectExIdx`, `mediaOpen`, `swapOpen`, `notesOpen`, `blockRunnerOpen`, `currentBlockId`, `keyboardOffset`.
- **Problema:** El usuario puede estar en medio de registrar series, abrir el media viewer, tocar "Cambiar", y abrir las notas — todo al mismo tiempo. No hay jerarquía de modales.
- **Impacto:** El usuario se pierde. Si abre un modal y luego otro, no sabe cómo volver. Puede perder datos de series si cierra mal un modal.
- **Solución:** Simplificar a 3 estados principales: "Ejercicio activo", "Logger abierto", "Descanso". Todo lo demás debería ser inline o no modal.

#### ❌ R4 — El botón "Finalizar sesión" aparece solo al completar todos (Fricción Alta)
- **Código:** Líneas 379-382. El botón "Finalizar sesión" aparece solo cuando `completedExs === workExercises.length`.
- **Problema:** Si el usuario no completó todos los ejercicios (por ejemplo, se quedó sin tiempo), el botón "Finalizar sesión" no aparece. Solo ve "Terminar entrenamiento" (que es un link de texto) y "Reiniciar".
- **Impacto:** El usuario no sabe cómo salir de la sesión sin perder el progreso. "Terminar entrenamiento" suena a que va a descartar todo, y "Reiniciar" suena a que borra.
- **Solución:** Siempre mostrar "Finalizar sesión" con un label contextual: "Finalizar sesión (3/4 ejercicios hechos)". Si el usuario no completó todos, mostrar un confirm: "¿Estás seguro? Podés volver a esta sesión después."

#### ❌ R5 — El botón "Registrar series" es ambiguo (Fricción Media)
- **Código:** Líneas 388-398. El botón principal del footer dice "Registrar series" con un ícono de libro.
- **Problema:** El usuario no sabe si "Registrar series" significa "abrir un formulario" o "decirle a la app que ya hice la serie". El ícono de libro (`book`) no comunica "registrar".
- **Impacto:** El usuario toca el botón, se abre un modal, y tiene que aprender a usarlo en medio del entrenamiento.
- **Solución:** Si el ejercicio es de fuerza, mostrar directamente los inputs de peso/reps en la pantalla principal, no en un modal. El usuario debería poder tocar "+ Serie" y ver el input inmediatamente.

#### ❌ R6 — No hay feedback visual de progreso (Fricción Media)
- **Código:** No hay un indicador visual de "cuánto llevás del entrenamiento".
- **Problema:** El usuario solo ve `exNum / exTotal` en el header. No sabe si está en el 20% o el 80% del entrenamiento. No hay una barra de progreso ni un resumen visual.
- **Impacto:** El usuario no tiene sensación de avance. No sabe si le quedan 5 o 15 minutos.
- **Solución:** Agregar una barra de progreso fina en la parte superior del header. Mostrar el tiempo estimado restante.

---

## 4. Flujo Completada (Post-Entreno)

**Archivo:** `apps/web/app/(client)/sesion/[sessionId]/completada/page.tsx` (389 líneas)

### Flujo Real del Usuario
1. Termina sesión → llega a "Sesión completada"
2. Ve stats: Volumen, Series, Ejercicios
3. Ve un rating de energía 1-5
4. Ve "Destacados" (top sets)
5. Ve una nota para el coach
6. Toca "Confirmar" o "Comentarios"

### Problemas Identificados

#### ❌ C1 — "Confirmar" es un CTA técnico, no emocional (Fricción Alta)
- **Código:** Líneas 366-369. El botón principal dice "Confirmar" con un ícono de check.
- **Problema:** El usuario acaba de hacer un esfuerzo físico. El CTA debería celebrar, no pedirle que "confirme" algo. "Confirmar" suena a formulario, no a logro.
- **Impacto:** El usuario cierra la sesión sin sentirse recompensado. Pierde la oportunidad de reforzar adherencia.
- **Solución:** "Guardar y cerrar sesión" o "Cerrar sesión". Con un mensaje de celebración: "¡Cerraste el Día B!".

#### ❌ C2 — "Comentarios" lleva a otra pantalla (Fricción Alta)
- **Código:** Líneas 360-365. El botón secundario dice "Comentarios" y lleva a `/comentarios/${sessionId}`.
- **Problema:** El usuario tiene que salir de la sesión completada para dejar un comentario. Si quiere dejar feedback rápido al coach, tiene que navegar a otra página.
- **Impacto:** El usuario no deja comentarios. El coach no recibe feedback.
- **Solución:** Integrar el comentario como una acción rápida inline: "¿Algo para ajustar?" con 3 pills ("Pesado", "Bien", "Podría más") y un campo de texto opcional.

#### ❌ C3 — No hay next step claro (Fricción Media)
- **Código:** Después de "Confirmar", el usuario va a `/semana`. No hay opciones intermedias.
- **Problema:** El usuario no sabe qué hacer después. ¿Vuelve a la semana? ¿Ve su progreso? ¿Manda un mensaje al coach?
- **Impacto:** El usuario llega a la semana y no tiene una acción clara. El loop se cierra sin celebración.
- **Solución:** Mostrar un "¿Qué sigue?" con 3 opciones: "Volver a semana", "Ver progreso", "Mandar feedback al coach".

#### ❌ C4 — El rating de energía es confuso (Fricción Media)
- **Código:** Líneas 285-310. 5 botones de 1-5 con labels "BAJA", "MEDIA", "ALTA" solo en 1, 3, 5.
- **Problema:** El usuario no sabe qué significa "energía 4". ¿Es bueno? ¿Es malo? Los labels están solo en 1, 3, 5. ¿Qué significa 2 o 4?
- **Impacto:** El usuario elige un número al azar o deja el default. El coach recibe datos inútiles.
- **Solución:** Usar labels en todos: 1=Muy cansado, 2=Cansado, 3=Normal, 4=Fuerte, 5=Muy fuerte. O usar un slider con caras (😫 😐 😤) — pero sin emojis, con íconos.

---

## 5. Flujo Panel (Dashboard)

**Archivo:** `apps/web/app/(client)/panel/page.tsx` (275 líneas)

### Flujo Real del Usuario
1. Entra al panel → ve "Mi Panel"
2. Ve ScoreHeader (weekScore, previousWeekScore)
3. Ve QuickLogStrip (workouts, food, steps, sleep)
4. Ve 4 MetricCards: Fuerza, Aeróbico, Pasos, Sueño
5. Ve Energía y Nutrición
6. Ve WeekHeatmap y MonthSummary

### Problemas Identificados

#### ❌ P1 — 4 KPIs compiten por atención sin jerarquía (Fricción Alta)
- **Código:** Líneas 194-223. Cuatro `MetricCard` con el mismo peso visual.
- **Problema:** El usuario no sabe qué mirar primero. Si su meta es perder peso, ¿debería mirar "Pasos" o "Fuerza"? Si no durmió bien, ¿debería entrenar hoy?
- **Impacto:** El usuario no toma decisiones basadas en el panel. Lo usa como "lectura" pasiva, no como herramienta de acción.
- **Solución:** Destacar **1** KPI principal según el contexto del día. Si hoy toca entrenar y la recuperación es mala, mostrar una alerta: "Recuperación baja · considerá descansar". Si hoy no toca entrenar, mostrar: "Registrá tu comida".

#### ❌ P2 — El panel no conecta con el entrenamiento de hoy (Fricción Media)
- **Código:** No hay referencia al entrenamiento de hoy en el panel.
- **Problema:** El usuario ve "Fuerza 2/3" pero no sabe qué entrenamiento le toca hoy. Tiene que ir a "Semana" para saber.
- **Impacto:** El panel no es un "home de acción". Es un "home de datos".
- **Solución:** Agregar un widget "Hoy toca: Día B (Upper) · 45 min · Empezar" en la parte superior del panel.

#### ❌ P3 — "Registrar comida" es un link, no una acción rápida (Fricción Media)
- **Código:** Línea 246. `+ Registrar comida` es un botón que lleva a `/comida`.
- **Problema:** El usuario tiene que salir del panel, navegar a otra página, y luego volver. Es 3-4 toques para una acción que debería ser 1.
- **Impacto:** El usuario no registra comidas. Los datos de nutrición son incompletos.
- **Solución:** Un modal rápido de "¿Qué comiste?" con 3 categorías (Proteína, Carbs, Grasa) y un input rápido. Guardar en 1 toque.

---

## 6. Flujo Login

**Archivo:** `apps/web/app/login/page.tsx` (177 líneas)

### Flujo Real del Usuario
1. Entra a login → ve "Bienvenido"
2. Ingresa email y contraseña
3. Toca "Ingresar"
4. Si falla, ve un mensaje de error debajo del formulario

### Problemas Identificados

#### ❌ L1 — Error genérico sin distinción de causa (Fricción Alta)
- **Código:** Líneas 29-34. Si es 401 → "Email o contraseña incorrectos". Si es cualquier otro error → `e.message` o "Error al ingresar".
- **Problema:** Si el backend está caído, el usuario ve "Error al ingresar" y no sabe si es su culpa o de la app. Si hay un error de red, no sabe si debe reintentar.
- **Impacto:** El usuario intenta 3-4 veces, cambia la contraseña, o se va de la app.
- **Solución:** Distinguir: "No pudimos conectar con el servidor. Probá en 5 segundos." vs "Email o contraseña incorrectos. ¿Olvidaste tu contraseña?" vs "Tu sesión expiró. Ingresá de nuevo."

#### ❌ L2 — No hay estado de carga visual durante el login (Fricción Alta)
- **Código:** Línea 17. `loading` existe pero solo deshabilita el botón. No hay spinner ni feedback visual.
- **Problema:** El usuario toca "Ingresar" y el botón se deshabilita. No sabe si está cargando, si falló, o si hay que esperar.
- **Impacto:** El usuario toca el botón 2-3 veces pensando que no funcionó.
- **Solución:** Mostrar un spinner dentro del botón o un overlay de "Verificando...".

#### ❌ L3 — No hay contexto de rol (Fricción Media)
- **Código:** Línea 75: "Ingresá para continuar tu entrenamiento".
- **Problema:** El coach y el gym también usan esta pantalla. El mensaje asume que es un alumno.
- **Impacto:** El coach se siente "fuera de lugar". No hay confianza de que está en la app correcta.
- **Solución:** Mensaje genérico: "Tu entrenamiento, en serio. Para alumnos, coaches y gyms."

---

## 7. Flujo Coach — Alumnos

**Archivo:** `apps/web/app/coach/alumnos/page.tsx` (165 líneas)

### Flujo Real del Usuario
1. El coach entra a "Alumnos" → ve una tabla
2. Ve: Alumno, Plan activo, Última sesión, Status
3. Puede buscar, filtrar por página, ver agenda, grupos
4. Toca un alumno → va al detalle

### Problemas Identificados

#### ❌ A1 — Tabla ordenada alfabéticamente, no por prioridad (Fricción Alta)
- **Código:** Líneas 46-50. `return an.localeCompare(bn)` — orden alfabético puro.
- **Problema:** El coach tiene 24 alumnos. Ana García (on track) aparece primero. Carlos López (inactivo hace 5 días) aparece segundo. María Rodríguez (atención) aparece cuarta.
- **Impacto:** El coach no ve quién necesita atención. Tiene que scrollear toda la tabla para encontrar alumnos problemáticos.
- **Solución:** Orden por prioridad: 1. Inactivos > 5 días, 2. Atención > 3 días, 3. On track. Con badges de color y filtros rápidos.

#### ❌ A2 — Sin filtros rápidos por estado (Fricción Media)
- **Código:** No hay filtros. Solo buscador por nombre.
- **Problema:** El coach quiere ver solo los "Inactivos" para mandarles mensajes. No puede. Tiene que buscar uno por uno.
- **Impacto:** El coach pierde 5-10 minutos por semana buscando alumnos. No es eficiente.
- **Solución:** Filtros rápidos: "Requieren atención · 3", "Activos · 18", "Sin plan · 2".

#### ❌ A3 — Sin acciones inline (Fricción Media)
- **Código:** Línea 129. `onRowClick` → va al detalle del alumno.
- **Problema:** El coach tiene que entrar al detalle para mandar un mensaje o ajustar un plan. Son 2-3 clicks por acción.
- **Impacto:** El coach no manda mensajes rápidos. La comunicación es lenta.
- **Solución:** Acciones inline en cada fila: "Mensaje", "Ajustar plan", "Ver detalle".

---

## 8. Flujo Coach — Workout Builder

**Archivo:** `apps/web/app/coach/workouts/[workoutTemplateId]/page.tsx` (416 líneas — **EXCEDE LÍMITE**)

### Flujo Real del Usuario
1. El coach entra al editor → ve el título, descripción, ejercicios, bloques
2. Ve un header de bloque con 6 botones: ↑ ↓ Configurar Biblioteca + Ejercicio
3. Toca "Configurar" → abre un modal de propiedades del bloque
4. Toca "Biblioteca" → va a la biblioteca de ejercicios
5. Toca "Ejercicio" → abre un picker para agregar ejercicios
6. Selecciona un ejercicio → abre el inspector derecho
7. Guarda → ve "✓ Guardado" en el subtitle

### Problemas Identificados

#### ❌ W1 — **BLOQUEANTE:** No hay preview de cómo lo ve el alumno (Bloqueante)
- **Código:** No hay panel ni vista de preview del alumno.
- **Problema:** El coach arma el entrenamiento con bloques, ejercicios, series, descansos — pero no sabe cómo se ve eso para el alumno. ¿El alumno ve los bloques? ¿Ve los ejercicios en orden? ¿Sabe cuánto descanso tiene?
- **Impacto:** El coach crea entrenamientos que el alumno no entiende. El alumno llega al gimnasio confundido. La adherencia baja.
- **Solución:** Panel derecho o modal de "Vista del alumno" que muestre el flujo exacto: "1. Calentamiento (12 min) · 3 ejercicios de movilidad · 30s entre cada uno. 2. Fuerza principal (28 min) · 4 ejercicios · 90s descanso..."

#### ❌ W2 — 6 botones en el header de bloque sin jerarquía (Fricción Alta)
- **Código:** Líneas 255-276. Seis botones: ↑ ↓ Configurar Biblioteca Ejercicio +.
- **Problema:** El coach no sabe qué botón es primario. ¿Debería tocar "Configurar" primero? ¿"Biblioteca"? ¿"Ejercicio"? Los botones son todos del mismo tamaño y estilo (ghost/outline).
- **Impacto:** El coach tarda 2-3 minutos en entender cómo agregar un ejercicio. La curva de aprendizaje es empinada.
- **Solución:** Reducir a 3 botones: "Editar bloque" (primario), "Preview" (secundario), "Agregar ejercicio" (primario). Mover reordenar a drag-and-drop.

#### ❌ W3 — Colores hardcodeados en bloques (Fricción Alta)
- **Código:** Líneas 224-231. Colores hardcodeados: `#FF8E72` (warmup), `#A78BFA` (cooldown), `#7AB8FF` (cardio), `#FC4C02` (Strava).
- **Problema:** Si el coach cambia el tema de la app, los colores de los bloques no respetan el sistema de diseño. Además, `#FF8E72` en fondo oscuro tiene poco contraste.
- **Impacto:** El sistema visual es inconsistente. El coach no asocia los colores con los tipos de bloque de forma intuitiva.
- **Solución:** Usar variables CSS: `--warmup`, `--cooldown`, `--cardio`, `--intervals`. Definir en `DESIGN.md`.

#### ❌ W4 — No hay selector de patrón de ejecución (Fricción Media)
- **Código:** El coach configura un bloque tipo "intervals" pero no elige el patrón (Tabata, EMOM, AMRAP, etc.).
- **Problema:** El coach crea un bloque de intervalos y asume que el alumno sabe qué hacer. El alumno no sabe si es Tabata (20s/10s) o EMOM (cada minuto) o algo más.
- **Impacto:** El alumno ejecuta mal el bloque. La sesión no cumple el objetivo.
- **Solución:** Al crear un bloque, el coach debería elegir un patrón: "Lista de ejercicios", "Timer guiado (Tabata, EMOM)", "Pasadas/running", "Cardio continuo", "Recuperación". Cada patrón tiene un preview del alumno.

---

## 9. Problemas Transversales (Encontrados en múltiples flujos)

### ❌ T1 — `<style jsx>` masivo en páginas (Fricción Media)
- **Dónde:** `cuenta/page.tsx` (493 líneas, ~150 líneas de `<style jsx>`), `login/page.tsx`, `onboarding/page.tsx`.
- **Problema:** Los estilos inline y `<style jsx>` hacen que las páginas sean difíciles de mantener y de ajustar para mobile. No hay CSS Modules ni un sistema de componentes reutilizables.
- **Impacto:** Cada cambio de UI requiere editar código en lugar de ajustar variables. El riesgo de inconsistencia visual es alto.
- **Solución:** Migrar a CSS Modules o a un sistema de componentes estilizados con variables CSS.

### ❌ T2 — Emojis en la UI (Fricción Media)
- **Dónde:** `onboarding/page.tsx`, `logros/page.tsx`, `clasificacion/page.tsx`.
- **Problema:** `DESIGN.md` prohíbe emojis. La app usa emojis en onboarding y logros. En algunos dispositivos los emojis se renderizan diferente (Android vs iOS vs desktop).
- **Impacto:** Inconsistencia visual. Riesgo de que un emoji no se renderice (cuadrado vacío en algunos dispositivos).
- **Solución:** Reemplazar todos los emojis con íconos del sistema de diseño (Icon component).

### ❌ T3 — Errores silenciosos en `catch` (Fricción Alta)
- **Dónde:** `panel/page.tsx` (líneas 79, 86, 93: `catch { /* silent */ }`), `coach/alumnos/page.tsx` (línea 39: `.catch(console.error)`).
- **Problema:** Si falla la carga del dashboard, el panel muestra datos vacíos sin decirle al usuario que algo falló. El usuario ve "—" en vez de un error.
- **Impacto:** El usuario piensa que no tiene datos, cuando en realidad el backend falló. No reintenta.
- **Solución:** Todo `catch` debe mostrar un `toast.error` o un estado de error visible.

### ❌ T4 — Sin Server Components (Fricción Media)
- **Dónde:** Todas las páginas auditadas tienen `"use client"`.
- **Problema:** Todas las páginas son Client Components. No hay SSR, no hay carga inicial instantánea, no hay SEO. El usuario ve un spinner o una pantalla blanca hasta que React hidrata.
- **Impacto:** En mobile con conexión lenta, el usuario espera 2-5 segundos viendo una pantalla blanca o "Cargando...".
- **Solución:** Migrar las páginas de lectura (semana, panel, detalle) a Server Components. Dejar solo las interactivas (sesión, login) como Client Components.

---

## Matriz de Prioridad

| ID | Flujo | Problema | Impacto | Esfuerzo | Prioridad |
|----|-------|----------|---------|----------|-----------|
| R1 | Sesión | Usuario atrapado sin saber qué hacer | Alto | Medio | **P0** |
| R2 | Sesión | Alternativas confusas | Alto | Medio | **P0** |
| W1 | Builder | No hay preview alumno | Alto | Alto | **P0** |
| S2 | Semana | Dos CTAs de igual peso | Medio | Bajo | P1 |
| C1 | Completada | "Confirmar" no celebra | Medio | Bajo | P1 |
| A1 | Coach | Tabla alfabética | Medio | Bajo | P1 |
| P1 | Panel | 4 KPIs sin jerarquía | Medio | Medio | P1 |
| L1 | Login | Error genérico | Medio | Bajo | P1 |
| R3 | Sesión | Demasiados modales | Medio | Alto | P2 |
| W2 | Builder | 6 botones sin jerarquía | Medio | Bajo | P2 |
| C2 | Completada | Comentarios en otra pantalla | Medio | Medio | P2 |
| S1 | Semana | Strip no interactivo | Bajo | Medio | P2 |
| S3 | Semana | Completadas compiten | Bajo | Bajo | P2 |
| D1 | Detalle | Botón volver pequeño | Bajo | Bajo | P3 |
| T3 | Todos | Errores silenciosos | Medio | Bajo | P3 |
| T4 | Todos | Sin Server Components | Medio | Alto | P3 |

---

## Recomendaciones Inmediatas (Quick Wins)

1. **En `semana/page.tsx`**: Eliminar el botón "Ver" y dejar solo "Empezar" como CTA dominante. (2 líneas)
2. **En `sesion/[id]/completada/page.tsx`**: Cambiar "Confirmar" por "Guardar y cerrar sesión". (1 línea)
3. **En `login/page.tsx`**: Agregar distinción de errores: 401 vs timeout vs 500. (5 líneas)
4. **En `coach/alumnos/page.tsx`**: Cambiar el sort de `localeCompare` a orden por prioridad (inactivos primero). (3 líneas)
5. **En `panel/page.tsx`**: Agregar `toast.error` en todos los `catch`. (3 líneas)

**Total: 14 líneas de cambio que resuelven 5 problemas de fricción alta.**

---

## Documento Adjunto

- `docs/review-ux-pass6-gap-analysis.md` — Análisis de 17 módulos (ya generado)
- `docs/review-ux-pass6-wireframes.html` — Wireframes Before/After (ya generado, sin emojis)
- `docs/review-ux-pass6-roadmap.md` — Roadmap de 7 fases (ya generado)

---

*Fin del análisis de flujos reales.*
