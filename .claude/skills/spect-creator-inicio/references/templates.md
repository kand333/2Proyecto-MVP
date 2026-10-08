# Plantillas de `docs/`

Los formatos marcados con ⚙ los lee `scripts/trace-check.mjs`: respétalos al carácter (IDs, negritas, paréntesis, `·`).
No copies los `⚙` ni las anotaciones a su derecha.
Lo demás es orientativo: omite secciones vacías en vez de rellenarlas con texto genérico.

IDs: `WS-01`, `RF-01`, `DEC-001`, `T001`. Nunca reutilices ni renumeres un ID ya publicado; añade al final.

---

## docs/spec.md — qué y por qué

```markdown
# <Nombre del proyecto o feature>

> Estado: BLOCK            ⚙ SHIP | BLOCK (lo fija el cierre)
> Tipo: starter · Tamaño: normal · Actualizado: AAAA-MM-DD

## Objetivo
Un párrafo: problema, para quién, resultado medible ("un admin publica un producto en < 1 min").

## Alcance
- Dentro: …
- Fuera: … (explícito: evita que el implementador lo construya)

## Workstreams

### WS-01 · Catálogo · M                       ⚙ heading `### WS-XX`
- Objetivo: …
- deps: —                                       (otros WS)
- Aceptación: dado …, cuando …, entonces …

## Requisitos funcionales
- **RF-01** (WS-01) Texto. Dado …, cuando …, entonces …     ⚙ `- **RF-XX** (WS-XX)`
- **RF-02** (WS-01) … (ver DEC-001)

## No funcionales
Solo los que cambian el diseño: seguridad, rendimiento con cifra, accesibilidad, límites.

## Casos límite
- Vacío, duplicado, permisos, concurrencia, entradas máximas…

## Riesgos y pendientes
- [PENDIENTE: <pregunta concreta> — <por qué bloquea o no>]
```

---

## docs/plan.md — cómo

```markdown
# Plan técnico

## Arquitectura reutilizada
Qué se copia o extiende del código existente (rutas reales) y qué es nuevo.

## Diseño por workstream
### WS-01
- Datos: modelo/migración, campos, índices.
- API: rutas, método, auth (`requireAdmin`…), esquema de entrada.
- UI: páginas/componentes.
- Decisiones: DEC-001

## Validación
| Milestone | WS | Comando | Éxito |
|---|---|---|---|
| M1 | WS-01 | `npm test -w @portal/api` | exit 0 |

## Intervención humana
Solo lo que un agente no puede hacer solo (secretos, despliegue, datos reales). Ideal: 0-2 puntos.
```

---

## docs/task.md — cola de trabajo (la lee el modo `next`)

Una tarea = una sesión = un PR. Orden topológico. `XL` significa "divídela".

```markdown
# Tareas

- [ ] **T001** Esquema Zod de Product (WS-01 · RF-01,RF-02 · S)     ⚙
  - deps: —                                                           ⚙
  - done: dado un payload válido, cuando `parse`, entonces devuelve Product   ⚙
  - verify: `npm test -w @portal/shared`                              ⚙
- [x] **T002** … (WS-01 · RF-02 · M)
  - deps: T001
  - done: …
  - verify: …
  - pr: #12
```

- `[x]` solo tras ejecutar `verify` con éxito.
- Una tarea con `[PENDIENTE: …]` en su bloque no se ejecuta hasta resolverlo.
- `verify` es un comando real del repo, no una descripción.

---

## docs/decision-log.md — decisiones (append-only)

```markdown
# Decisiones

## DEC-001 · Precio en céntimos (Int)                  ⚙ heading `## DEC-XXX`
- Fecha: AAAA-MM-DD · Estado: aprobada | propuesta | reemplazada por DEC-00X
- Problema: …
- Evidencia: archivo/doc/pedido del usuario
- Opciones: conservadora … / propuesta …
- Elegida: … porque …
- Impacto: WS-01, T001, T004                           ⚙ obligatorio
- Rollback: …
```

Registra una DEC cuando la decisión cambie estructura (modelo, contrato, dependencia, auth) o resuelva un conflicto entre fuentes. Lo trivial no.
