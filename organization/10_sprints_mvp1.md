# Sprints — MVP 1

Objetivo: entregar un producto usable end-to-end para coach y alumno: planificar → ejecutar → registrar → visualizar progreso.

## Sprint 1 — Fundaciones y roles
Historias:
- US-01 Autenticación básica
- US-02 Relación coach ↔ alumno

Entregables:
- Onboarding mínimo: login/registro.
- Separación de vistas por rol.
- Coach puede asociar alumno (simple).

Definición de listo:
- Un coach puede ver una lista de alumnos.
- Un alumno puede iniciar sesión y queda asociado a un coach.

## Sprint 2 — Planificación (coach)
Historias:
- US-03 Crear plan
- US-04 Definir semanas y entrenamientos
- US-05 Catálogo de ejercicios
- US-06 Configurar ejercicios del entrenamiento (template)
- US-07 Alternativas de ejercicio

Entregables:
- CRUD de plan, semanas y entrenamientos.
- Editor de entrenamiento con lista de ejercicios y parámetros.
- Catálogo de ejercicios por coach.
- Alternativas por ejercicio (prioridad).

Definición de listo:
- Coach puede publicar un plan con al menos 1 semana y 2 entrenamientos.
- Cada entrenamiento puede tener ejercicios con objetivos y alternativas.

## Sprint 3 — Asignación y visualización (alumno)
Historias:
- US-08 Asignar plan a alumno
- US-09 Vista de planificación (alumno)

Entregables:
- Coach asigna plan a alumno con fecha de inicio.
- Alumno ve su plan (semanas + entrenamientos disponibles).
- Indicador básico de “realizado” según sesiones.

Definición de listo:
- Alumno puede abrir su planificación sin depender de WhatsApp/Excel.

## Sprint 4 — Ejecución y registro (alumno)
Historias:
- US-10 Iniciar sesión de entrenamiento
- US-11 Registrar sets por ejercicio
- US-12 Cambiar a alternativa durante la sesión
- US-13 Cerrar sesión y dejar feedback global

Entregables:
- Flujo “modo gym”: iniciar sesión → registrar sets → finalizar.
- Reemplazo por alternativas con trazabilidad.
- Feedback global (energía + notas).

Definición de listo:
- El coach puede ver sesiones completadas por el alumno.
- El alumno puede revisar su historial de sesiones.

## Sprint 5 — Métricas y dashboard coach
Historias:
- US-14 Registrar métricas corporales
- US-15 Panel de seguimiento (coach)

Entregables:
- Registro de peso/medidas con timeline.
- Dashboard por alumno: sesiones recientes + métricas con visualización simple.

Definición de listo:
- El coach puede monitorear adherencia y progreso sin pedir capturas o mensajes dispersos.
