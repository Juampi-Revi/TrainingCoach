# UX Audit — YourCoachFit
_Reviewed: 2026-06-12_

---

## Objetivo

Transformar “la UX general no me gusta” en un mapa revisable y accionable: separar el producto por **roles**, **loops** y **conceptos**, y priorizar mejoras que reduzcan fricción y aumenten claridad en el uso diario.

Este documento no busca “hacer lindo” primero. Busca:

- Hacer explícito qué es el producto para cada rol
- Definir el loop principal de valor
- Encontrar puntos de fricción y ambigüedad por recorrido
- Proponer un plan de rediseño incremental (quick wins + refactors grandes)

---

## Contexto del Producto (hoy)

La app es, en la práctica, 3 productos:

- **Cliente (atleta)**: ejecutar entrenos + hábitos + feedback + salud
- **Coach**: operar cartera de alumnos + programar (planes/workouts) + seguimiento
- **Gym**: operación de clases grupales (más secundario vs cliente/coach)

Y 8 conceptos de UX que se cruzan:

- **Auth + onboarding**
- **Training** (planes, semana, sesión)
- **Health / wearables** (sync + métricas diarias)
- **Messaging** (chat + feedback de sesiones)
- **Nutrition** (food log + feedback)
- **Progress** (resúmenes, PRs, volumen)
- **Social / gamificación** (desafíos, leaderboard, amigos)
- **Notifications** (push e inbox in-app)

Referencias base de estructura:

- [ARCHITECTURE.md](file:///Users/juampi/TrainingChallengeRecomposition/ARCHITECTURE.md)
- Layout cliente: [layout.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/layout.tsx)
- Layout coach: [layout.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/layout.tsx)

---

## Loop Principal (debería dominar toda la UX)

```text
Coach programa -> Alumno entiende -> Alumno ejecuta -> App registra -> Coach interpreta -> Ajusta -> (repite)
```

Cuando la UX falla, casi siempre es porque alguno de estos puntos se rompe:

- El alumno no entiende qué hacer
- El coach no entiende qué está creando
- Ejecutar y registrar es incómodo en el momento de verdad
- El feedback llega tarde o no llega
- Los hábitos/salud distraen del loop central en vez de potenciarlo

---

## Mapa por Rol (sitemap conceptual)

### Cliente

Páginas núcleo:

- **Semana**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/semana/page.tsx)
- **Sesión**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/sesion/%5BsessionId%5D/page.tsx)
- **Panel**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/panel/page.tsx)

Páginas soporte:

- **Cuenta / Wearables**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/cuenta/wearable/page.tsx)
- **Mensajes**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/mensajes/page.tsx)
- **Notificaciones**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/notificaciones/page.tsx)
- **Comida / Progreso / Explorar / Desafíos** (expansión)

### Coach

Páginas núcleo:

- **Alumnos (lista)**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/alumnos/page.tsx)
- **Alumno (detalle 360)**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/alumnos/%5BclientUserId%5D/page.tsx)
- **Workouts (listado)**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/workouts/page.tsx)
- **Workout editor**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/workouts/%5BworkoutTemplateId%5D/page.tsx)
- **Planes (listado)**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/planes/page.tsx)
- **Ejercicios (biblioteca)**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/ejercicios/page.tsx)
- **Mensajes**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/mensajes/page.tsx)

### Gym

- **Dashboard**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/gym/page.tsx)
- **Clases**: [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/gym/clases/page.tsx)

---

## Diagnóstico Global (lo que “se siente mal”)

### 1) Falta jerarquía: demasiadas entradas compiten

En cliente conviven `Semana`, `Panel`, `Cuenta`, `Progreso`, `Explorar`, `Mensajes`, `Notificaciones`. No hay un “centro” indiscutible.

En coach conviven `Alumnos`, `Planes`, `Workouts`, `Ejercicios`, `Mensajes`, `Calendario`. Todo parece igual de importante, pero en operación real no lo es.

**Efecto UX**: ruido, indecisión y uso parcial de features.

### 2) Mezcla entre configurar y operar

El coach alterna en segundos entre:

- Ver un alumno (operación)
- Editar un plan o workout (configuración)
- Revisar evidencia (sesión completada, salud, comida)

Sin un modelo claro de “modo” (operar vs construir).

**Efecto UX**: carga mental alta, sobre todo con 50–100 alumnos.

### 3) “El alumno no entiende”

Esto ya apareció fuerte en bloques. Mejoró con preview por bloque y timeline, pero el problema general es:

- El alumno necesita un “qué tengo que hacer ahora” sin leer todo
- Y necesita “siguiente acción” siempre visible

### 4) Health / hábitos pueden competir con Training

El panel puede ser útil, pero si no está alineado al loop central, se vuelve un “segundo producto” que distrae.

---

## Auditoría — Cliente

### Loop Real del Cliente

```text
Abrir -> ver qué toca -> empezar -> ejecutar -> registrar -> terminar -> (ver resumen) -> recibir feedback
```

### Puntos de fricción típicos

- **Semana**: ambigüedad “qué toca hoy vs qué elijo yo”
- **Inicio de sesión**: “¿esto es el entreno correcto?” y “¿cuánto falta?”
- **Durante sesión**: alternar entre ejecución y logging sin romper el ritmo
- **Post sesión**: falta un resumen que cierre el ciclo y le diga “qué lograste”
- **Panel**: demasiado denso si el objetivo principal del día era entrenar

### Recomendación UX (Cliente)

**A) Semana como centro operativo**

- La pantalla `Semana` debería responder siempre:
  - “Qué debería hacer ahora”
  - “Qué ya hice”
  - “Qué puedo elegir como alternativa”
- Mostrar “siguiente entreno recomendado” con un CTA dominante.

**B) Sesión con dos capas**

- Capa 1: ejecución (timer/runner, lista simple, siguiente acción).
- Capa 2: registro (sets, notas, swaps) como “drawer” o modo secundario, sin sacar al usuario del ritmo.

**C) Cierre de sesión fuerte**

- Un resumen final con 3–5 métricas humanas:
  - duración
  - bloques completados
  - RPE/energía
  - puntos destacados (PRs, volumen, consistencia)
- CTA directo: “Mandar comentario al coach” o “Ver feedback”.

### Quick wins (Cliente)

- Reforzar CTAs: 1 principal por pantalla.
- Reducir densidad del panel: un “Today card” y lo demás en secciones colapsables.
- Estandarizar “estados” en sesión: `en curso`, `pausado`, `pendiente`, `completado`.

---

## Auditoría — Coach

### Loop Real del Coach

```text
Revisar cartera -> detectar necesidad -> decidir acción -> programar/ajustar -> comunicar -> verificar ejecución
```

### Puntos de fricción típicos

- **Alumnos**: demasiada info sin una “acción sugerida”
- **Detalle alumno**: gran dashboard pero falta una columna vertebral de decisión
- **Planes**: asignación / cambios / impacto en semana activa no siempre es obvio
- **Workouts**: el coach configura, pero no siempre ve claramente cómo lo entiende el alumno
- **Mensajes**: el chat queda separado del estado real del alumno (contexto de última sesión, adherence, etc.)

### Recomendación UX (Coach)

**A) Operación primero: Dashboard/Alumnos como “bandeja”**

- Lista de alumnos con tags accionables:
  - `sin entrenar hace X días`
  - `plan por vencer`
  - `tiene sesión incompleta`
  - `tiene mensaje pendiente`
- CTA por alumno: “ver”, “mandar mensaje”, “ajustar semana”, “asignar plan”.

**B) Detalle alumno como “estado + acciones”**

Estructura recomendada en 3 carriles:

```text
Izq: Estado hoy/semana (señales)
Centro: Evidencia (sesiones + salud + comida)
Der: Acciones (programar, mensaje, objetivo)
```

**C) Constructor (planes/workouts) como modo aparte**

- Clarificar “modo construir” vs “modo operar”.
- Minimizar navegación entre alumno y editor (y mantener contexto con `returnTo`).

**D) Vista alumno obligatoria en configuración**

- En planes/workouts, tener “preview alumno” siempre a 1 click.
- Validar comprensión: si el preview se ve confuso, el coach también lo está creando confuso.

### Quick wins (Coach)

- Convertir lista de alumnos en un tablero con prioridades (acciones sugeridas).
- Unificar “volver” y contexto (ya existe en ejercicios; extender a otros flows).
- En editor de workout, confirmar que cada bloque tenga:
  - patrón
  - duración estimada
  - CTA “ver como alumno”

---

## Auditoría — Gym

El módulo Gym parece correcto como “operación de clases”, pero es secundario para el loop principal coach-atleta.

Recomendación:

- Mantener sin grandes cambios hasta estabilizar Cliente + Coach.
- Revisar luego:
  - setup de clases
  - tele
  - roles/permisos de gym

---

## Auditoría Transversal (cross-cutting)

### Auth / Onboarding

Objetivo UX:

- Entrar sin fricción
- Quedar en el rol correcto (cliente vs coach)
- Tener un primer “primer paso” claro

Riesgo actual:

- OAuth y envs pueden fallar silencioso (impacta confianza).

### Notificaciones

Objetivo UX:

- Ser el “pegamento” del loop: recordar, alertar, confirmar.

Recomendación:

- Para cliente: 3 tipos máximos al inicio (entreno, mensaje coach, hábitos).
- Para coach: 3 tipos (alumno inactivo, alumno completó, mensaje).

### Wearables / Health

Objetivo UX:

- Convertir datos en decisiones y motivación.

Recomendación:

- “Conectar wearable” debe tener un estado inequívoco:
  - conectado / no conectado
  - última sync
  - qué se sincroniza
  - cómo corregir si falla

---

## Priorización (qué conviene atacar primero)

### Prioridad 1 (impacto alto)

- Cliente: `Semana` -> “qué toca ahora”
- Cliente: `Sesión` -> ejecución sin fricción + cierre fuerte
- Coach: `Alumnos` y `Detalle` -> tablero de decisiones
- Coach: `Workouts/bloques` -> preview alumno y claridad
- Wearables: “conectar y verificar” con estados claros

### Prioridad 2 (impacto medio)

- Panel: reducir densidad, más foco en “hoy”
- Mensajes: más contexto del estado del alumno
- Progreso: resumen simple y accionable

### Prioridad 3 (expansión)

- Social/gamificación
- Explorar planes públicos
- Gym

---

## Plan de trabajo sugerido (iterativo)

```text
Fase 1: Claridad del loop (Cliente Semana + Sesión)
Fase 2: Operación Coach (Alumnos + Detalle)
Fase 3: Construcción Coach (Planes + Workouts + Ejercicios)
Fase 4: Adherencia (Panel + Notificaciones + Mensajes)
Fase 5: Expansión (Progreso, Social, Explorar, Gym)
```

---

## Próximo paso recomendado

La segunda pasada ya relevó con capturas reales estos flujos:

- Cliente: `Semana -> Detalle -> Sesión -> Completada`
- Coach: `Alumnos -> Detalle -> Acción`
- Coach: `Workouts / Planes -> Preview alumno`

Documento detallado:

- [review-ux-deep-dive.md](file:///Users/juampi/TrainingChallengeRecomposition/docs/review-ux-deep-dive.md)
- [review-ux-pass3-solutions.md](file:///Users/juampi/TrainingChallengeRecomposition/docs/review-ux-pass3-solutions.md)

Siguiente paso sugerido:

- marcar problemas sobre las capturas
- armar `before / after` por pantalla
- convertir hallazgos en tickets priorizados por módulo
