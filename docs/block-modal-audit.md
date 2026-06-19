# Auditoría de claridad: Modal de creación de bloques

## Problemas identificados

### 1. Orden confuso
El resumen aparece **antes** de los campos. El usuario ve "Duración total: —" antes de poder configurar nada.

### 2. Narrativa inconsistente por tipo

| Tipo | ¿Qué confunde? |
|------|----------------|
| **EMOM** | `rounds` en el backend se llama "Minutos totales" en el UI. ¿Es minutos? ¿Es rondas? |
| **AMRAP** | `totalSeconds` guardado en segundos, pero mostrado en minutos. El usuario no sabe la unidad. |
| **Tabata/HIIT** | "Series / tabatas" como label. ¿Son tabatas o series? |
| **Fuerza** | Solo tiene "Tiempo objetivo" y "Descanso entre ejercicios". No se configuran sets/reps. |
| **Cardio** | "Cardio continuo" vs "Running por pasadas". ¿Y si es bici? ¿Y si es remo? |
| **Calentamiento/Recuperación** | OK pero muy básicos. |

### 3. Campos duplicados
- "Descanso final (seg)" en `interval-block-builder`
- "Descanso después del bloque (seg, opcional)" en `block-modal-fields`
Son lo mismo, pero tienen nombres distintos.

### 4. Resumen técnico
El `BlockModalSummary` tiene 3 cards con labels como "SERIE / RONDA", "TRABAJO TOTAL", "DESCANSO TOTAL". Es demasiado para leer. Debería ser una línea simple: "13 minutos · 20 rondas · 3 series".

### 5. Ayuda mezclada con config
"CONFIGURACIÓN TIPO RECETA" y "EMOM: cada minuto reinicia..." aparecen entre los campos. Debería ser una intro corta, no una card intermedia.

---

## Propuesta de mejora

### Principio: Narrativa única por tipo

Cada tipo de bloque sigue el mismo flujo mental:

1. **¿Qué tipo de bloque?** (Selector de patrón — ya está)
2. **¿Cómo se llama?** (Nombre + descripción)
3. **¿Cuánto dura?** (Duración principal del bloque)
4. **¿Cómo se descansa?** (Descansos entre ejercicios, entre series, después del bloque)
5. **¿Cómo se asignan los ejercicios?** (Solo para intervals con rotación)
6. **Resumen** (Una línea de texto, no cards)

### Cambios por tipo

| Tipo | Pregunta principal | Campos a mostrar |
|------|-------------------|-----------------|
| **EMOM** | ¿Cuántos minutos dura el bloque? | Minutos · Preparación · Descanso entre ejercicios |
| **AMRAP** | ¿Cuántos minutos en total? | Minutos · Preparación · Descanso entre ejercicios |
| **Tabata/HIIT** | ¿Cuánto trabajo? ¿Cuánto descanso? | Trabajo · Descanso · Rondas · Series · Descanso entre series |
| **Fuerza** | ¿Cuántas series? ¿Cuántas reps? | Series por ejercicio · Reps · Descanso entre series · Descanso entre ejercicios |
| **Cardio** | ¿Cuántos minutos? ¿Qué intensidad? | Duración · Zona · Pasadas (opcional) |
| **Calentamiento/Recuperación** | ¿Cuántos minutos aproximadamente? | Duración · Descanso entre ejercicios |

### Cambios concretos

1. **Eliminar `BlockModalSummary` cards** → Reemplazar por una línea de texto simple al final
2. **Eliminar "RecipeHint"** → Reemplazar por una intro de 1 línea debajo del selector de patrón
3. **Unificar descanso** → Un solo campo "Descanso después del bloque" al final
4. **EMOM**: `rounds` → label "¿Cuántos minutos dura el bloque?"
5. **AMRAP**: `totalSeconds` → label "¿Cuántos minutos en total?" (con conversión transparente)
6. **Fuerza**: Agregar campos de sets/reps/descanso entre series
7. **Tabata/HIIT**: Label "Series / tabatas" → "¿Cuántas series?"
8. **Cardio**: Label "Modo de bloque" → "¿Con pasadas?" (sí/no toggle)
9. **Reordenar**: Resumen al final del formulario

---

## Implementación

Archivos a modificar:
- `block-modal-fields.tsx` — Reordenar, eliminar summary duplicado
- `interval-block-builder.tsx` — Simplificar, eliminar RecipeHint
- `emom-block-builder.tsx` — Cambiar labels
- `amrap-block-builder.tsx` — Cambiar labels
- `block-modal-summary.tsx` — Simplificar a una línea
- `cardio-block-builder.tsx` — Simplificar modo
- `recovery-block-builder.tsx` — Cambiar labels