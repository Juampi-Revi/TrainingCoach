# MVP Scope (User Stories + Criterios de aceptación)

## MVP 1 (objetivo: planificación + ejecución + trazabilidad)

### US-01 — Autenticación básica
Como usuario (coach o alumno), quiero registrarme/iniciar sesión para acceder a mi cuenta.
- Criterios:
  - Permite crear cuenta e iniciar sesión.
  - El rol define a qué pantallas se accede (coach vs alumno).

### US-02 — Relación coach ↔ alumno
Como coach, quiero asociar alumnos a mi cuenta para poder planificar y ver su seguimiento.
- Criterios:
  - Un coach puede tener múltiples alumnos.
  - Un alumno pertenece a un coach (MVP 1: 1 a 1 para simplificar).

### US-03 — Crear plan
Como coach, quiero crear un plan (multi-semana) para estructurar la planificación.
- Criterios:
  - Plan con nombre, objetivo, notas, duración (semanas).
  - Se puede guardar como borrador.

### US-04 — Definir semanas y entrenamientos
Como coach, quiero definir semanas y entrenamientos dentro del plan para organizar el calendario de trabajo.
- Criterios:
  - Crear Semana 1..N.
  - Dentro de cada semana, crear entrenamientos (A/B/C o por nombre).

### US-05 — Catálogo de ejercicios
Como coach, quiero crear/editar ejercicios en un catálogo para reutilizarlos en distintos planes.
- Criterios:
  - Ejercicio con nombre, grupo muscular (opcional), equipamiento (opcional).
  - Se puede reutilizar en múltiples entrenamientos.

### US-06 — Configurar ejercicios del entrenamiento (template)
Como coach, quiero armar un entrenamiento con ejercicios y parámetros para que el alumno lo ejecute sin dudas.
- Criterios:
  - Para cada ejercicio: sets objetivo, reps objetivo, descanso, tempo (opcional), notas.
  - Soporta método de esfuerzo (MVP: RPE o RIR opcional).

### US-07 — Alternativas de ejercicio
Como coach, quiero definir alternativas por ejercicio para que el alumno pueda adaptarse si el equipo está ocupado.
- Criterios:
  - Cada ejercicio puede tener 0..N alternativas.
  - Se puede marcar una alternativa como “preferida” (orden de prioridad).

### US-08 — Asignar plan a alumno
Como coach, quiero asignar un plan a un alumno para que vea su planificación y pueda ejecutarla.
- Criterios:
  - Un alumno tiene 0..1 plan activo (MVP).
  - La asignación guarda fecha de inicio y estado (activo/pausado/finalizado).

### US-09 — Vista de planificación (alumno)
Como alumno, quiero ver mi plan semanal para saber qué entrenamientos tengo disponibles.
- Criterios:
  - Lista de semanas y entrenamientos.
  - Indica cuáles ya fueron realizados (según sesiones registradas).

### US-10 — Iniciar sesión de entrenamiento
Como alumno, quiero iniciar una sesión desde un entrenamiento del plan para registrar lo que hago en el gym.
- Criterios:
  - Crear una sesión con fecha/hora y referencia al entrenamiento template (si aplica).
  - Permite ejecutar entrenamientos fuera de orden.

### US-11 — Registrar sets por ejercicio
Como alumno, quiero registrar sets (peso, reps, RPE/RIR, notas) para cada ejercicio.
- Criterios:
  - Para cada set: número, reps, peso, RPE o RIR (opcional), nota (opcional).
  - Se puede editar antes de finalizar la sesión.

### US-12 — Cambiar a alternativa durante la sesión
Como alumno, quiero reemplazar un ejercicio por una alternativa sugerida y que quede registrado.
- Criterios:
  - El ejercicio ejecutado queda como el elegido (original o alternativa).
  - Se conserva trazabilidad de qué se reemplazó.

### US-13 — Cerrar sesión y dejar feedback global
Como alumno, quiero finalizar la sesión con sensaciones/energía y notas generales para compartir con el coach.
- Criterios:
  - Campo de energía/sensación (escala simple) + notas.
  - La sesión queda visible para el coach.

### US-14 — Registrar métricas corporales
Como alumno, quiero registrar peso y medidas en cualquier día para trackear progreso.
- Criterios:
  - Crear entradas con fecha.
  - Peso (opcional) + medidas configuradas (cintura/pecho/cadera/etc. MVP fijo).

### US-15 — Panel de seguimiento (coach)
Como coach, quiero ver un dashboard por alumno para revisar adherencia, sesiones recientes y métricas.
- Criterios:
  - Lista de sesiones recientes con detalle básico.
  - Gráfico/timeline simple de peso y medidas.

## MVP 2 (expansión)

### US-16 — Multimedia por ejercicio
Como coach, quiero asociar foto/video a un ejercicio para mejorar la ejecución del alumno.
- Criterios:
  - Adjuntar media (URL/archivo) a un ejercicio.
  - Visible en el detalle del ejercicio durante la sesión.

### US-17 — Registro simple de comidas
Como alumno, quiero registrar comidas de forma general para darle contexto al coach.
- Criterios:
  - Entrada con fecha/hora, texto, y opcional foto.
  - Coach puede ver timeline.

### US-18 — Importación asistida (Excel/Word)
Como coach, quiero importar una rutina existente para no tener que reescribir todo.
- Criterios:
  - Flujo de importación guiado con revisión antes de publicar.

### US-19 — Integración de pasos/sueño
Como alumno, quiero sincronizar pasos/sueño para centralizar el seguimiento.
- Criterios:
  - Importación/sincronización con proveedor (según plataforma).
  - Coach lo ve en panel.
