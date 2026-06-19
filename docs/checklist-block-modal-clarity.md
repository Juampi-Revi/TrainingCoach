# Checklist de claridad — Modal de creación de bloques

> Después de audit del modal para cada tipo de bloque

## Cambios aplicados

### 1. Orden del formulario
- **Antes**: Resumen → Campos → Descanso
- **Ahora**: Selector → Nombre → Campos → Descanso → Resumen

### 2. Resumen simplificado
- **Antes**: 3 cards con labels técnicos (DURACIÓN TOTAL, SERIE/RONDA, MINUTOS, SERIES, TRABAJO TOTAL, DESCANSO TOTAL)
- **Ahora**: Una línea de texto simple: "13 minutos · 20 rondas · 3 series · 20s trabajo / 10s descanso · + 60s descanso antes del siguiente bloque"

### 3. Descanso unificado
- **Antes**: "Descanso final (seg)" en interval builder + "Descanso después del bloque" en fields
- **Ahora**: Un solo campo al final: "Descanso después del bloque antes del siguiente (seg, opcional)"

---

## Revisión por tipo de bloque

### EMOM
| Pregunta | Label | Placeholder |
|----------|-------|-------------|
| ¿Cuántos minutos? | "¿Cuántos minutos dura el bloque?" | Ej: 20 |
| Preparación | "Segundos de preparación antes de empezar" | Ej: 10 |
| Descanso entre ejercicios | "Descanso entre ejercicios (seg, opcional)" | 0 |
| **Resumen** | `20 minutos · 10s preparación` | |
| **Preview** | `EMOM · 20 minutos · Cada minuto un ejercicio` | |

### AMRAP
| Pregunta | Label | Placeholder |
|----------|-------|-------------|
| ¿Cuántos minutos? | "¿Cuántos minutos en total?" | Ej: 12 |
| Preparación | "Segundos de preparación antes de empezar" | Ej: 10 |
| Descanso entre ejercicios | "Descanso entre ejercicios (seg, opcional)" | 0 |
| **Resumen** | `12 minutos · 10s preparación` | |
| **Preview** | `AMRAP · 12 minutos · Tantas rondas como sea posible` | |

### Tabata / HIIT
| Pregunta | Label | Placeholder |
|----------|-------|-------------|
| Trabajo | "Segundos de trabajo" | Ej: 20 |
| Descanso | "Segundos de descanso" | Ej: 10 |
| Rondas | "Rondas por serie" | Ej: 8 |
| Series | "¿Cuántas series?" | Ej: 3 |
| Descanso entre series | "Descanso entre series (seg)" | Ej: 60 |
| Preparación | "Segundos de preparación antes de empezar" | Ej: 10 |
| Descanso entre ejercicios | "Descanso entre ejercicios (seg, opcional)" | 0 |
| Asignación | "¿Cómo se alternan los ejercicios?" | Repetir el mismo / Rotar por ronda / Rotar por serie / Custom |
| **Resumen** | `13 minutos · 8 rondas · 3 series · 20s trabajo / 10s descanso` | |
| **Preview** | `Tabata · 20s trabajo / 10s descanso · 8 rondas · 3 series · Preparación 10s · Descanso entre series 60s` | |

### Fuerza
| Pregunta | Label | Placeholder |
|----------|-------|-------------|
| Duración | "¿Cuántos minutos aproximadamente?" | Ej: 45 |
| Descanso entre ejercicios | "Descanso entre ejercicios (seg, opcional)" | Ej: 60 |
| **Resumen** | `45 minutos · 60s entre ejercicios` | |
| **Preview** | `Fuerza · 45 minutos · Descanso entre ejercicios 60s` | |

### Cardio
| Pregunta | Label | Placeholder |
|----------|-------|-------------|
| Duración | "¿Cuántos minutos aproximadamente?" | Ej: 45 |
| Intensidad | "Zona o intensidad objetivo" | Ej: Zona 2 · 70-80% FCm |
| Pasadas | "¿Tiene pasadas?" | No, continuo / Sí, con pasadas |
| **Resumen** | `45 minutos · Zona 2` | |
| **Preview** | `Cardio · 45 minutos · Zona 2 · 70-80% FCm` | |

### Calentamiento / Recuperación
| Pregunta | Label | Placeholder |
|----------|-------|-------------|
| Duración | "¿Cuántos minutos aproximadamente?" | Ej: 10 |
| Descanso entre ejercicios | "Descanso entre ejercicios (seg, opcional)" | Ej: 30 |
| **Resumen** | `10 minutos · 30s entre ejercicios` | |
| **Preview** | `Calentamiento · 10 minutos · Descanso entre ejercicios 30s` | |

---

## ¿Qué revisar?

1. [ ] **Abrir modal de crear bloque** — Selector de patrón visible primero
2. [ ] **Seleccionar EMOM** — Campos: minutos, preparación, descanso entre ejercicios
3. [ ] **Seleccionar AMRAP** — Campos: minutos, preparación, descanso entre ejercicios
4. [ ] **Seleccionar Tabata** — Campos: trabajo, descanso, rondas, series, descanso entre series, preparación, descanso entre ejercicios
5. [ ] **Seleccionar Fuerza** — Campos: minutos, descanso entre ejercicios
6. [ ] **Seleccionar Cardio** — Campos: minutos, zona, toggle de pasadas
7. [ ] **Seleccionar Calentamiento** — Campos: minutos, descanso entre ejercicios
8. [ ] **Resumen** — Una línea de texto al final, no cards
9. [ ] **Descanso después del bloque** — Un solo campo al final, no duplicado
10. [ ] **Preview del alumno** — Panel derecho con timeline claro
11. [ ] **TypeScript** — Pasa sin errores

---

## ¿Qué falta? (no implementado en esta pasada)

- **Fuerza**: Campos de sets/reps/descanso entre series por ejercicio (hoy se configura por ejercicio individual)
- **Cardio**: Pasadas con más detalle (ritmo, FC, distancia) — ya funciona con el editor de pasos
- **Nota**: Si el resumen muestra "0min" o "—" para todo, revisar que los presets se carguen correctamente al seleccionar el patrón