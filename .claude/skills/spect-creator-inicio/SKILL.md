---
name: spect-creator-inicio
description: Crea o actualiza el contrato del proyecto en docs/ (spec.md, plan.md, task.md, decision-log.md) a partir de un brief, y ejecuta la siguiente tarea pendiente de docs/task.md (una tarea = un PR). Úsala siempre que el usuario diga "empecemos", quiera iniciar un proyecto, módulo o feature con más de un paso, pida especificar/planificar antes de programar, o diga "siguiente tarea", "continúa el plan", "next", "sigue con lo pendiente" — también cuando llegue como mención @claude en GitHub Actions. No la uses para un bug puntual o un cambio de una línea.
---

# spect-creator-inicio

Dos modos con un solo comando:

| Invocación | Hace |
|---|---|
| `/spect-creator-inicio <brief>` | Contrato: entrevista corta → escribe/actualiza `docs/` → valida → SHIP/BLOCK. No escribe código de producto. |
| `/spect-creator-inicio next` | Ejecuta la siguiente tarea desbloqueada de `docs/task.md`, la verifica y la marca. |

Sin argumentos: si `docs/task.md` existe y el estado es SHIP con tareas abiertas → `next`; si no → contrato (pide el brief).

Script de trazabilidad (úsalo en ambos modos; es la fuente de verdad sobre IDs y "siguiente tarea"):
```
node .claude/skills/spect-creator-inicio/scripts/trace-check.mjs docs --next
```

## Por qué existe
Los documentos son un contrato para otro agente, a menudo uno sin usuario delante (GitHub Actions).
Si algo obliga a adivinar, ese agente adivinará mal. Por eso: nada genérico, nada inventado, lo desconocido marcado como `[PENDIENTE: …]`.

## Detecta si hay usuario
Hay usuario si puedes usar `AskUserQuestion` y la sesión es interactiva.
En GitHub Actions o `claude -p` no lo hay: nunca esperes respuesta; sigue las reglas "sin usuario" de `references/interview.md`.

## Prioridad de fuentes
1. Decisión explícita del usuario · 2. Docs aportados · 3. `CLAUDE.md` y arquitectura existente · 4. Código · 5. Restricciones externas · 6. Tu recomendación.
Conflicto entre fuentes: no lo resuelvas en silencio. Pregunta (o `[PENDIENTE]`) y registra `DEC-XXX`.

---

## Modo contrato

1. **Inspecciona** (sin escanear todo el repo): `CLAUDE.md`, `package.json` raíz, `docs/` existente y los archivos que el brief toque.
   Clasifica tipo (greenfield / starter / existente) y tamaño (`pequeño` / `normal`, ver `references/interview.md`).
   Reutiliza antes de construir: si el proyecto tiene una receta (p. ej. "Nuevo módulo = copiar Item" en CLAUDE.md), el plan la sigue.
   No leas ni copies valores de `.env*` ni de `env` en settings; como mucho, nombres de variables.
2. **Entrevista**: lee `references/interview.md`. Pregunta solo lo crítico que el repo no responde.
3. **Escribe** con `references/templates.md`:
   - `pequeño`: `spec.md` + `task.md` (+ `decision-log.md` si hubo DEC).
   - `normal`: los cuatro.
   - Si ya existen, el brief es un **incremento**, no un contrato nuevo (ver abajo).

### Incremento sobre docs existentes
Un solo contrato vivo por repo: dos `spec.md` paralelos chocan en git y obligan al implementador a adivinar cuál manda.
- Lee los cuatro docs completos antes de escribir. Edita en sitio; nunca crees `spec-2.md` ni reescribas desde cero.
- Lo que el brief ya cubre: actualiza ese RF o tarea en vez de duplicarlo. Lo nuevo: IDs a continuación del mayor existente, en el WS que encaje o en uno nuevo.
- Lo que el brief vuelve innecesario:
  - pendiente (`[ ]`): bórralo junto con sus tareas y referencias;
  - ya hecho (`[x]`): no lo borres (es historia del código); añade "reemplazado por RF-XX".
  - En ambos casos registra una DEC con qué se quitó y por qué.
- Poda la repetición: cada dato vive en un solo sitio (spec = qué, plan = cómo, task = pasos y verificación, decision-log = por qué). Si plan repite un criterio de spec, deja la referencia (`RF-04`), no el texto.
- Contratos de otras ramas o PRs sin merge que tocan `docs/`: léelos, integra solo lo que siga siendo necesario y di en la respuesta qué PR o rama hay que cerrar.
4. **Valida**: corre `trace-check`; corrige todo `ERROR`. En `normal`, luego `references/redteam.md`. Máximo 2 vueltas.
5. **Cierra**: fija `> Estado:` en spec.md:
   - `SHIP`: trace-check OK y ningún `[PENDIENTE]` bloqueante.
   - `BLOCK`: cualquier otro caso.
6. **CLAUDE.md / README.md**: si ya existen, no los regeneres; añade solo reglas nuevas y duraderas que el contrato introduzca (máx. unas líneas). Si no existen, crea versiones mínimas.

Respuesta final (≤ 10 líneas): estado, nº de WS/RF/tareas, primera tarea, supuestos clave y preguntas pendientes numeradas.

## Modo next

1. Corre `trace-check … --next`.
   - `FAIL` o estado ≠ `SHIP` → no implementes; explica qué falta y sugiere `/spect-creator-inicio` para cerrarlo.
   - `NEXT: none` → informa progreso (`tasks: x/y`) y para.
2. Lee la tarea, sus RF en spec.md, su WS en plan.md y las DEC citadas. Lee solo el código que vas a tocar.
3. **Contrasta el contrato con el código** antes de escribir: rutas, nombres de funciones, campos y comandos citados deben existir (o ser lo que esta tarea crea). Si el doc está desfasado, corrígelo en el mismo PR con el cambio mínimo y dilo en el cuerpo del PR; si la corrección cambia alcance o estructura, para y pregunta (o `[PENDIENTE]`).
4. Implementa siguiendo `CLAUDE.md` (capas, convenciones, tests). Toda funcionalidad nueva lleva test. Implementa exactamente el `done`: ni menos, ni extras de otras tareas.
5. Corre el `verify` de la tarea y la verificación mínima que exija `CLAUDE.md` para ese tipo de cambio. Si falla, arregla; no marques `[x]` con verificación roja.
6. Actualiza `docs/task.md`: `[x]`. Decisión estructural tomada → nueva DEC. Si lo implementado cambia lo que asume una tarea posterior (nombre, ruta, firma), ajusta esa tarea ahora para que el próximo `next` no parta de un dato falso.
7. Una tarea por ejecución. Encadenar varias produce PRs imposibles de revisar.

### Tareas con UI
Una UI coherente sale de una sola dirección, no de 30 PRs que deciden cada uno su estética.
- Si existe `docs/design.md`, es la fuente de verdad visual: no inventes colores, tipografías ni patrones fuera de él. Si algo falta, amplíalo ahí (cambio mínimo) en vez de decidir en el componente.
- Si el repo tiene estas skills, úsalas con estos roles (las ausentes, ignóralas):
  - `design-taste-frontend` dirige: su Design Read y sus criterios de rechazo deciden; consúltala antes de componer una página.
  - `frontend-design` ejecuta identidad: tokens y tipografía.
  - `react-rules` guía el código de componentes (solo sus reglas generales).
  - `web-design-guidelines` cierra: antes de marcar `[x]`, audita los archivos de UI tocados; corrige los hallazgos o lista en el PR los que dejas y por qué.
- Precedencia: `CLAUDE.md` > `docs/design.md` > las skills. Una recomendación de skill que pida dependencias o librerías no aprobadas no aplica.

**Para y pide ayuda humana** (sin usuario: explícalo en la respuesta y deja la tarea sin marcar) si la tarea requiere: secretos o variables nuevas, despliegue o datos de producción, una dependencia no aprobada, o contradice `CLAUDE.md`.

## En GitHub Actions (ambos modos)
El usuario quiere un flujo sin clics: tú abres el PR; él solo revisa y hace merge.
1. Trabaja en la rama que crea la action. Commits pequeños, mensaje en inglés (`docs: contract for items CSV export`, `feat(ws-01): T003 admin products endpoint`).
2. Tras el push, abre el PR tú mismo (en este repo está permitido, aunque la action por defecto solo deje un enlace):
   ```
   gh pr create --base main --title "<T003 · título | docs: contrato de …>" --body "<resumen> … Refs #<issue>"
   ```
   Cuerpo: qué cambia, `verify` ejecutado y su resultado, supuestos. Usa `Refs #N`, no `Closes`: el issue sigue siendo el hilo para el próximo `next`. Solo en la última tarea usa `Closes #N`.
3. Pon el enlace del PR en tu comentario final y recuerda que hay que hacer merge antes del siguiente `next` (cada ejecución parte de `main`).
4. Si `gh pr create` falla, deja el enlace de PR que da la action y el error.
5. Nunca hagas merge ni push a `main`.

## Referencias
| Archivo | Cuándo |
|---|---|
| `references/interview.md` | Modo contrato, paso 2 |
| `references/templates.md` | Al escribir o editar `docs/` |
| `references/redteam.md` | Modo contrato, paso 4 (tamaño `normal`) |
