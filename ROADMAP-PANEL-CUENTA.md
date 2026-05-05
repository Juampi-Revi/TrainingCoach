# ROADMAP — Rediseño Mi Panel + Nueva sección Cuenta

> Documento de planificación. No codear hasta que cada fase esté aprobada.  
> Última actualización: 2026-05-04

---

## Contexto y motivación

La sección **Progreso** actual es una página monolítica con 6 tabs (Dashboard, Actividad, Sueño, Mediciones, Comidas, Entrenamientos). Es funcional pero desconectada del flujo diario del alumno.

**Objetivo**: que Mi Panel pase de ser un resumen estático a ser el **diario de salud visual** del alumno. Las métricas secundarias (metas, mediciones) van a una nueva sección **Cuenta**. Progreso desaparece.

---

## Nueva navegación

Tab bar de 3 ítems (el actual tiene 4 con Progreso):

```
[ Panel ]     [ Semana ]     [ Cuenta ]
  (home)     (plan semana)   (perfil + datos)
```

La sesión activa sigue siendo un overlay/page separado, no un tab.

---

## Fase 1 — Nueva sección Cuenta

### Estructura de rutas

```
app/(client)/cuenta/
  page.tsx                      ← index: lista de secciones
  metas/
    page.tsx                    ← ver y editar metas
  mediciones/
    page.tsx                    ← historial + nueva medición
  perfil/
    page.tsx                    ← nombre, foto, email, contraseña
  wearable/
    page.tsx                    ← placeholder sync (fase 6)
```

### 1.1 Metas de salud

El alumno carga sus propias metas (idealmente guiado por el coach en el onboarding, pero siempre propiedad del alumno). No las crea el coach directamente — esto preserva la libertad del alumno si en el futuro usa la app sin coach o con coach virtual.

**Metas disponibles (MVP):**
- Pasos diarios (número entero)
- Horas de sueño (decimal, ej: 7.5)
- Entrenamientos por semana (número entero)

**Modelo de privacidad:**
- Toggle: "Compartir mis metas con mi coach" (on/off, default: on)
- Si no tiene coach vinculado, el toggle no aparece

**Schema BD sugerido** (ya existe `HealthGoal` en la API):
```
kind: "steps_daily" | "sleep_daily" | "workouts_weekly"
targetInt: number           ← pasos o minutos de sueño
targetNumber: string        ← para decimales (ej: horas de sueño)
unit: string
period: "daily" | "weekly"
startDate: date
endDate: date | null
shareWithCoach: boolean     ← NUEVO campo
```

**UX:**
- Lista de metas activas con valor actual vs meta (ring o barra de progreso)
- Botón "Editar meta" inline (no modal separado)
- Sección vacía con CTA "Definir mis primeras metas" para onboarding

---

### 1.2 Mediciones corporales

Historial de métricas físicas. El alumno las carga, idealmente como parte del seguimiento con el coach.

**Campos:**
- Peso (kg)
- Cintura (cm)
- Cadera (cm)
- Pecho (cm)
- Brazo (cm)
- Muslo (cm)
- Notas (texto libre)
- Fecha de medición

**Modelo de privacidad:**
- Toggle: "Compartir mis mediciones con mi coach" (on/off, default: on)
- Independiente del toggle de metas

**UX:**
- Card de la última medición siempre visible arriba
- Timeline de historial (fecha + valores que cambien vs anterior)
- Botón "+ Nueva medición" abre un formulario compacto
- Sin gráficos en esta fase (van en la futura pestaña Estadísticas de Mi Panel)

---

### 1.3 Perfil

- Nombre, foto de perfil
- Email (read-only si usa auth externa)
- Cambiar contraseña
- Cerrar sesión

---

### 1.4 Wearable (placeholder — no implementar ahora)

Pantalla con:
- Listado de dispositivos soportados (Fitbit, Garmin, Apple Watch, Samsung, Xiaomi/Zepp, Oura)
- Todos con estado "Próximamente"
- Botón "Ingresar datos a mano" que redirige al log manual de Panel
- Copy: "Mientras tanto podés registrar tus pasos y sueño manualmente desde Mi Panel"

---

## Fase 2 — Rediseño Mi Panel

### Estructura visual (de arriba hacia abajo)

```
┌──────────────────────────────────┐
│  HEADER                          │
│  Lunes 5 de mayo                 │
│  "Buen día, Juan 💪"             │
├──────────────────────────────────┤
│  ENERGÍA DEL DÍA                 │
│  ●●●●○  4/5  (ya existe)         │
├──────────────────────────────────┤
│  RINGS — Actividad del día       │
│  🟢 Pasos   🔵 Sueño   🟠 Entreno│
│  8.2k/10k   7h/8h      1/1       │
├──────────────────────────────────┤
│  COMIDAS                         │
│  Desayuno  🟢   Almuerzo  🟡     │
│  Merienda  🔴   + Agregar        │
├──────────────────────────────────┤
│  SEMANA EN CURSO                 │
│  Lu  Ma  Mi  Ju  Vi  Sa  Do      │
│  🟢  🟢  🟡  🟢  ░   ░   ░      │
├──────────────────────────────────┤
│  [+ Pasos] [+ Sueño] [+ Comida] │  ← FAB o botones fijos arriba del tab bar
└──────────────────────────────────┘
```

---

### 2.1 Rings del día

Tres arcos de progreso circular (o semicircular) con animación al cargar:

| Ring | Métrica | Color | Fuente de datos |
|---|---|---|---|
| 🟢 Verde | Pasos | `var(--lime)` | Health entry `steps` |
| 🔵 Azul | Sueño | `#7AB8FF` | Health entry `sleepMinutes` |
| 🟠 Naranja | Entrenamiento | `var(--warn)` | Sessions completadas hoy |

- Sin meta configurada → muestra el valor absoluto, arco fijo al 60%
- Con meta → arco se llena proporcionalmente, cambia a color de éxito (var(--success)) al llegar al 100%
- Tap en un ring → expande detalles o abre quick log

---

### 2.2 Comidas del día

- Lista de comidas del día agrupadas (Desayuno, Almuerzo, Cena, Merienda, Snack)
- Cada una con chip de color (scoring — ver sección 5)
- + botón para agregar (abre el QuickFoodLogger que ya existe)
- Sin comidas → "No registraste nada hoy. ¿Empezamos?"

---

### 2.3 Resumen semanal — heatmap compacto

7 columnas (lunes a domingo de la semana actual) × 3 filas:
- Fila 1: pasos (chip de color: verde si llegó a meta, amarillo si >50%, rojo si <50%, gris si no registró)
- Fila 2: sueño (misma lógica)
- Fila 3: entrenamiento (verde si completó el que tenía agendado, gris si no había, rojo si tenía y no hizo)

Al fondo de la semana: "Resumen del mes" como link → abre un modal con el grid de 30 días (el que ya existe en Progreso).

---

### 2.4 Quick actions

Tres botones siempre accesibles, pegados arriba del tab bar:

- **+ Pasos**: modal con input numérico + fecha (default hoy) + botón "Guardar"
- **+ Sueño**: modal con horas y minutos + fecha
- **+ Comida**: abre el QuickFoodLogger existente

Cuando haya sync con wearable, "Pasos" y "Sueño" mostrarán primero el botón "Sincronizar" con fallback a ingreso manual.

---

## Fase 3 — Migración y eliminación de Progreso

### Destino de cada tab actual de Progreso

| Tab actual | Nuevo destino |
|---|---|
| Dashboard | Eliminado (fusionado en Mi Panel) |
| Actividad (30 días, grid) | Mi Panel → modal "Ver mes completo" |
| Sueño (historial, form) | Mi Panel → quick action + historial dentro de ring |
| Mediciones | Cuenta → /cuenta/mediciones |
| Comidas | Mi Panel → sección Comidas del día |
| Entrenamientos (sesiones, progresión) | Diferido → futura pestaña Estadísticas |

### Ruta /progreso

Crear redirect `app/(client)/progreso → /panel` para no romper links existentes.

### Tab bar

Reemplazar el ítem "Progreso" por "Cuenta" con ícono de persona.

---

## Fase 4 — Vista del coach (alumno detail)

En la ficha del alumno (`/coach/alumnos/[clientUserId]`), nueva sección en el panel del coach:

### 4.1 Resumen de la semana actual

```
┌─────────────────────────────────────┐
│  Esta semana                        │
│  Pasos prom: 7.200   Sueño: 7h 10m  │
│  Entrenos: 2 / 3 planificados       │
│  Comidas registradas: 15            │
└─────────────────────────────────────┘
```

### 4.2 Log de los últimos 14-21 días

Timeline vertical. Cada día es una fila con chips de color:
- 👟 Pasos: verde/amarillo/rojo según meta del alumno (si la compartió) o umbral fijo (si no)
- 🌙 Sueño: mismo criterio
- 💪 Entrenamiento: verde = completó, gris = no tenía, rojo = tenía y no hizo
- 🍽 Comidas: conteo del día

Al tocar un día → expandir con el detalle completo (valores, comidas, notas).

### 4.3 Metas y Mediciones (con privacidad)

Solo visibles si el alumno tiene el toggle ON:
- **Metas**: lista con valor actual vs meta (misma visualización que ve el alumno)
- **Mediciones**: última medición + botón "Ver historial"

Si el toggle está OFF → el coach ve un mensaje: *"Este alumno eligió no compartir sus [metas/mediciones]"* — no ve los datos en blanco, ve el aviso explícito.

---

## Fase 5 — Sistema de scoring de comidas

### Filosofía

El scoring es **incremental y configurable**. No intentamos resolver la nutrición, solo damos feedback visual que el coach puede ajustar.

### Versión 1 (MVP — lógica fija)

| Score | Color | Criterio inicial |
|---|---|---|
| 🟢 Bueno | `var(--success)` / verde | Tiene descripción y parece una comida completa |
| 🟡 OK | `var(--warn)` / amarillo | Registrado pero breve / poco detalle |
| 🔴 No ideal | `var(--danger)` / rojo | No registrado cuando había meta de comidas |

En esta versión: verde = registró algo, amarillo = registró muy poco (< N caracteres), rojo = no registró. Simple.

### Versión 2 (con configuración por coach)

Agregar en el panel del coach, dentro de la ficha del alumno:

```
Scoring de comidas para este alumno
┌────────────────────────────────┐
│ ¿Cuántas comidas espero/día? [4] │
│ Considerar "bien" si:            │
│  □ Incluye proteína              │
│  □ Incluye vegetales             │
│  □ Sin fast food mencionado      │
└────────────────────────────────┘
```

Estos criterios se guardan por alumno y el sistema aplica lógica simple de keywords + conteo para derivar el score.

### Versión 3 (IA — diferido)

Pasar el texto de la comida a un modelo de lenguaje que devuelva un score y una sugerencia. El coach puede aprobar o sobrescribir la sugerencia.

---

## Fase 6 — Sync con wearables

### Decisión de arquitectura

**No construir integraciones individuales** con cada plataforma. Usar un servicio intermediario.

**Recomendación: Terra API**

| Por qué Terra | Detalle |
|---|---|
| Cubre todas las plataformas relevantes | Garmin, Samsung Health, Zepp/Mi Band, Apple Health, Google Health Connect, Fitbit, Polar, Oura, Whoop |
| Web-first friendly | Widget OAuth hosted para plataformas web-compatibles; SDK mobile ligero para HealthKit/Samsung |
| Tier gratuito | ~50 usuarios conectados/mes (suficiente para MVP) |
| No requiere acuerdos individuales | Terra ya tiene los partner agreements con Garmin, Samsung, etc. |
| Webhooks | Los datos llegan al backend via webhook, sin polling |

**Plataformas cubiertas con Terra:**

| Plataforma | Tipo de integración | Datos disponibles |
|---|---|---|
| Garmin | OAuth web (Terra tiene partner agreement) | Pasos, sueño, HR, HRV, Body Battery, estrés |
| Samsung Health | Via Terra Android SDK | Pasos, sueño, HR, ejercicio |
| Xiaomi / Zepp / Mi Band | Via Terra | Pasos, sueño, HR (disponibilidad limitada según modelo) |
| Fitbit | OAuth web directo o via Terra | Pasos, sueño por etapas, HR, SpO2, HRV |
| Apple Health | Via Terra iOS SDK (necesita app nativa) | Todo: pasos, sueño, HR, ECG, etc. |
| Oura Ring | OAuth web directo o via Terra | Sueño por etapas, readiness, HRV, temperatura |
| Whoop | OAuth web (requiere apply) | Recuperación, strain, sueño, HR |

**Para Apple Health y Samsung sin app nativa:** Terra provee un lightweight WebView SDK / hosted flow que puede funcionar dentro de un PWA instalado, pero la experiencia es limitada. Para cobertura completa de iOS users → eventual app React Native.

### Precios Terra (referencia 2025)

| Plan | Usuarios conectados | Costo |
|---|---|---|
| Developer | ~50/mes | Gratis |
| Starter | ~500/mes | ~$99/mes |
| Growth | ~2.000/mes | ~$199/mes |
| Scale | Ilimitado | Pricing negociado |

### Orden de implementación del sync

1. Primero: UI placeholder en Cuenta → /cuenta/wearable (ya en Fase 1)
2. Integración: Terra OAuth flow en web + webhook receiver en API
3. Mapping: datos de Terra → `HealthEntry` en nuestra BD (pasos y sueño del día)
4. UX: en Mi Panel, si tiene wearable conectado → "Último sync: hace 2h" + botón "Sincronizar ahora"
5. Conflictos: si el usuario tiene dato manual Y sync del mismo día → mostrar ambos con opción de elegir cuál usar (o merge automático con el mayor)

---

## Impacto en la BD (resumen de cambios)

### Tabla `HealthEntry` (ya existe)

Agregar o verificar que existen:
- `steps` — ya existe
- `sleepMinutes` — ya existe
- `sportType` / `sportMinutes` — ya existen
- `wearableSource` (string nullable) — NUEVO: "terra", "fitbit", "manual"
- `wearableRawId` (string nullable) — NUEVO: ID del sync para deduplicación

### Tabla `HealthGoal` (ya existe)

Agregar:
- `shareWithCoach` (boolean, default: true) — NUEVO

### Tabla `MetricEntry` (ya existe)

Agregar:
- `shareWithCoach` (boolean, default: true) — NUEVO

### Nueva tabla `WearableConnection`

```
id
userId
provider: "terra" | "fitbit" | "garmin" | "oura" ...
providerId (ID del usuario en la plataforma externa)
accessToken (encrypted)
refreshToken (encrypted)
lastSyncAt
status: "active" | "disconnected" | "error"
createdAt
updatedAt
```

---

## Resumen de fases

| Fase | Qué se construye | Dependencias |
|---|---|---|
| **1** | Sección Cuenta: metas, mediciones, privacidad, perfil | Ninguna |
| **2** | Rediseño Mi Panel: rings, comidas del día, resumen semanal, quick actions | Metas (Fase 1) para los anillos |
| **3** | Migrar data de Progreso, eliminar /progreso, actualizar nav | Fases 1 y 2 completas |
| **4** | Vista del coach con daily log, metas y mediciones del alumno | Fase 1 (privacidad) + Fase 2 (datos) |
| **5** | Scoring de comidas: versión 1 (simple) + versión 2 (configurable por coach) | Fase 2 (comidas en Panel) + Fase 4 (coach view) |
| **6** | Sync con wearables via Terra API | BD: WearableConnection + fields nuevos en HealthEntry |

---

## Lo que se difiere explícitamente

- **Estadísticas de ejercicio** (progresión 1RM, PR, volumen por músculo): futura pestaña en Mi Panel
- **Gráficos de peso en tendencia**: mismo lugar
- **Scoring de comidas con IA** (versión 3): después de tener suficiente data
- **App nativa iOS/Android**: necesaria para Apple Health sin intermediario y para experiencia offline completa
- **Integración individual con cada wearable** (sin Terra): no vale la pena, cada uno tiene su propio proceso de aprobación

---

> Para arrancar: definir si la Fase 1 (Cuenta) o la Fase 2 (Panel) tiene más prioridad.  
> Recomendación: Fase 1 primero porque los rings de Mi Panel necesitan las metas para ser significativos.
