# Roadmap de Features — Ideas para Crecer

> Listado de ideas organizadas por prioridad y módulo.
> Basado en la conversación inicial y mejoras identificadas.

---

## 🚀 Funcionalidades del Negocio Principal

### Para el Modelo Actual (Coach → Alumno)

#### High Priority

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
