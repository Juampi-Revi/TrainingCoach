# Rediseño UX/UI - Carga y Ejecución de Bloques

## Objetivo

Resolver de raíz la confusión actual al crear y ejecutar entrenamientos:

- El coach hoy configura campos técnicos por tipo de bloque, pero no siempre entiende con claridad qué está construyendo.
- El alumno recibe una sesión que mezcla distintos patrones de interacción sin una narrativa uniforme.
- La duración total, descansos y expectativa de ejecución no quedan visibles ni en creación ni en consumo.

La propuesta es pasar de un modelo centrado en "campos" a un modelo centrado en:

1. `Qué quiere lograr el coach`
2. `Cómo se ejecuta ese bloque`
3. `Qué va a ver exactamente el alumno`

## Diagnóstico del problema actual

### 1. El tipo técnico aparece demasiado pronto

Hoy el modal de bloque parte con `Tipo de bloque` y luego muestra campos condicionales. Eso obliga al coach a conocer de antemano la estructura interna del sistema:

- `warmup`
- `strength`
- `intervals`
- `cardio`
- `cooldown`

El problema no es el modelo de datos, sino la UX: el coach piensa en "quiero un bloque de fuerza con descanso entre ejercicios" o "quiero 10 pasadas de 400m", no en `intervals + rounds + restBetweenExercisesSeconds`.

### 2. La configuración no explica la ejecución

Hay campos como:

- `workSeconds`
- `restSeconds`
- `rounds`
- `targetMinutes`
- `targetZone`
- `restAfterSeconds`

pero el sistema no muestra con suficiente claridad:

- cuánto dura el bloque
- qué hace primero el alumno
- qué se repite
- qué se descansa
- cómo se ve finalmente durante la sesión

### 3. El alumno cambia de patrón mental sin aviso

Del lado cliente hoy conviven varios modos:

- lista de ejercicios con logger
- overlays de intervalos
- warmup separado
- running por pasos

pero no hay una "gramática visual" consistente que diga:

- esto es una lista
- esto es un timer guiado
- esto es una secuencia de pasadas
- esto es una actividad libre con objetivo

## Principios del rediseño

### 1. Primero intención, después detalle

El coach no debería empezar por un formulario vacío. Debería empezar por una decisión simple:

- `Lista de ejercicios`
- `Bloque con timer`
- `Pasadas / intervalos de running`
- `Cardio continuo por zona`
- `Vuelta a la calma`

### 2. Cada bloque debe declarar su patrón de ejecución

Todo bloque debe responder explícitamente:

- `Cómo se hace`
- `Cuánto dura`
- `Qué descansa`
- `Qué ve el alumno`

### 3. Preview obligatoria

Mientras el coach configura, la UI debe mostrar una preview viva con lenguaje de alumno.

Ejemplo:

`Vas a hacer 10 rondas de 20s trabajo + 10s descanso. Total estimado: 5 min.`

o

`Vas a hacer 10 pasadas: 400m fuerte / 200m suave. Distancia total: 6.0 km aprox.`

### 4. El entrenamiento debe leerse como una línea de tiempo

La pantalla principal del editor no debería ser una lista técnica de bloques. Debe ser una secuencia entendible:

- Calentamiento
- Fuerza principal
- Finisher / intervalos
- Running por zonas
- Vuelta a la calma

Cada bloque debe mostrar:

- tipo
- intención
- duración estimada
- descanso posterior
- modo de ejecución del alumno

## Nueva arquitectura UX del editor coach

## Nota clave: intervalos estilo "timer app"

Los bloques de intervalos hoy se sienten confusos porque el coach termina “armando una fórmula” con campos sueltos.

La propuesta es copiar el patrón mental de la mayoría de interval timers:

- `Preparación` (countdown antes de empezar)
- `Trabajo`
- `Descanso`
- `Rondas`
- `Series` (sets/tabatas)
- `Descanso entre series`
- Opcional: `Cooldown` y `Descanso final`

Esto produce un bloque autoexplicable y permite un preview claro:

`3 series · 10 rondas · 40s/20s · 60s entre series · total estimado 13 min`

Luego, como plus (sin ensuciar el formulario principal), se agrega una capa de asignación de ejercicios:

- `Repetir 1 ejercicio`
- `Rotar por ronda`
- `Rotar por serie`
- `Custom` (avanzado)

Así, el coach arranca por la receta (lo importante) y recién después mapea contenido si lo necesita.

## Paso 1 - Selector de patrón de bloque

En vez de abrir un modal genérico, abrir un selector de "cómo querés construir este tramo":

### Opción A - Lista de ejercicios

Usos:

- calentamiento
- fuerza
- accesorios
- cooldown guiado

Configura:

- nombre del bloque
- objetivo o foco
- duración estimada opcional
- descanso entre ejercicios
- descanso al terminar el bloque

El contenido se construye con ejercicios.

### Opción B - Timer guiado

Usos:

- tabata
- hiit
- emom
- amrap

Configura:

- formato del timer
- tiempo de trabajo
- tiempo de descanso
- rondas o minutos
- descanso entre ejercicios
- descanso al terminar

El contenido puede tener ejercicios o instrucciones cortas.

### Opción C - Pasadas / intervalos de running

Usos:

- series
- fartlek
- bloques mixtos por distancia o tiempo

Configura:

- lista de pasos
- cada paso con: tipo, duración o distancia, intensidad objetivo, nota
- resumen total del bloque
- descanso final opcional

### Opción D - Cardio continuo

Usos:

- zona 2
- trote regenerativo
- bici suave
- base aeróbica

Configura:

- duración objetivo
- zona o intensidad
- instrucciones
- opcional: distancia estimada

### Opción E - Recuperación / movilidad

Usos:

- movilidad final
- respiración
- elongación

Configura:

- lista de ejercicios o instrucciones
- duración total objetivo
- notas simples

## Paso 2 - Builder orientado por patrón

Cada patrón abre un formulario diferente. No un mismo formulario con ramas.

### 1. Builder "Lista de ejercicios"

Pensado para `warmup`, `strength`, `cooldown`.

Campos visibles:

- Nombre
- Objetivo del bloque
- Duración estimada
- Descanso entre ejercicios
- Descanso al finalizar
- Ejercicios del bloque

Preview para coach:

- `6 ejercicios`
- `18-22 min estimados`
- `60s entre ejercicios`
- `El alumno registra series / reps`

Vista alumno:

- lista de ejercicios
- target visible por ejercicio
- descanso sugerido
- logger y timer de descanso

### 2. Builder "Timer guiado"

Pensado para `intervals`.

Submodos:

- Tabata / HIIT
- EMOM
- AMRAP

Campos visibles según modo:

#### Tabata / HIIT

- Trabajo
- Descanso
- Rondas
- Ejercicios del bloque
- Descanso final

Preview alumno:

`8 rondas · 20s on / 10s off · total 4 min`

#### EMOM

- Minutos totales
- Ejercicio(s) por minuto
- Descanso final

Preview alumno:

`Cada minuto empieza una nueva ronda. Terminás el trabajo y descansás lo que sobra del minuto.`

#### AMRAP

- Duración total
- Ejercicios a repetir
- Descanso opcional entre ejercicios
- Descanso final

Preview alumno:

`Hacé tantas rondas como puedas en 12 min.`

### 3. Builder "Pasadas / running"

Pensado para `cardio` estructurado con `steps`.

Campos visibles:

- Nombre del bloque
- Objetivo del bloque
- Pasos
- Cada paso:
  - tipo (`work`, `recover`, `warmup`, `cooldown`)
  - distancia o tiempo
  - intensidad (`RPE`, ritmo, velocidad, FC, zona`)
  - instrucción
- Descanso final

Preview coach:

- `10 pasos`
- `6.0 km estimados`
- `24 min estimados`
- `4 pasos de trabajo`

Vista alumno:

- lista ordenada de pasadas
- totales arriba
- intensidad legible
- CTA para vincular actividad

### 4. Builder "Cardio continuo"

Pensado para rodajes lineales, bici base, trote suave.

Campos visibles:

- Nombre
- Duración objetivo
- Zona / intensidad objetivo
- Instrucción breve
- Descanso final

Preview alumno:

`45 min en Zona 2. Ritmo conversacional.`

## Paso 3 - Timeline del workout

La página del editor debe mostrar una timeline con cards homogéneas.

Cada card de bloque debe exponer:

- Nombre
- Patrón de ejecución
- Duración estimada
- Descanso final
- Resumen de contenido
- CTA `Editar`
- CTA `Ver como alumno`

Ejemplos de resumen:

- `Fuerza · 5 ejercicios · 22 min · 60s entre ejercicios`
- `EMOM · 12 min · 3 ejercicios por ronda`
- `Running · 10 pasos · 6.0 km · Zona 4 en trabajos`
- `Cardio continuo · 45 min · Zona 2`

## Nueva arquitectura UX del lado alumno

## Objetivo

El alumno siempre debe entender:

1. Qué bloque está haciendo
2. Qué tiene que hacer ahora
3. Cuánto falta
4. Cuál es el siguiente paso

## Nueva estructura visual de detalle de entrenamiento

Antes de iniciar, la vista del workout debe mostrar:

- Resumen total del entrenamiento
- Duración estimada total
- Cantidad de bloques
- Orden claro de ejecución

Cada bloque debe mostrarse según patrón:

### Lista de ejercicios

- título
- tiempo estimado
- ejercicios con sets/reps
- descanso sugerido

### Timer guiado

- tipo de timer
- duración total
- estructura textual clara
- ejercicios que participan

### Pasadas / running

- resumen arriba
- pasos uno debajo del otro
- distancia/tiempo/intensidad visibles

### Cardio continuo

- una card simple con consigna
- duración
- zona objetivo
- tip de ejecución

## Nueva estructura visual durante la sesión

En sesión, cada patrón necesita una interacción distinta:

### Lista de ejercicios

- foco en ejercicio actual
- logger
- descanso
- progreso dentro del bloque

### Timer guiado

- pantalla inmersiva de bloque
- trabajo actual
- tiempo restante
- ronda actual
- próximo ejercicio o próxima fase

### Pasadas / running

- lista completa de pasos
- paso actual destacado
- totales planificados
- actividad vinculada cuando exista

### Cardio continuo

- consigna grande
- duración objetivo
- zona objetivo
- botón de completar
- vínculo a Strava / wearable

## Modelo visual recomendado

## Coach

Dos columnas en desktop, una sola en mobile:

- Columna izquierda: configuración
- Columna derecha: preview "así lo verá el alumno"

Esto elimina la ambigüedad porque el coach no configura a ciegas.

## Alumno

Una misma gramática visual para todos los bloques:

- encabezado del bloque
- resumen corto
- contenido principal
- CTA de acción

## Cambio conceptual recomendado en datos

Sin romper el modelo actual, conviene introducir una capa semántica de frontend:

- `executionPattern`
- `estimatedDuration`
- `clientPreviewSummary`

Ejemplo:

- `warmup` y `strength` pueden compartir `executionPattern = exercise_list`
- `intervals` puede usar `executionPattern = guided_timer`
- `cardio` con `steps` usa `executionPattern = endurance_steps`
- `cardio` sin `steps` usa `executionPattern = steady_state`
- `cooldown` puede usar `executionPattern = recovery_list`

Esto permite rediseñar UI sin reescribir toda la base de datos de una vez.

## Plan de implementación recomendado

### Etapa 1 - Diseño y sistema de patrones

- Definir `executionPattern` en frontend
- Rediseñar selector de creación de bloque
- Diseñar cards resumen consistentes
- Agregar preview alumno dentro del editor

### Etapa 2 - Rehacer modal/builder

- Reemplazar modal actual por builders por patrón
- Agregar resumen automático de duración
- Agregar validaciones claras

### Etapa 3 - Rehacer vista previa del workout

- Timeline del entrenamiento
- Totales del workout
- Resumen por bloque

### Etapa 4 - Rehacer sesión en ejecución

- unificar lenguaje visual
- separar por patrón
- hacer más obvio qué sigue y cuánto falta

## Checklist de validación

Antes de codear, validar esto con vos:

- ¿Los patrones propuestos cubren cómo pensás los entrenamientos reales?
- ¿Querés mantener `warmup/strength/cardio/intervals/cooldown` como nomenclatura interna, aunque la UI muestre otra cosa?
- ¿El coach necesita ver duración estimada por bloque o también del workout completo?
- ¿Querés que el alumno vea la sesión completa de entrada o solo el bloque actual con posibilidad de expandir?
- ¿Running y bici deben compartir exactamente la misma UI con cambio solo de labels?

## Recomendación final

No conviene seguir agregando campos al modal actual. Ya llegó a su límite conceptual.

La solución correcta es:

- cambiar de `modal técnico` a `builder por patrón`
- sumar `preview del alumno`
- mostrar `duración, descansos y modo de ejecución` como información de primer nivel

Así el coach entiende mejor lo que está creando y el alumno entiende mejor qué tiene que hacer.
