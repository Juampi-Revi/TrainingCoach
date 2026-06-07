# Roadmap de Features — Ideas para Crecer

> Listado de ideas organizadas por prioridad y módulo.
> Basado en la conversación inicial y mejoras identificadas.

---

## Estado Actual (2026-05)

### Resuelto / Mejorado recientemente

- [x] **Deploy estable**: migraciones versionadas (incluye fix de `.gitignore` para no ignorar `migration.sql`).
- [x] **Auth**: refresh token en DB (`User.refreshToken`, `User.refreshTokenExpiry`) + endpoints de refresh/logout.
- [x] **Entrenamiento**:
  - Logger de series: evitar guardado “masivo” por precarga (ahora placeholders).
  - Warmup: no contaminar “faltan series” al completar.
  - Progreso semanal: asignación de sesiones por `planWeekWorkoutId`.
- [x] **Coach**: duplicar workout template (clonar y editar).

### Pendiente inmediato (Loop A — fortalecer core)

Este roadmap sigue siendo el backlog largo. Para ejecución ordenada, ver: `docs/loop-a.md`.

---

## 🚀 Funcionalidades del Negocio Principal

### Para el Modelo Actual (Coach → Alumno)

#### High Priority

- [ ] **Loop A (core sólido antes de expandir)**
  - Consistencia Semana vs Historial (definir reglas de “parcial” y contadores).
  - Entrenamiento en vivo: guardado por serie (UX explícita) + estados claros.
  - Comunicación: adjuntar fotos + referencias dentro del chat.
  - Notificaciones: push/in-app útiles (sin spam).

- [ ] **Editor de planes mejorado**
  - Drag & drop de workouts entre semanas
  - Templates de planes pre-hechos
  - Duplicar plan existente
  - Vista previa del plan desde el lado del alumno

- [ ] **Biblioteca de ejercicios expandida**
  - Importación masiva desde CSV/PDF
  - Video tutorials (YouTube/Vimeo embebido)
  - Filtros avanzados (músculo, equipment, dificultad)
  - Ejercicios favoritos del coach

- [ ] **Notificaciones push mejoradas**
  - Recordatorios de entrenamiento (a horario fijo)
  - Alertas de inactividad (si no entrenó en X días)
  - Resumen semanal por email

- [ ] **Seguimiento de progreso**
  - Gráficos de volumen por músculo
  - Progresión de pesos (1RM estimado)
  - PRs (Personal Records)
  - Comparativa con semana anterior

### Medium Priority

- [ ] **Scoring de comidas mejorado**
  - Versión configurable por coach
  - Integración con APIs de nutrición (MyFitnessPal)
  - Registro de agua

- [ ] **Métricas avanzadas**
  - TDEE estimado
  - Zona cardíaca objetivo
  - Frecuencia cardíaca en reposo (tendencia)

- [ ] **Chat enriquecido**
  - Envío de fotos
  - Notas de voz
  - Stickers/reacciones
  - Mensajes programados

- [ ] **Reviews post-sesión**
  - Cómo se sintió (RPE global)
  - Dolor/molestias reportadas
  -备注 para el coach

---

## 🌱 Modelo Sin Coach (Self-Service)

### Athlete Solo

- [ ] **Biblioteca de workouts**
  - Workouts públicos de la comunidad
  - Categorías (fuerza, cardio, funcional)
  - Dificultad y duración

- [ ] **Creador de rutinas**
  - Plantillas por objetivo (perder peso, ganar músculo)
  - wizard de creación paso a paso
  - AI assistant para sugerir ejercicios

- [ ] **Modo guiado**
  - Timer automático entre ejercicios
  - Countdown de descanso
  - Audio cues

- [ ] **Integración con wearables (self-service)**
  - Propio dashboard sin coach
  - Metas personales configurables

---

## 🏋️ Modo Gimnasio (Grupo)

### Para Gimnasios

- [ ] **TV Mode**
  - Mostrar workouts en pantalla TV
  - Timer gigante con countdown
  - Auto-avance entre ejercicios
  - Sonido/alertas

- [ ] **Clases grupales**
  - Scheduling de clases
  - Bookings/cupos
  - Lista de espera
  - Cancelaciones

- [ ] **Leaderboard grupal**
  - Ranking semanal de asistentes
  - Competencias entre members
  - Trofeos/badges grupales

- [ ] **Panel de admin**
  - Gestión de members
  - Reportes de asistencia
  - Facturación
  - Configuración de clases

---

## 📊 Analytics & Insights

### Para Coachees

- [ ] **Dashboard de analytics**
  - Tendencia de fuerza (por músculo)
  - Volumen total por semana
  - Intensidad promedio
  - Frecuencia de entrenamiento

- [ ] **Reportes automáticos**
  - Resumen semanal por email
  - Progreso vs metas
  -Insights generados por IA

- [ ] **Predicciones**
  - Estimated 1RM por ejercicio
  - Proyección de progreso
  - Fecha estimada de objetivo

### Para Coaches

- [ ] **Dashboard de alumnos**
  - Vista consolidada de todos
  - Alertas de inactividad
  - Progress compartido

- [ ] **Reportes comparativos**
  - Comparar progreso entre alumnos
  - Media de métricas por grupo
  - Eficacia de planes

---

## 🎮 Gamification

### Badges & Achievements

- [ ] **Sistema de badges expandido**
  - Badges por streak (7, 30, 100 días)
  - Badges por volumen (primer mes de consistencia)
  - Badges por PRs
  - Badges por exploración (probó todos los tipos de workout)

- [ ] **Streaks**
  - Racha de días consecutivos
  - Freeze days (saltar uno sin perder racha)
  - Record de racha

- [ ] **Leaderboards**
  - Semanales/mensuales
  - Por cantidad de workouts
  - Por volumen total

- [ ] **Desafíos**
  - Desafíos de 30 días
  - Desafíos grupales (coach vs alumnos)
  - Desafíos comunitarios

### Motivación

- [ ] **Celebraciones**
  - Animación al completar workout
  - Confetti en PR
  - Sonidos de achievement

- [ ] **Progresión visual**
  - Niveles de usuario
  - XP por acciones
  - Desbloqueo de contenido

---

## 📱 Integraciones & Sync

### Wearables

- [ ] **Más providers**
  - Polar
  - Fitbit
  - Whoop
  - Apple Health (iOS)
  - Samsung Health

- [ ] **Datos enriquecidos**
  - HRV (Heart Rate Variability)
  - Temperatura corporal
  - SpO2
  - Recovery score

- [ ] **Auto-detección de actividad**
  - Detectar workout automáticamente
  - Sugerir registrarlo

### APIs Externas

- [ ] **Integraciones de nutrición**
  - MyFitnessPal
  - MacroFactor
  - Cronometer

- [ ] **Mapas & Rutas**
  - Strava para cycling/running
  - Rutas de running guardadas
  - Elevación y distancia

---

## 🔧 Technical Improvements

### Performance

- [ ] **Offline mode**
  - Cache de workouts
  - Queue de acciones para sync
  - Funcionar sin internet

---

## Futuro (Contenido + IA + Email)

### 1) Biblioteca “premium” de ejercicios (imagen + video obligatorios)

- [ ] Definir estándar de contenido (estilo visual, duración, ángulos, naming).
- [ ] Flujo de carga y QA (estado “completo/incompleto” por ejercicio).
- [ ] Sustituciones: mapa de equivalencias por patrón/músculo/equipo.

### 2) IA para media (recomendación inicial)

- **Imágenes**: Midjourney (calidad/consistencia) o SDXL (control/pipeline).
- **Video**: Runway / Luma / Pika / Kling (según disponibilidad). Estrategia sugerida: image → video con estilo cerrado.

### 3) Emails transaccionales (cobro, plan por vencer, etc.)

- [ ] Definir eventos (pago fallido, plan por vencer, nuevo plan, inactividad).
- [ ] Proveedor recomendado: Resend o Postmark.
- [ ] Templates mínimos (1 base + 2-3 eventos).

### 4) Agentes IA (asistente del coach / self-coach)

- [ ] Asistente de sustituciones (rápido, alto valor): “no puedo X, sugerime Y”.
- [ ] Asistente “coach” para atleta sin coach (más grande): preferencias → rutina → seguimiento.

- [ ] **PWA improvements**
  - Install prompt
  - Push notifications nativas
  - Splash screen

- [ ] **Code splitting**
  - Lazy load de páginas pesadas
  - Lazy load de componentes (charts, media viewer)

### DX (Developer Experience)

- [ ] **Testing**
  - Unit tests (Vitest)
  - Integration tests
  - E2E tests (Playwright)

- [ ] **Storybook**
  - Componentes documentados
  - Visual testing

- [ ] **Monitoreo**
  - Error tracking (Sentry)
  - Analytics de uso
  - Performance monitoring

### Security

- [ ] **Auth mejorada**
  - Refresh tokens
  - Token revocation
  - 2FA

- [ ] **Rate limiting**
  - Por IP
  - Por usuario
  - Por endpoint

- [ ] **Validación**
  - Zod en todos los endpoints
  - Sanitización de inputs

---

## 📄 Documentos & Exportación

### Exportación

- [ ] **PDF de workouts**
  - Plan imprimible
  - Con imágenes de ejercicios
  - QR codes para videos

- [ ] **PDF de progreso**
  - Reporte mensual
  - Gráficos incluidos

- [ ] **Compartir**
  - Compartir workout en redes
  - Link público de workout
  - Embed en web

### Importación

- [ ] **Carga masiva**
  - Importar ejercicios desde CSV
  - Importar workouts desde PDF
  - Importar desde otras apps

- [ ] **Templates**
  - Template library
  - Importar/Exportar plan

---

## 🌍 Internacionalización

- [ ] **i18n**
  - Español (actual)
  - Inglés
  - Portugués
  - Alemán

- [ ] **Moneda/País**
  - Precios en moneda local
  - Unidades imperiales/métricas

---

## 💰 Monetización

### Suscripciones

- [ ] **Planes de pago**
  - Free tier (limitado)
  - Pro (coach + features)
  - Gym (multi-usuario)

- [ ] **Paywalls**
  - Límite de alumnos (Free: 3)
  - Límite de workouts (Free: 20)
  - Analytics avanzados (Pro)

### Marketplace

- [ ] ** marketplace de planes**
  - Coaches venden planes
  - Comisiones

- [ ] ** marketplace de ejercicios**
  - Ejercicios premium
  - Videos profesionales

---

## 📋 Priorización Sugerida

### Q3 2026 (Inmediato)

1. ✅ ~~Editor de planes mejorado~~ (DRAG & DROP)
2. ✅ ~~Biblioteca expandida con videos~~
3. ✅ ~~Notificaciones push mejoradas~~
4. ✅ ~~Dashboard de progreso con charts~~
5. ✅ ~~Scoring de comidas configurable~~

### Q4 2026 (Corto plazo)

6. Self-service mode (athlete solo)
7. Gamification (streaks, badges)
8. Leaderboards
9. Más providers de sync (Polar, Fitbit)
10. TV Mode básico

### 2027 (Mediano plazo)

11. Modo Gimnasio completo
12. Panel de admin
13. Analytics avanzados con IA
14. Marketplace de planes
15. i18n (Inglés, Portugués)

---

> **Nota**: Este es un documento vivo. Agregar ideas conforme surjan.
