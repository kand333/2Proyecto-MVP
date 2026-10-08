# Red team (cierre)

Objetivo: romper el contrato antes de que lo haga el implementador. No repitas la entrevista.
Ponte en el lugar de otro agente que solo tiene `docs/` y `CLAUDE.md`: ¿dónde tendría que adivinar?

## Revisa
1. **Huecos de implementación**: tareas cuyo `done` no se puede verificar o cuyo `verify` no existe en el repo.
2. **Contradicciones** entre spec, plan, tareas y CLAUDE.md (nombres, rutas, roles, límites).
3. **Decisiones implícitas**: elecciones estructurales en plan.md sin DEC.
4. **Duplicación**: algo que el repo ya resuelve (auth, paginación, flash, rate limit, módulo Item…).
5. **Conflictos con reglas del proyecto**: lo prohibido en CLAUDE.md (p. ej. Server Actions, BD desde web, dependencias nuevas sin pedir).
6. **Seguridad**: autorización en cada endpoint y página, validación de entrada, secretos, datos personales.
7. **Operación**: migraciones (orden, datos existentes, rollback), seeds, variables de entorno nuevas.
8. **Tamaño**: tareas XL o que tocan demasiadas capas para un PR.

## Formato de hallazgo (solo los que fallan)
```
[blocking|alto|medio|bajo] Descripción — afecta: spec.md RF-03, task.md T005 — fix: …
```

## Resolución
- Aplica tú mismo cada fix que no requiera decidir al usuario; vuelve a correr `trace-check`.
- Lo que requiera decisión: interactivo → pregunta; sin usuario → `[PENDIENTE]`.
- Máximo 2 vueltas. Si queda un `blocking`, el estado es BLOCK.
