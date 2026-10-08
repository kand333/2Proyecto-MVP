# Exportar items a CSV

> Estado: SHIP
> Tipo: starter · Tamaño: pequeño · Actualizado: 2026-10-08

## Objetivo
Un admin descarga en un clic un archivo CSV con todos los items que coinciden con la búsqueda activa en `/admin/items` (o todos si no hay búsqueda), para trabajarlos fuera del portal.

## Alcance
- Dentro: endpoint admin de exportación, botón «Exportar CSV» en el listado admin de items, tests de ambas capas.
- Fuera: exportar la capa pública, otros formatos (XLSX), exportar otros módulos, filtros nuevos (estado), exportaciones programadas o por correo.

## Workstreams

### WS-01 · Endpoint de exportación · S
- Objetivo: `GET /api/admin/items/export?search=…` devuelve el CSV de todos los items que coinciden con la búsqueda.
- deps: —
- Aceptación: dado un admin y items que coinciden con `search`, cuando pide el export, entonces recibe un CSV solo con esos items.

### WS-02 · Botón en el listado admin · S
- Objetivo: el listado admin ofrece la descarga respetando la búsqueda de la URL.
- deps: WS-01
- Aceptación: dado `/admin/items?search=foo`, cuando el admin pulsa «Exportar CSV», entonces descarga el CSV filtrado por `foo`.

## Requisitos funcionales
- **RF-01** (WS-01) Solo ADMIN accede; sin sesión responde 401 y con otro rol 403 (`requireAdmin`). Dado un usuario no admin, cuando pide el export, entonces no recibe datos.
- **RF-02** (WS-01) Respeta `search` con la misma semántica que el listado (`itemFilterOf`, todas las palabras en el título) e ignora `page`/`pageSize`: exporta todas las filas coincidentes, no solo la página visible. `search` se valida con `itemListQuerySchema`; inválido → 400.
- **RF-03** (WS-01) Respuesta `text/csv; charset=utf-8` con `Content-Disposition: attachment; filename="items.csv"` y `Cache-Control: no-store`. Columnas, en orden: `id,title,description,isPublished,createdAt,updatedAt`; primera fila de cabecera; orden más reciente primero (igual que el listado).
- **RF-04** (WS-01) Escape CSV (RFC 4180): campos con comas, comillas, saltos de línea se entrecomillan y `"` se duplica. Para evitar inyección de fórmulas, un campo de texto que empiece por `=`, `+`, `-`, `@`, tab o CR se prefija con `'`.
- **RF-05** (WS-01) El archivo empieza con BOM UTF-8 para que Excel muestre bien los acentos. Con 0 coincidencias devuelve solo la cabecera (200).
- **RF-06** (WS-02) El listado admin muestra un enlace/botón «Exportar CSV» que apunta a `/api/admin/items/export` con el `search` actual de la URL (mismo nombre de parámetro) y sin `page`. Sin búsqueda, sin parámetros.

## No funcionales
- Límite de filas: `ITEM_EXPORT_MAX_ROWS = 10000` (constante en `packages/shared/src/item.ts`); si hay más coincidencias se exportan las 10000 más recientes. Evita cargar tablas enormes en memoria.
- El enlace usa `/api/**` (proxy first-party, cookie de sesión); sin Server Actions ni acceso a BD desde web.

## Casos límite
- Búsqueda sin resultados → solo cabecera.
- Títulos/descripciones con comas, comillas, saltos de línea, acentos o que empiezan por `=`.
- `search` más largo que `MAX_SEARCH_LENGTH` → 400.
- La ruta estática `export` no debe chocar con `[id]` (en Next la estática tiene prioridad; cubrir con test).

## Supuestos
- Exporta todas las coincidencias (no solo la página actual); «respetando la búsqueda» se interpreta como el filtro `search`, el único existente.
- Incluye borradores y publicados, como el listado admin.
- Sin dependencias nuevas: el CSV se genera a mano en el servicio.
- Idioma de cabeceras: nombres de campo en inglés (coinciden con el contrato `Item`); etiqueta del botón en español.
