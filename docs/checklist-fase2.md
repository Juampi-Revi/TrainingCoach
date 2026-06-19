# Checklist de Verificación — Cambios Fase 2 (Coach)

## Modo COACH (usuario: `coach@example.com` / `12345678`)

### 1. Alumnos — Tablero de atención
- [ ] **Entrar a "Alumnos"** — se carga sin errores
- [ ] **Layout de tarjetas** — grid responsive (2-3 columnas en desktop, 1 en mobile)
- [ ] **Priorización** — alumnos inactivos (rojo) primero, luego atención (naranja), luego on track (verde)
- [ ] **Estado correcto**: Sin plan / Inactiva / Atención / On track
- [ ] **Avatar + nombre + email** — visible en cada tarjeta
- [ ] **Plan activo** — ícono de libro + nombre del plan
- [ ] **Última sesión** — ícono de calendario + "Hoy" / "Hace Xd" / "Nunca"
- [ ] **Badge de estado** — color correcto según prioridad
- [ ] **Quick actions** — dos botones por tarjeta:
  - Sin plan → "Asignar plan" + "Ajustar plan"
  - Inactiva → "Enviar mensaje" + "Ajustar plan"
  - Atención → "Revisar log" + "Ajustar plan"
  - On track → "Ver progreso" + "Ajustar plan"
- [ ] **Click en tarjeta** — va a detalle del alumno
- [ ] **Click en quick action** — no navega al detalle, ejecuta la acción
- [ ] **Búsqueda** — funciona, filtra en tiempo real
- [ ] **Agregar alumno** — modal funciona

### 2. Workout Builder — Selector de patrón
- [ ] **Entrar a "Workouts"** — se carga sin errores
- [ ] **Crear/Editar workout** — abre editor
- [ ] **Click en "Agregar bloque" o "Crear primer bloque"** — abre modal
- [ ] **Modal de bloque** — layout de dos columnas (formulario izquierda, preview derecha)
- [ ] **Selector de patrón** — grid de 2x4 con cards:
  - Calentamiento (flame)
  - Fuerza (dumbbell)
  - Tabata (timer)
  - HIIT (timer)
  - EMOM (timer)
  - AMRAP (timer)
  - Cardio / Running (repeat)
  - Recuperación (moon)
- [ ] **Selección de patrón** — card resaltada en verde, con ícono y descripción
- [ ] **Al seleccionar patrón** — carga valores por defecto (preset)
- [ ] **Nombre del bloque** — input visible
- [ ] **Descripción** — input opcional

### 3. Workout Builder — Formularios contextualizados
- [ ] **Tabata/HIIT** — muestra: Preparación, Trabajo, Descanso, Rondas, Series, Descanso entre series
- [ ] **EMOM** — muestra: Preparación, Minutos, Descanso entre ejercicios
- [ ] **AMRAP** — muestra: Preparación, Duración total, Descanso entre ejercicios
- [ ] **Cardio** — muestra: Tiempo objetivo, Zona, Pasadas (steps)
- [ ] **Fuerza** — muestra: Tiempo objetivo, Descanso entre ejercicios
- [ ] **Calentamiento** — muestra: Tiempo objetivo, Descanso entre ejercicios
- [ ] **Recuperación** — muestra: Tiempo objetivo, Descanso entre ejercicios
- [ ] **No mezcla campos** — solo se ven los campos relevantes al patrón

### 4. Workout Builder — Preview del alumno
- [ ] **Panel derecho** — titulado "VISTA DEL ALUMNO"
- [ ] **Header del bloque** — ícono + tipo + nombre
- [ ] **Timeline** — pasos secuenciales con puntos de color:
  - Preparación (gris)
  - Trabajo (verde)
  - Descanso (gris)
  - Series (naranja)
  - EMOM (verde)
  - AMRAP (verde)
  - Duración (verde)
- [ ] **Duración total** — card destacada al final con tiempo total
- [ ] **Descanso post-bloque** — incluido en el cálculo
- [ ] **Actualización en tiempo real** — cambiar valores actualiza el preview

### 5. Workout Builder — Duración visible
- [ ] **BlockModalSummary** — visible debajo del nombre/descripción
- [ ] **Duración total** — card prominente
- [ ] **Serie/Ronda** — card con detalle de trabajo/descanso
- [ ] **Rondas/Minutos** — card numérica
- [ ] **Trabajo total** — calculado correctamente
- [ ] **Descanso entre ejercicios** — visible si está configurado
- [ ] **Descanso después del bloque** — visible si está configurado

### 6. General
- [ ] **Sin errores en consola** — Chrome DevTools
- [ ] **Desktop layout** — sidebar + contenido, responsive
- [ ] **Modo oscuro** — todo en tema oscuro consistente
- [ ] **TypeScript** — pasa sin errores

---

## Notas

- **API**: Debe estar corriendo en `localhost:3003`
- **Web**: Debe estar corriendo en `localhost:3001`
- **DB**: Docker Desktop con PostgreSQL en puerto 5434

## Próxima Fase (3)

Después de verificar esto, vamos a:
- **Analytics**: Dashboard de volumen, PRs, gráficos
- **Gamification**: Streaks, badges, XP
- **Notificaciones push**: Recordatorios, alertas
- **Chat enriquecido**: Fotos, notas de voz

¿Todo OK? ¿Algo roto?