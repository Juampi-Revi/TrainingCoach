# 📋 Plan de Desarrollo

> Último update: 2026-05-07

---

## ✅ Completado

### Features
- [x] **Push notifications** (web push + service worker + settings)
- [x] **Coach dashboard** (filtros, búsqueda, quick view modal)
- [x] **Badges system** (14 badges + backend + UI)
- [x] **Health integration** (sync model + wearable settings)
- [x] **Auto-prefill** de pesos/reps de sesión anterior
- [x] **DoneScreen** con botón "Continuar" + countdown
- [x] **Health Providers Connectors** (Garmin, Google Health, Strava) ⭐ NUEVO

### Bugs Fixeados
- [x] Exercise media migration rota → recovery migration
- [x] YouTube URL validation → soporte para shorts
- [x] Recurring workouts → tracking correcto por instancia
- [x] FOUC en /cuenta/metas y /cuenta/mediciones
- [x] Replaced emojis with icons in MediaManager

---

## 🏗️ Health Providers - Arquitectura Implementada

### Estructura
```
apps/api/lib/health/
├── types.ts                    ← Interface HealthProvider + tipos
├── providers/
│   ├── garmin.ts               ← Garmin Health API
│   ├── google-health.ts        ← Google Health (Fitbit) API
│   └── strava.ts               ← Strava API
├── normalizer.ts               ← Merge data de múltiples providers
├── sync-engine.ts              ← Orquestador de sync
└── registry.ts                 ← Registry de providers
```

### Modelos nuevos en BD
- `HealthProviderConnection`: Conexiones OAuth por usuario
- `HealthSyncedActivity`: Datos normalizados sincronizados
- `DailyHealthEntry.source`: Nueva columna para trackear fuente

### API Routes
```
GET  /api/v1/client/sync                          ← Status de conexiones
POST /api/v1/client/sync                          ← Iniciar OAuth
DELETE /api/v1/client/sync                        ← Desconectar
GET  /api/v1/client/sync/garmin/callback          ← OAuth callback
POST /api/v1/client/sync/garmin/sync              ← Sync manual
GET  /api/v1/client/sync/google-health/callback   ← OAuth callback
POST /api/v1/client/sync/google-health/sync       ← Sync manual
GET  /api/v1/client/sync/strava/callback          ← OAuth callback
POST /api/v1/client/sync/strava/sync              ← Sync manual
GET  /api/cron/sync-health                        ← Cron job (cada 6h)
```

### Data que se sincroniza
| Data Type | Garmin | Google Health | Strava |
|-----------|--------|---------------|--------|
| Steps | ✅ | ✅ | - |
| Sleep | ✅ | ✅ | - |
| Heart Rate | ✅ | ✅ | - |
| Stress | ✅ | - | - |
| Body Battery | ✅ | - | - |
| SpO2 | ✅ | - | - |
| Activities | - | - | ✅ |
| Calories | ✅ | ✅ | ✅ |
| Distance | ✅ | ✅ | ✅ |

### Frontend
- `/cuenta/wearable` page completamente renovada
- OAuth flow real (redirect → callback → sync automático)
- Status en tiempo real de conexiones
- Sync manual on-demand
- Alertas de error/éxito

---

## 🚧 En Curso

### Normalización de Estilos
**Problema**: Estilos inline + styled-jsx inconsistentes, sin framework CSS

**Prioridad**: ALTA

**Plan**:
1. Crear `apps/web/lib/styles/tokens.ts` (spacing, font sizes, radius, shadows)
2. Extraer estilos base reutilizables (cards, buttons, badges)
3. Migrar gradualmente componentes existentes

**Opciones evaluadas**:
- [x] Opción 1: Sistema de diseño ligero (recomendada) ✅
- [ ] Opción 2: CSS Modules parciales
- [ ] Opción 3: Tailwind CSS (requiere cambio cultural)

---

## 📅 Futuras Features

### Gamification (Media)
- [ ] **Leaderboards**: Rankings por categoría/coach
- [ ] **Streaks**: Racha de días consecutivos entrenando
- [ ] **Desafíos**: Challenges semanales/mensuales con rewards
- [ ] **Badges rollout**: Habilitar página /cuenta/logros

### Social (Media-Alta)
- [ ] **Compartir logros**: Exportar badges a redes sociales
- [ ] **Competir con amigos**: Retos 1v1
- [ ] **Feed de actividad**: Timeline de logros del grupo

### Analytics (Alta)
- [ ] **Charts de progreso**: Gráficos de pesos, volumen, peso corporal
- [ ] **Predicciones**: Estimación de 1RM, progreso futuro
- [ ] **Reportes semanales**: Resumen por push/email

### Offline & Performance (Media)
- [ ] **Cache de sesiones**: PWA offline para entrenar sin internet
- [ ] **Sync automático**: Re-sync al recuperar conexión
- [ ] **Lazy loading**: Mejorar carga inicial

### Nutrición (Baja-Media)
- [ ] **Tracking básico**: Calorías, macros, agua
- [ ] **Integration**: APIs de nutrición (MyFitnessPal, etc)
- [ ] **Meal plans**: Templates de comidas por coach

### Internacionalización (Baja)
- [ ] **i18n framework**: next-intl o similar
- [ ] **Traducciones**: Inglés, Portugués

---

## 📝 Notas Importantes

### Estilo de código
- **NO usar Tailwind** — sistema de diseño con CSS variables
- **Nunca hardcodear colores hex** → usar `var(--lime)`, etc.
- **Mobile-first** responsive design
- **TypeScript estricto** — nunca `any`

### Deploy
- Docker aplica migrations automáticamente (`prisma migrate deploy`)
- Push notifications requieren `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Health providers requieren credenciales OAuth (ver abajo)

### Reglas duras
- **NUNCA hacer commit/push sin permiso explícito**
- Límites de archivos: Page ≤400, Component ≤300, API route ≤150, Hook ≤100
- Todo `api.get/post/...` necesita `try/catch` con `toast.error`
- Tipos compartidos van en `packages/types/index.ts`

---

## 🔑 Environment Variables para Health Providers

```env
# Garmin Health API
GARMIN_CONSUMER_KEY=          # Consumer key del Developer Program
GARMIN_CLIENT_SECRET=         # Client secret

# Google Health API (Fitbit)
GOOGLE_HEALTH_CLIENT_ID=      # Google Cloud OAuth client ID
GOOGLE_HEALTH_CLIENT_SECRET=  # Google Cloud OAuth client secret

# Strava API
STRAVA_CLIENT_ID=             # Strava application client ID
STRAVA_CLIENT_SECRET=         # Strava application client secret

# Cron jobs
CRON_SECRET=                  # Secret para proteger endpoints de cron
```

### Cómo obtener credenciales:
1. **Garmin**: Aplicar en https://developer.garmin.com/gc-developer-program/
2. **Google Health**: Crear proyecto en Google Cloud Console, habilitar Google Health API
3. **Strava**: Crear app en https://www.strava.com/settings/api

---

## 🔗 Comandos útiles

```bash
# TypeScript check
cd apps/web && npx tsc --noEmit
cd apps/api && npx tsc --noEmit

# Migraciones
cd apps/api && npx prisma migrate dev --name descripcion
cd apps/api && npx prisma generate

# Dev servers
cd apps/web && npm run dev      # puerto 3001
cd apps/api && npm run dev      # puerto 3003
```
