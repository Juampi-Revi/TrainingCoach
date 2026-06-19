# Checklist de Verificación — Cambios Fase 1

## Modo CLIENTE (usuario: `client@example.com` / `12345678`)

### 1. Panel / Mi Panel
- [ ] **Entrar a "Mi Panel"** — se carga sin errores
- [ ] **Sección HOY arriba** — primero resumen del día, después métricas semanales
- [ ] **Rings de progreso** — pasos, sueño, comida, actividad con colores correctos
- [ ] **Acciones rápidas** — tocar pasos/sueño/comida abre modal para registrar
- [ ] **Score diario** — visible si hay datos del día
- [ ] **Métricas semanales** — steps, sleep, workouts, comida con "Falta: X, Y"
- [ ] **Heatmap** — números en celdas (ej: 8.2k, 7h, 1)
- [ ] **Sin pestaña "Mensajes"** — en la navegación inferior no aparece

### 2. Semana / Mi Semana
- [ ] **Entrar a "Semana"** — se carga sin errores
- [ ] **Contexto semanal** — debajo del header: "Semana X de Y · estás en..."
- [ ] **Hero de intención** — card verde (lime) con "HOY TOCA · {title}"
- [ ] **Briefing** — muestra tags/descripción/ejercicios en la card de hoy
- [ ] **"Después de hoy"** — sección colapsable con ícono de calendario
- [ ] **Pendientes y Completadas** — dentro del colapsable, no fuera
- [ ] **Next step** — card al final: "Próximo: {title}" o "Semana completada"
- [ ] **Botón "Empezar entreno"** — visible en la card de hoy si no hay sesión activa
- [ ] **Botón "Continuar entreno"** — visible si hay sesión en progreso

### 3. Sesión / Entreno
- [ ] **Iniciar sesión** — desde semana, tocar "Empezar entreno"
- [ ] **Warmup** — si existe, muestra overlay con "Opcional · no cuenta para el entreno"
- [ ] **Warmup** — no marca ejercicios como "faltan series"
- [ ] **Media viewer** — video embed en recuadro (320px), badge "Técnica", contador
- [ ] **Logger** — placeholders por ejercicio (no mezclados)
- [ ] **Cardio puro** — ejercicio tipo Bicicleta: display MM:SS, play/pausa, sin reps
- [ ] **Bottom bar** — navegación prev/next + "Registrar series" / "Finalizar sesión"
- [ ] **Sin botón "Ver"** — solo "Empezar" en la semana
- [ ] **Completar** — "Guardar y cerrar sesión" al final (no "Confirmar")

### 4. Login / Onboarding
- [ ] **Onboarding** — si aparece, íconos SVG (no emojis) en Goal/Equipment/Focus
- [ ] **Login** — errores con contexto: "Credenciales inválidas", "Error de servidor"

### 5. General
- [ ] **Sin errores en consola** — Chrome DevTools
- [ ] **Navegación** — funciona entre panel/semana/sesión/cuenta
- [ ] **Modo oscuro** — todo en tema oscuro consistente

---

## Modo COACH (usuario: `coach@example.com` / `12345678`)

### 1. Navegación
- [ ] **Sin pestaña "Mensajes"** — en la navegación lateral/desktop no aparece
- [ ] **Links visibles**: Alumnos, Planes, Workouts, Settings

### 2. Alumnos
- [ ] **Entrar a "Alumnos"** — se carga sin errores
- [ ] **Tabla de alumnos** — nombre, plan, última sesión, estado
- [ ] **Estados**: On track (verde), Atención (naranja), Inactiva (rojo), Sin plan (rojo)
- [ ] **Priorización** — inactivos primero, luego atención, luego on track
- [ ] **Búsqueda** — filtra por nombre/email
- [ ] **Agregar alumno** — modal funciona, envía invitación
- [ ] **Click en alumno** — va a detalle del alumno

### 3. Planes
- [ ] **Entrar a "Planes"** — se carga sin errores
- [ ] **Lista de planes** — título, semanas, asignados, estado
- [ ] **Crear plan** — modal funciona, pide título y semanas
- [ ] **Editar plan** — va a editor semanal
- [ ] **Asignar plan** — desde el plan o desde alumno

### 4. Workouts (Entrenamientos)
- [ ] **Entrar a "Workouts"** — se carga sin errores
- [ ] **Lista de templates** — título, tags, ejercicios, fecha
- [ ] **Crear workout** — botón "Nuevo" funciona
- [ ] **Editar workout** — va a editor con bloques
- [ ] **Duplicar** — funciona, crea copia
- [ ] **Eliminar** — confirmación, luego elimina
- [ ] **Tags** — colores correctos (push=lime, pull=info, legs=warn)

### 5. Editor de Workout (crítico — a revisar para Fase 2)
- [ ] **Abrir editor** — desde "Crear" o "Editar"
- [ ] **Bloques visibles** — warmup, fuerza, intervals, cardio, cooldown
- [ ] **Agregar ejercicio** — picker funciona
- [ ] **Agregar bloque** — modal con campos (workSeconds, restSeconds, rounds, etc.)
- [ ] **Guardar** — guarda sin errores

### 6. General
- [ ] **Sin errores en consola** — Chrome DevTools
- [ ] **Desktop layout** — sidebar + contenido, responsive
- [ ] **Modo oscuro** — todo en tema oscuro consistente

---

## Notas

- **API**: Debe estar corriendo en `localhost:3003`
- **Web**: Debe estar corriendo en `localhost:3001`
- **DB**: Docker Desktop con PostgreSQL en puerto 5434
- **Reiniciar** si hay problemas: `kill` procesos + `npm run dev`

## Problemas conocidos previos

Si ves algo de esto, avisá:
- Warmup marca ejercicios como incompletos → debería estar fixeado
- Placeholders mezclados entre ejercicios → debería estar fixeado (lastRefMap)
- Media viewer muy grande → debería estar fixeado (320px)
- Emojis en onboarding → debería estar fixeado (SVG icons)

## Próxima Fase (2)

Después de verificar esto, vamos a:
- **Coach**: Rediseñar editor de bloques (constructor por patrón)
- **Coach**: Tablero de alumnos con tarjetas + quick actions
- **Coach**: Preview del alumno en el builder

¿Todo OK? ¿Algo roto?