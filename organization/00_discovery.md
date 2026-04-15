# Discovery / Visión del producto

## Contexto
Hoy el flujo entre coach y alumno ocurre principalmente por WhatsApp y mail. El coach envía rutinas en Excel/Word y el alumno:
- Revisa el archivo para saber qué le toca.
- Registra sensaciones, pesos, repeticiones y progreso en chat.
- No tiene un lugar único para guardar mediciones corporales, peso, pasos y otros indicadores.

El objetivo es centralizar planificación + ejecución + feedback, manteniendo trazabilidad y transparencia para entrenamiento a distancia.

## Objetivo
Crear una app web mobile-first (usable en el gym) donde:
- El coach pueda planificar semanas/mesociclos (varias semanas) con rutinas detalladas.
- El alumno pueda ejecutar entrenamientos, registrar resultados por ejercicio/serie y compartir feedback con el coach.
- Ambos puedan ver evolución: adherencia, carga, sensaciones y métricas corporales.

## Personas
- Coach: diseña planificación, monitorea adherencia y progreso, ajusta sobre la marcha.
- Alumno/Cliente: quiere “abrir y hacer”, registrar rápido, y mostrarle al coach datos reales.

## Problemas a resolver (priorizados)
1) Rutinas distribuidas en archivos → baja usabilidad en el gym y poca trazabilidad.
2) Registro de ejecución disperso (WhatsApp) → difícil analizar y dar seguimiento.
3) Medidas/peso/pasos/comidas sin un timeline único → falta de evidencia y control.
4) Adaptaciones en el gym (máquina ocupada) → se pierde el plan o se improvisa sin registro.

## Principios de diseño
- Mobile-first, interacción rápida (modo “gym”).
- “Plantilla vs ejecución”: el plan del coach no se mezcla con lo que pasó en la sesión real.
- Cambio de ejercicio con alternativas sin fricción, pero queda auditado.
- La mínima fricción para registrar sets (pocos taps).

## Alcance por fases

### MVP 1 (núcleo)
- Roles: coach y alumno.
- Coach: crea planes con semanas y entrenamientos; define ejercicios con método/objetivos y alternativas.
- Alumno: ve la planificación; inicia sesión de entrenamiento; registra sets (peso/reps/RPE o RIR) y notas.
- Métricas corporales: peso + medidas (cintura/pecho/cadera/etc.) con timeline y visualización simple.
- Coach: panel por alumno con últimas sesiones, adherencia y métricas.

### MVP 2 (expansión)
- Multimedia más rica (fotos/videos por ejercicio) y biblioteca con filtros (equipamiento, grupo muscular).
- Comidas: registro “general” (texto + opcional foto) para transparencia.
- Integraciones: pasos/sueño (Apple Health/Google Fit) o importación.
- Importación de Excel/Word (asistida).
- Mensajería in-app o eventos de comunicación (mantener WhatsApp como canal, pero con registro).

## Decisiones (propuesta actual)
- Empezar con Web App responsive + PWA (instalable en el celu) para validar flujo y producto.
- Diseñar backend y modelo de datos pensando en que más adelante habrá app nativa (React Native/Expo o similar) reutilizando la misma API.
- DB: PostgreSQL (relacional, ideal para reporting y consistencia).

## Preguntas abiertas (a resolver antes de código)
- ¿La planificación es por “Semana 1/2/3” relativa o por fechas de calendario?
- ¿El usuario puede ejecutar entrenamientos fuera del orden y cómo se refleja (adherencia)?
- ¿Método por ejercicio: RPE, RIR, %1RM, AMRAP, tiempo, o mix? (MVP: soportar RPE/RIR + reps/peso)
- ¿Qué métricas corporales se registran sí o sí en MVP?

## Glosario
- Plan: planificación general (4–12+ semanas).
- Semana: agrupador dentro del plan.
- Entrenamiento (template): lo que el coach define para ser ejecutado.
- Sesión (session): la ejecución real del alumno en un día específico.
- Alternativa: ejercicio reemplazo sugerido para adaptarse en el gym.
