# Arquitectura (C4) — PWA hoy, app nativa más adelante

## Decisión base
Para validar el producto rápido y con buena UX en el gym:
- Hoy: Web App responsive + PWA (instalable como “app” en iOS/Android).
- Futuro: App nativa (React Native/Expo o similar) reutilizando la misma API y DB.

Stack propuesto (MVP):
- TypeScript end-to-end (frontend y backend).
- Web/PWA: Next.js (App Router).
- Backend: API en Next.js (route handlers) o servicio Node separado si crece.
- DB: PostgreSQL.

## C4 — System Context

```mermaid
flowchart LR
  Coach[Coach (Usuario)]
  Client[Alumno/Cliente (Usuario)]
  Web[PWA / Web App\nTypeScript]
  API[Backend API\nTypeScript]
  DB[(PostgreSQL)]
  Storage[(Object Storage\nFotos/Videos)]
  Auth[Servicio Auth\n(o módulo interno)]

  Coach --> Web
  Client --> Web
  Web --> API
  API --> DB
  API --> Storage
  Web --> Auth
  API --> Auth
```

## C4 — Containers (propuesta)

```mermaid
flowchart TB
  subgraph ClientSide[Cliente]
    WebPWA[PWA (Next.js + TS)\nMobile-first]
    FutureNative[App Nativa (Futuro)\nReact Native/Expo + TS]
  end

  subgraph ServerSide[Servidor]
    Backend[Backend API\nREST\nNode/TypeScript]
    Database[(PostgreSQL)]
    Obj[(Object Storage\nS3-compatible)]
  end

  WebPWA --> Backend
  FutureNative --> Backend
  Backend --> Database
  Backend --> Obj
```

## Responsabilidades por capa

### PWA (web)
- Autenticación y sesión.
- Vistas: planificación, sesión de entrenamiento, métricas, dashboard coach.
- Experiencia “gym”: guardar borradores de sets y evitar pérdidas por mala conexión (si se implementa offline parcial).

### Backend API
- Autorización por rol y por relación coach↔alumno.
- Gestión de planes, templates, ejercicios, alternativas.
- Registro de sesiones, sets, métricas corporales y (MVP2) comidas.
- Auditoría de cambios clave (opcional).

### DB (PostgreSQL)
- Fuente de verdad para reporting, timeline y consistencia de datos.

### Storage (MVP2)
- Fotos/videos de ejercicios y fotos de comidas.

## Endpoints (borrador orientativo)
- Auth: login/register/logout
- Coach:
  - CRUD planes / semanas / templates
  - CRUD catálogo ejercicios
  - Asignación de plan a alumno
  - Lectura de sesiones/métricas por alumno
- Alumno:
  - Ver plan asignado
  - Crear sesión, registrar sets, finalizar sesión
  - Crear métricas corporales
  - (MVP2) registrar comidas

## Consideraciones no-funcionales (MVP)
- Seguridad: control de acceso estricto por coach↔alumno.
- Performance: payloads pequeños en pantalla de sesión.
- Trazabilidad: registrar swaps a alternativas y cambios en sesión.
