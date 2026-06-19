# UX Pass 3 — Before / After y Plan de Implementación
_Reviewed: 2026-06-12_

---

## Objetivo

Esta tercera pasada toma la auditoría conceptual y la segunda pasada de flujos reales, y las transforma en una guía de rediseño más accionable:

- lectura guiada de cada captura relevante
- problemas a marcar sobre pantalla
- estado `before`
- estado `after` deseado
- cortes de implementación realistas

Referencias base:

- [review-ux.md](file:///Users/juampi/TrainingChallengeRecomposition/docs/review-ux.md)
- [review-ux-deep-dive.md](file:///Users/juampi/TrainingChallengeRecomposition/docs/review-ux-deep-dive.md)

---

## Cómo Leer Esta Pasada

Como esta iteración todavía no dibuja anotaciones directamente sobre las imágenes, cada pantalla se documenta con una **lectura guiada**.

La idea es usar esta leyenda al momento de pasar a mockups o tickets:

- `Foco`: qué elemento debería dominar la pantalla
- `Contexto`: qué información ayuda a entender dónde está el usuario
- `Acción`: cuál es la siguiente decisión principal
- `Ruido`: qué compite visualmente sin aportar valor inmediato

---

## Flujo 1 — Cliente `Semana -> Detalle -> Sesión -> Completada`

Superficies:

- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/semana/page.tsx)
- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/semana/%5BworkoutTemplateId%5D/page.tsx)
- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/sesion/%5BsessionId%5D/page.tsx)
- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/(client)/sesion/%5BsessionId%5D/completada/page.tsx)

### Pantalla A — Semana

Captura:

- [ux-flow-client-week-localhost.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-client-week-localhost.png)

Lectura guiada:

- `Foco`: la card verde de “Próximo entreno” domina bien y empuja a ejecutar
- `Contexto`: el header `Semana 4 / 4` existe, pero todavía no cuenta suficiente historia de progreso
- `Acción`: `Continuar` es correcto, aunque convive con `Ver` y con pendientes visualmente cercanos
- `Ruido`: la barra lateral tiene demasiado peso frente al loop principal del atleta

Problemas a marcar:

- la semana funciona más como agenda que como home de rendimiento
- el bloque de `rachas / plan / progreso semanal` es demasiado liviano para sostener motivación
- pendientes y próximo entreno se parecen demasiado entre sí a nivel de lenguaje visual
- no queda claro qué cambia si hoy el usuario no entrena

Before:

- lista semanal correcta
- CTA principal visible
- buena dirección cromática con el lime

After:

- header superior con contexto de plan, avance semanal y objetivo del día
- card principal más editorial: `Hoy toca`, `por qué importa`, `duración`, `objetivo`
- pendientes reagrupados como `Después de hoy`
- barra lateral cliente con menor protagonismo durante el loop training

Cortes de implementación:

- `P1`: reforzar hero de `Próximo entreno`
- `P1`: añadir microcopy de contexto semanal
- `P2`: reducir peso visual del shell durante vistas de training

### Pantalla B — Detalle del workout

Captura:

- [ux-flow-client-workout-detail.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-client-workout-detail.png)

Lectura guiada:

- `Foco`: el botón `Empezar entrenamiento` está bien resuelto y cierra la pantalla
- `Contexto`: nombre, bloques y tiempo estimado aparecen, pero todavía no se leen como promesa de experiencia
- `Acción`: la pantalla explica el contenido, pero no prepara emocionalmente la ejecución
- `Ruido`: la lista larga de ejercicios aplana jerarquías entre bloque, intención y detalle fino

Problemas a marcar:

- el detalle se siente más “template” que “sesión de hoy”
- no hay diferenciación fuerte entre calentamiento, trabajo principal y recuperación
- demasiado texto técnico antes de arrancar
- falta una mini síntesis arriba que responda: `qué voy a hacer`, `cuánto dura`, `qué necesito`

Before:

- estructura clara por bloques
- CTA de inicio fuerte
- buena base para strength sessions

After:

- cabecera tipo briefing con `objetivo`, `duración`, `modalidad`, `equipamiento`
- bloques con summaries humanas antes del detalle técnico
- running y fuerza compartiendo una misma narrativa visual

Cortes de implementación:

- `P1`: añadir `session brief` arriba del contenido
- `P1`: mejorar headings y summaries por bloque
- `P2`: explorar modo compacto/expandido del detalle técnico

### Pantalla C — Sesión runner

Captura:

- [ux-flow-client-session.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-client-session.png)

Lectura guiada:

- `Foco`: el timer circular y el botón principal concentran bien la atención
- `Contexto`: el label del bloque actual está, pero el usuario no ve suficiente continuidad de la sesión completa
- `Acción`: `Play`, `Reiniciar` y `Terminé el calentamiento` son claros, aunque podrían ordenarse mejor por importancia
- `Ruido`: casi no hay ruido; esta es una de las pantallas más limpias del producto

Problemas a marcar:

- falta sensación de progreso macro: `estoy en el bloque 1 de 5`
- el estado de sesión todavía no conversa con el resto del plan o del día
- cuando la sesión no corre sola, el usuario tiene que deducir demasiado qué significa cada control

Before:

- muy buena concentración visual
- buena dirección para experiencia real-time
- excelente base para diferenciar training execution del resto de la app

After:

- mini timeline o stepper superior de sesión
- labels más explícitos para `prep / work / rest`
- un solo CTA dominante según estado actual y controles secundarios más silenciosos

Cortes de implementación:

- `P1`: stepper de bloques
- `P1`: labels de estado más explícitos
- `P2`: integrar feedback háptico/sonoro y señalización del próximo cambio

### Pantalla D — Sesión completada

Captura:

- [ux-flow-client-completed.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-client-completed.png)

Lectura guiada:

- `Foco`: el CTA `Confirmar` es clarísimo y está muy bien resuelto
- `Contexto`: volumen, series y ejercicios ayudan, pero todavía no cuentan el resultado en un tono celebratorio
- `Acción`: la encuesta de energía está bien ubicada como cierre inmediato
- `Ruido`: el espacio vacío inferior refuerza la idea de que falta una segunda capa de valor

Problemas a marcar:

- la pantalla cierra la carga de datos, pero no cierra la experiencia
- falta devolución de logro: consistencia, adherencia, progreso o mensaje del coach
- la caja de nota para el coach queda muy desnuda y poco acompañada
- no existe un puente claro hacia la próxima acción

Before:

- formulario final ordenado
- buen CTA
- buen uso del espacio superior

After:

- bloque superior de celebración con logro del día
- feedback guiado: `cómo te sentiste`, `qué ajustar`, `mensaje opcional`
- next step claro: `volver a semana`, `ver progreso`, `avisar al coach`

Cortes de implementación:

- `P1`: header de cierre más emocional
- `P1`: agregar bloque de siguiente paso
- `P2`: resumir progreso reciente y streak en el cierre

---

## Flujo 2 — Coach `Alumnos -> Detalle -> Acción`

Superficies:

- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/alumnos/page.tsx)
- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/alumnos/%5BclientUserId%5D/page.tsx)

### Pantalla A — Lista de alumnos

Captura:

- [ux-flow-coach-students.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-students.png)

Lectura guiada:

- `Foco`: hoy no hay un foco claro; la tabla reparte la atención de forma muy pareja
- `Contexto`: nombre, plan y última sesión existen, pero no alcanzan para priorizar
- `Acción`: agregar alumno está claro, pero operar seguimiento diario no
- `Ruido`: hay demasiado espacio muerto y muy poca señal útil por fila

Problemas a marcar:

- no existe una noción fuerte de urgencia o prioridad
- `ON TRACK` y `SIN PLAN` ayudan, pero son insuficientes para gestión real
- la lista no responde a preguntas de coach: `a quién mirar primero`, `quién se cayó`, `quién necesita ajuste`
- buscador y acciones compiten con una tabla todavía muy plana

Before:

- estructura simple y fácil de entender
- base sólida para una vista operacional

After:

- convertir la lista en `tablero de seguimiento`
- agregar grupos rápidos: `requieren atención`, `sin plan`, `activos`, `sin actividad`
- enriquecer cada fila con señal mínima útil: adherencia, energía, última interacción

Cortes de implementación:

- `P1`: agregar orden por prioridad y filtros rápidos
- `P1`: sumar métricas de seguimiento por fila
- `P2`: explorar cards o filas expandibles para mobile/desktop

### Pantalla B — Detalle del alumno

Captura:

- [ux-flow-coach-student-detail.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-student-detail.png)

Lectura guiada:

- `Foco`: el resumen superior del alumno está bien ubicado, pero todavía no domina la lectura
- `Contexto`: plan activo, peso, energía y últimas sesiones ofrecen una buena base
- `Acción`: `Mensaje`, `Cambiar plan`, `Ver plan`, `Quitar plan` están visibles, aunque dispersos
- `Ruido`: la pantalla intenta ser dashboard, ficha y historial al mismo tiempo

Problemas a marcar:

- demasiadas decisiones del coach conviven sin orden jerárquico fuerte
- el coach ve datos, pero no ve un diagnóstico
- no hay un bloque explícito de `qué conviene hacer ahora`
- tabs y acciones no separan bien operación diaria de revisión profunda

Before:

- muy buen punto de concentración de información
- acciones principales presentes
- historial de sesiones aporta contexto real

After:

- hero superior con `estado del alumno`, `plan actual`, `riesgos`, `siguiente mejor acción`
- secciones separadas por modo: `seguir`, `ajustar`, `analizar`
- recomendación de sistema visible: `baja adherencia esta semana`, `conviene escribir`, `conviene reasignar`

Cortes de implementación:

- `P1`: summary card de decisión arriba de todo
- `P1`: reordenar tabs y CTA según frecuencia real
- `P2`: introducir insights automáticos de seguimiento

### Pantalla C — Cambiar plan / mensaje

Capturas:

- [ux-flow-coach-change-plan-modal.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-change-plan-modal.png)
- [ux-flow-coach-student-detail-message.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-student-detail-message.png)

Lectura guiada:

- `Foco`: las acciones existen, pero todavía se ven como herramientas aisladas
- `Contexto`: falta recordar mejor qué problema intenta resolver el coach antes de abrir cada acción
- `Acción`: el modal y el chat cumplen, pero no heredan suficiente contexto del alumno

Problemas a marcar:

- `Cambiar plan` debería ofrecer más contexto comparativo antes de confirmar
- `Mensaje` debería sugerir intención: seguimiento, felicitación, ajuste, recordatorio
- el coach tiene que pensar solo el siguiente paso cada vez

After:

- modal con resumen `plan actual vs nuevo plan`
- composer de mensaje con quick intents
- acciones conectadas con el estado del alumno, no solo con navegación

---

## Flujo 3 — Coach `Workouts / Planes -> Preview alumno`

Superficies:

- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/workouts/page.tsx)
- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/workouts/%5BworkoutTemplateId%5D/page.tsx)
- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/planes/page.tsx)
- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/planes/%5BplanId%5D/page.tsx)
- [page.tsx](file:///Users/juampi/TrainingChallengeRecomposition/apps/web/app/coach/planes/%5BplanId%5D/preview/page.tsx)

### Pantalla A — Listado de workouts

Captura:

- [ux-flow-coach-workouts.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-workouts.png)

Lectura guiada:

- `Foco`: el foco está en administrar templates, no en validar experiencias
- `Contexto`: falta clasificación fuerte por objetivo, deporte o estado de uso
- `Acción`: entrar a editar es simple, pero no hay una noción clara de validación previa a uso

Problemas a marcar:

- lista útil para inventario, floja para operación
- no muestra bien cuáles workouts se usan, cuáles están listos y cuáles requieren revisión
- no prepara el paso mental hacia `cómo lo verá el alumno`

After:

- estados claros: `borrador`, `listo`, `en uso`, `requiere revisión`
- accesos rápidos a `editar`, `duplicar`, `preview alumno`

### Pantalla B — Workout builder

Captura:

- [ux-flow-coach-workout-builder.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-workout-builder.png)

Lectura guiada:

- `Foco`: el contenido técnico del workout domina, lo cual es correcto para edición
- `Contexto`: nombre, descripción y deporte están visibles, pero la pantalla habla demasiado en lenguaje interno
- `Acción`: guardar y duplicar están, pero falta un puente a validación de experiencia
- `Ruido`: muchas acciones pequeñas compiten en cada bloque y en cada ejercicio

Problemas a marcar:

- ausencia de `Preview alumno` como CTA primario de calidad
- jerarquía baja entre acciones de bloque, ejercicio y workout completo
- el builder comunica bien “cómo editar”, pero no “cómo se sentirá”

Before:

- editor potente
- bloques entendibles
- buena granularidad para fuerza y conditioning

After:

- split claro entre `modo edición` y `modo preview`
- CTA persistente `Vista alumno`
- summaries de bloque más narrativas y menos técnicas
- controles secundarios agrupados o colapsables

Cortes de implementación:

- `P0`: agregar `Preview alumno` directo al builder
- `P1`: reorganizar toolbar superior por frecuencia de uso
- `P1`: compactar acciones menores de bloque/ejercicio

### Pantalla C — Planes y editor de plan

Capturas:

- [ux-flow-coach-plans.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-plans.png)
- [ux-flow-coach-plan-editor.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-plan-editor.png)

Lectura guiada:

- `Foco`: el listado de planes ya empieza a hablar de asignación real
- `Contexto`: en el editor se entiende la matriz semana/día, que es el corazón operativo
- `Acción`: `Vista alumno` aparece bien ubicada y eleva la calidad del flujo
- `Ruido`: en el editor todavía cuesta distinguir cambios estructurales de cambios finos

Problemas a marcar:

- el listado de planes podría priorizar mejor cuáles están en uso y cuáles son borradores
- el editor necesita una capa más clara de `qué semana estoy diseñando` y `para quién`
- la matriz funciona, pero sigue siendo bastante “spreadsheet-like”

After:

- cards de planes más orientadas a uso y resultados
- editor de plan con encabezado de contexto más fuerte
- posibilidad de alternar `estructura`, `detalle` y `preview` sin romper foco

### Pantalla D — Vista alumno desde plan

Captura:

- [ux-flow-coach-plan-preview-student.png](file:///Users/juampi/TrainingChallengeRecomposition/docs/assets/ux-flow-coach-plan-preview-student.png)

Lectura guiada:

- `Foco`: el contenido del alumno aparece claro y por fin aterriza el trabajo del coach
- `Contexto`: semana, alumno y estado general están bien planteados
- `Acción`: `Ver / editar` y `Nota` resuelven el loop básico
- `Ruido`: el estado de semana completada queda un poco frío y mecánico

Problemas a marcar:

- la preview es útil, pero todavía no replica del todo el tono y la prioridad del lado alumno
- falta continuidad visual entre esta pantalla y `Semana` del atleta
- la preview vive solo en planes y no en workouts

After:

- preview coach/alumno casi gemela a la experiencia real del cliente
- alternancia rápida entre `editor`, `preview coach`, `preview alumno`
- notas de progresión y cambios visibles como capa editorial, no como acción secundaria perdida

---

## Backlog de Producto / Diseño

### P0

- Estados visibles de auth, sesión inválida y API caída
- `Preview alumno` directo en workout builder
- Mantener continuidad visual entre builder, plan preview y semana del alumno

### P1

- Rediseñar `Semana` como home de foco y no solo como agenda
- Reforzar `Detalle workout` con briefing de sesión
- Convertir `Alumnos` en tablero de triage
- Agregar summary de decisión en detalle del alumno
- Simplificar jerarquía de acciones en builder y editor de plan

### P2

- Añadir celebraciones y siguiente paso en sesión completada
- Introducir quick intents para mensajes coach
- Explorar modos `operar` vs `construir` en experiencia coach
- Llevar insights automáticos al seguimiento del alumno

---

## Plan de Ejecución Sugerido

### Sprint 1

- `Auth shell`: estados vacíos, error y recuperación
- `Workout builder`: CTA `Vista alumno`
- `Plan preview`: acercar visualmente a experiencia cliente

### Sprint 2

- `Cliente semana`: nuevo hero y contexto semanal
- `Detalle workout`: briefing superior y summaries por bloque
- `Sesión completada`: cierre con siguiente acción

### Sprint 3

- `Coach alumnos`: tabla priorizada + filtros rápidos
- `Detalle alumno`: bloque superior de diagnóstico y acción
- `Mensajes / cambio de plan`: quick intents y contexto

---

## Entregable Siguiente

Con este documento ya se puede pasar a una ronda de solución visual concreta:

- wireframes `before / after`
- tickets por pantalla
- implementación por módulo sin perder el loop principal:

```text
Coach programa -> Alumno entiende -> Alumno ejecuta -> App registra -> Coach interpreta -> Ajusta
```
