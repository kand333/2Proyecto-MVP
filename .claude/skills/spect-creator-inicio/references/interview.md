# Entrevista (Discovery)

Meta: cerrar lo que cambia el diseño con el mínimo de preguntas. Cada pregunta que el repo ya responde es una pregunta de más.

## Antes de preguntar
Deduce del repo y decláralo en una línea (`Arquitectura detectada: …`):
stack, capas, auth/roles, convenciones de módulos, comandos de test, docs/ previos.
Si `docs/` ya tiene contrato, pregunta solo por el delta del brief.

## Clasifica cada hueco
| Tipo | Qué hacer |
|---|---|
| Deducible | No preguntes; anótalo como supuesto en spec.md |
| No crítico | Elige la opción conservadora, anótala como supuesto |
| Crítico (cambia modelo, contrato, auth, alcance o coste) | Pregunta |
| Requiere aprobación (dependencia nueva, dato real, gasto, prod) | Pregunta y registra DEC |

## Cómo preguntar (interactivo)
- `AskUserQuestion`, hasta 4 preguntas por ronda, 2-4 opciones cada una, tu recomendación primero con "(Recomendado)".
- Máximo 2 rondas. Lo que siga abierto → `[PENDIENTE: …]`.
- Pregunta por decisiones, no por datos que el usuario tendría que redactar ("¿quién puede borrar?" sí; "describe tu modelo de datos" no).

## Sin usuario (GitHub Actions, `claude -p`)
No hay a quién preguntar y nadie va a responder dentro de la ejecución.
- No preguntes: aplica la opción recomendada a lo no crítico y márcala como supuesto.
- Lo crítico → `[PENDIENTE: pregunta concreta (opción recomendada: X)]` en spec.md y en las tareas afectadas.
- Lista esas preguntas numeradas en tu respuesta final, con opciones A/B y la recomendada marcada, para que el usuario conteste en el mismo hilo y vuelva a mencionar a `@claude`.
- Indica que basta con responder `ok` para aceptar todas las recomendadas. Al releer el hilo, `ok` (o respuestas tipo `1A 2B`) resuelve los `[PENDIENTE]`: aplícalas, registra DEC si cambian estructura y recalcula el estado.

## Banco de preguntas (elige solo las que apliquen)
- Usuarios y roles: ¿quién usa esto?, ¿qué puede hacer cada rol?, ¿hay contenido público?
- Datos: entidades, relaciones, qué es único, borrado (físico/lógico), volumen esperado.
- Flujo principal: el "camino feliz" en 3-5 pasos; qué pasa si falla cada paso.
- Integraciones: pagos, email, archivos, mapas (en este starter hay recetas en `docs/recipes/`).
- Límites: plazos, presupuesto, qué queda fuera del MVP.
- Éxito: cómo sabremos que funciona (una métrica o un escenario verificable).

## Tamaño
- `pequeño`: 1-2 WS, ≤ 8 tareas, sin cambios de auth/modelo compartido → spec.md + task.md, sin red team.
- `normal`: el resto → los 4 documentos y red team.
