# CLAUDE.md

portal-starter: plantilla para MVPs con auth, cuenta, panel admin (usuarios) y un módulo de ejemplo `Item`.
Al crear un proyecto desde aquí, cambia la identidad en `packages/shared/src/app-config.ts` (`APP_SLUG`), `apps/web/src/lib/site-config.ts`, `globals.css` y este archivo.

## Specs y trabajo automático

- La skill `spect-creator-inicio` gestiona `docs/spec.md`, `plan.md`, `task.md` y `decision-log.md`: `/spect-creator-inicio <brief>` escribe el contrato; `/spect-creator-inicio next` implementa la siguiente tarea (una por PR).
- Al editar esos docs, respeta `references/templates.md` de la skill: `scripts/trace-check.mjs` valida IDs y formatos.
- En GitHub: `@claude …` en un issue/PR ejecuta `.github/workflows/claude.yml` (Postgres incluido). `ci.yml` valida cada PR.
- La action lee `.claude/` y `CLAUDE.md` de la rama base: los cambios a la skill solo aplican tras merge a `main`.
- Hasta el 2026-11-05 (créditos de cloud sessions): la tarea programada de Windows «Claude cloud night» ejecuta `scripts/cloud-night.mjs` a las 23:30, que lanza `claude --cloud` con un bloque de 4 tareas en `cloud/AAAAMMDD`; `cloud-merge.yml` lo integra en `main` si la puerta pasa. Una rama `cloud/*` sin integrar pausa el lanzador. `claude-night.yml` queda en pausa hasta esa fecha.
- Modo noche (`claude-night.yml`): cada hora de 00:00 a 07:00 (Chile) implementa la siguiente tarea en una rama `night/*` y hace merge solo si lint, typecheck, tests y `trace-check` pasan. Un PR `night` abierto lo pausa. Apagado: variable de repo `NIGHT_MODE=off`.

## Arquitectura real (no inventar otra)

Monorepo npm workspaces:

- `apps/web` (`@portal/web`, :3100): Next.js 16.3.7 + React 19 + Tailwind 4 + SWR. Sin acceso a BD. De los paquetes internos, depende solo de `@portal/shared`.
  - El navegador llama a `/api/**`, que `next.config.ts` reenvía a `API_INTERNAL_URL` (cookies first-party, sin CORS).
  - Los Server Components llaman al backend directamente por `API_INTERNAL_URL` (patrones: `lib/session.ts`, `lib/public-items-api.ts`).
- `apps/api` (`@portal/api`, :4100): solo Route Handlers REST → `services/` → `repositories/` → Prisma 7.10.0 (`adapter-pg`) → PostgreSQL.
  - Errores HTTP con forma `{ message, status }` vía `lib/http/api-error.ts`.
  - Cliente Prisma generado en `apps/api/src/generated/prisma`: no se versiona; `npm run db:generate`.
- `packages/shared` (`@portal/shared`): contrato REST (tipos, enums, límites, esquemas Zod). Los enums deben coincidir con Prisma (`tests/shared-contract.test.ts`).

Prohibido: Server Actions; acceder a la BD desde `apps/web`; secretos en `NEXT_PUBLIC_*`; binarios en BD.
Integraciones opcionales (no instaladas): recetas en `docs/recipes/`.

## Reglas no obvias

- Versiones fijadas (`next` 16.3.7, `prisma` 7.10.0). No actualices ni agregues dependencias sin pedirlo.
- APIs de Next 16: consulta `node_modules/next/dist/docs/` antes de usar convenciones que no estén en el código. Ej.: `error.tsx` recibe `retry`.
- `typecheck` ejecuta `next typegen` (`PageProps`/`LayoutProps`/`RouteContext`): usa el script, no `tsc` solo.
- `next.config.ts` lleva `agentRules: false` para que `next dev` no modifique este archivo. No lo quites.
- Estado de listas (página, búsqueda) en la URL, con los mismos nombres de parámetros que la API (`lib/items.ts`).
- UI: solo tokens de `apps/web/src/app/globals.css` (`paper`, `surface`, `ink`, `muted`, `line`, `accent`, `accent-hover`, `on-accent`, `highlight`, `on-highlight`; DEC-015). Excepción: rojo/esmeralda para estados de error/éxito. `font-display` es Archivo (ancho con `font-stretch-expanded` / `font-stretch-condensed` de Tailwind) y `font-sans`, Geist.
- El movimiento respeta `prefers-reduced-motion`.
- Código, nombres y commits en inglés; UI y docs en español. TypeScript estricto, sin `any`.
- Valida toda entrada en el backend con los esquemas de `@portal/shared`.
- Cada dependencia en el `package.json` del workspace que la usa (el raíz solo tiene herramientas).
- Avisos de éxito: `flash()` (`apps/web/src/lib/flash.ts`). Errores junto al campo o formulario.
- Sesión: token HMAC con `iat` en cookie httpOnly (`SESSION_COOKIE_NAME` de `shared/app-config.ts`). Todo cambio de contraseña fija `User.sessionsValidAfter`.
- Límites de frecuencia en memoria (`apps/api/src/lib/http/rate-limit.ts`; login: 5 fallos por email). Tests que llaman mucho a login/registro: `resetRateLimits()` en `beforeEach`.
- Autorización: cada Route Handler protegido empieza con `requireUser`/`requireAdmin`/`requireRole`. En la web, cada página privada (no solo su layout) llama a `requireSessionUser`/`requireCustomerUser`/`getAdminUser`.
- Seed (`npm run db:seed`): idempotente, solo contra `localhost`; usuarios en `apps/api/prisma/seed/test-users.ts`.

## Nuevo módulo = copiar Item

En orden, con su test en cada capa:

1. `packages/shared/src/item.ts`: límites, esquemas Zod (create/update/list) y tipo.
2. `apps/api/prisma/schema.prisma` + `npm run db:migrate -w @portal/api -- --name <cambio>`.
3. `apps/api/src/repositories/item-repository.ts`: solo Prisma.
4. `apps/api/src/services/item-service.ts`: reglas, mapeo a tipo shared, errores `ApiError`.
5. `apps/api/src/app/api/admin/items/**`: `requireAdmin` + `safeParse` + servicio. Test: `tests/items-admin-api.test.ts`.
6. `apps/web/src/lib/items.ts` (estado URL + cliente) y `components/items/*`.
7. `apps/web/src/app/admin/items/**` (`getAdminUser` en cada página) + entrada en `lib/admin-navigation.ts`.

Quitar la capa pública de Item (todo lo demás sigue funcionando):
`apps/api/src/app/api/items/`, `services/public-item-service.ts`, `repositories/public-item-repository.ts`, `tests/items-public-api.test.ts`, `apps/web/src/app/(site)/items/`, `lib/public-items-api.ts`, la entrada «Items» de `components/layout/navigation-items.ts` y el enlace de `app/(site)/page.tsx`.

## Comandos (raíz)

| Comando | Uso |
|---|---|
| `npm run setup` | Crea los `.env.local` / `.env.test.local` y genera `AUTH_SECRET` (nunca sobrescribe) |
| `npm run db:up` / `db:down` | PostgreSQL 16 local (Docker, `127.0.0.1:5433`, BDs `app` y `app_test`) |
| `npm run dev` | API y web juntas (`dev:api` / `dev:web` por separado) |
| `npm test` / `lint` / `typecheck` / `build` | Todos los workspaces; acota con `-w @portal/web` (o `api`/`shared`) |
| `npx vitest run <ruta>` | Test puntual, desde el workspace |
| `npm run db:migrate` / `db:seed` / `db:generate` / `db:status` / `db:deploy` | Prisma, en `apps/api` |

- Tests de API: integración contra `app_test` (`apps/api/.env.test.local`). `global-setup` se niega a usar una BD cuyo nombre no termine en `_test`; corren sin paralelismo entre archivos.
- `db:migrate` (`migrate dev`) solo contra la BD local; en producción `db:deploy`.
- Servidores para verificar en navegador: `.claude/launch.json` (`web`, `api`).

## Verificación (proporcional al cambio)

| Cambio | Mínimo exigido |
|---|---|
| Lógica en `lib/`, servicio o repositorio | Tests del archivo y del workspace |
| Contrato en `shared` o Route Handler | Tests de `shared` y `api` + `typecheck` |
| Componente o página | Tests del workspace + `lint` + `typecheck` + navegador (escritorio y 375 px; sin desborde; consola limpia) |
| Migración | `db:migrate` en dev + tests de `api` |

Toda funcionalidad nueva lleva su test (Vitest; componentes con `renderToStaticMarkup`). No declares algo verificado sin haberlo ejecutado.

## Skills del proyecto (`.claude/skills/`)

- `web-design-guidelines`: al crear o auditar UI (descarga las reglas vigentes). No para cambios sin efecto visual.
- `frontend-design`: al definir la identidad visual de un proyecto nuevo (cambia tokens, no componentes sueltos).
- `design-taste-frontend` (externa): directora de diseño; su dirección vive en `docs/design.md` y manda sobre las demás skills de UI (DEC-013). De su stack solo aplica `@phosphor-icons/react` (DEC-014): sin Motion (animación solo CSS), design systems, Zustand ni picsum.
- `react-rules`: solo sus reglas generales. No introduzcas Zustand, React Hook Form ni React Query (se usan SWR, `useState` y la URL).

## Alcance y git

- Parche mínimo correcto; sin refactors ni cambios en archivos no relacionados.
- No modifiques `next.config.ts`, `package.json` ni `.claude/` sin necesidad explícita.
- Commits solo cuando se pidan; fuera del commit: `.env*` (salvo `.env.example`) y el cliente Prisma generado.
