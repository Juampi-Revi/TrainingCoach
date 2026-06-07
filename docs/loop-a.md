# Loop A — Fortalecer lo que ya existe (Core + UX + Comunicación)

## Objetivo

Hacer que el producto sea **confiable y fácil** en el día a día:

- Entrenar sin dudas (guardar series, estados, parciales).
- Semana e historial consistentes (sin números “raros”).
- Comunicación coach↔alumno rápida, contextual y con media (fotos).
- Notificaciones que ayuden (no que molesten).

---

## Alcance (qué entra)

### A) Entrenamiento en vivo (client)

- Logger de series:
  - Guardado por serie (acción explícita) o autoguardado seguro por fila.
  - Placeholders como sugerencia (no deben convertirse en datos por default).
  - Estados claros por serie y por ejercicio (completada / parcial).
- Estados de sesión:
  - Definir contrato: `in_progress`, `partial`, `completed`, `discarded`.
  - Definir cuándo una sesión se considera “hecha” para el numerador.

### B) Semana vs Historial (client)

- Definir reglas de conteo:
  - Qué suma a “Sesiones X/Y”.
  - Qué se considera “Pendiente” vs “Completada” vs “Parcial”.
- Asegurar consistencia entre:
  - `/semana` (vista semanal)
  - `/historial` (listado)
  - Detalle de sesión y pantalla de “completada”

### C) Comunicación coach↔alumno (messaging)

- Enviar fotos en chat (mínimo viable).
- “Referencias” contextuales:
  - poder linkear a una sesión, ejercicio, o plan desde un mensaje.
- UX: reducir fricción (borrar, reenviar, estados de envío, errores claros).

### D) Notificaciones (in-app + push)

- Notificación por “nuevo mensaje”.
- Notificación por “nuevo plan asignado” y/o “sesión completada”.
- Preferencias mínimas (activar/desactivar por tipo).

---

## Fuera de alcance (por ahora)

- Generación de media con IA (Loop B).
- Emails transaccionales (se diseña después de estabilizar Loop A).
- Asistente IA de sustituciones (depende de biblioteca de ejercicios más cerrada).

---

## Definiciones (para evitar ambigüedad)

### Sesión “completada” vs “parcial”

- `completed`: el usuario finaliza la sesión y el sistema la considera cerrada.
- `partial`: existe sesión con sets registrados pero no finalizada (o con ejercicios sin cumplir).
- `in_progress`: iniciada y activa (en curso).
- `discarded`: descartada (no cuenta para nada).

Decisión de producto pendiente:
- ¿`partial` suma a “Sesiones X/Y”? Recomendación: mostrar dos métricas:
  - “Completadas: X/Y”
  - “Hechas (incluye parciales): X/Y”

---

## Backlog ejecutable (orden sugerido)

### P0 (no negociable)

1) Unificar reglas de estados y conteo (Semana + Historial).
2) Logger: guardado por serie (o autoguardado por fila) sin efectos colaterales.
3) UI: mostrar claramente “Parcial” y por qué.
4) Errores/edge cases en prod: errores claros y sin romper el flujo.

### P1 (mejora fuerte de UX)

5) Chat: enviar fotos.
6) Chat: referencias a sesión/ejercicio/plan.
7) Push/in-app: notificar mensajes y eventos clave.
8) Preferencias de notificaciones por tipo.

---

## Checklist de QA (manual)

### Entrenamiento

- Iniciar sesión, abrir logger, guardar 1 serie: persiste solo esa fila.
- Abrir logger y apretar guardar sin completar nada: no crea sets.
- Timed exercise: guardar duración y esfuerzo sin reps.
- Warmup: completar warmup y finalizar sesión: no aparece como “faltante”.

### Semana vs Historial

- Semana muestra el mismo estado que historial para la misma fecha/sesión.
- Duplicados de template en la semana: cada item muestra la sesión correcta.
- Sesión manual/no asociada: no “roba” un slot del plan.

### Mensajes

- Enviar foto: se sube, se ve, y queda en historial.
- Error de red: se muestra fallo y se puede reintentar.

### Notificaciones

- Mensaje nuevo: aparece notificación.
- Preferencias: al desactivar, deja de notificar.
