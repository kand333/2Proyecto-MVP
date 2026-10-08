# Tareas

- [ ] **T001** Constante de límite y CSV de items en servicio/repositorio (WS-01 · RF-02,RF-03,RF-04,RF-05 · M)
  - deps: —
  - done: dado items con comas, comillas, saltos de línea y `=cmd`, cuando `exportItemsCsv({ search })`, entonces devuelve BOM + cabecera + filas escapadas, solo las coincidentes, máx. `ITEM_EXPORT_MAX_ROWS`
  - verify: `npm test -w @portal/shared && npm test -w @portal/api`
- [ ] **T002** Route Handler `GET /api/admin/items/export` (WS-01 · RF-01,RF-02,RF-03 · S)
  - deps: T001
  - done: dado un admin, cuando GET con `?search=foo`, entonces 200 `text/csv` con `Content-Disposition` de adjunto; sin sesión 401, no admin 403, `search` inválido 400; test en `tests/items-admin-api.test.ts`
  - verify: `npm test -w @portal/api && npm run typecheck -w @portal/api`
- [ ] **T003** Botón «Exportar CSV» en el listado admin (WS-02 · RF-06 · S)
  - deps: T002
  - done: dado `params.search = "foo"`, cuando se renderiza `AdminItemList`, entonces el enlace apunta a `/api/admin/items/export?search=foo`; sin búsqueda apunta a `/api/admin/items/export`
  - verify: `npm test -w @portal/web && npm run lint -w @portal/web && npm run typecheck -w @portal/web`
