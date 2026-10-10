# portal-starter

Plantilla para crear MVPs full stack con Next.js, PostgreSQL y Prisma, preparada para trabajar con Claude Code.

## Qué incluye

- **Auth propia**: registro, login y logout con cookie httpOnly firmada (HMAC), contraseñas con scrypt, límites de intentos y cierre de las otras sesiones al cambiar la contraseña.
- **Cuenta**: perfil y cambio de contraseña.
- **Panel admin**: indicadores, gestión de usuarios (roles, activación, conectados) y CRUD del módulo de ejemplo.
- **Módulo `Item`**: ejemplo de punta a punta (contrato Zod → repositorio → servicio → REST → páginas → tests) para copiar en cada entidad nueva. Su capa pública se puede quitar sin tocar el resto (ver `CLAUDE.md`).
- **Sistema de diseño neutro**: tokens de color con modo oscuro, una fuente y componentes accesibles (diálogo de confirmación, avisos, paginación).
- **Tests**: Vitest; los de la API son de integración contra PostgreSQL real.

Sin integraciones de terceros por defecto. Las recetas para agregarlas están en `docs/recipes/`.

## Estructura

```text
apps/
  api/        @portal/api: Next.js solo con Route Handlers REST (:4100) + Prisma
  web/        @portal/web: Next.js App Router (:3100), sin acceso a BD
packages/
  shared/     @portal/shared: contrato REST (tipos, enums, esquemas Zod)
docs/recipes/ integraciones opcionales
docker/       inicialización de PostgreSQL local
scripts/      setup.mjs
```

## Puesta en marcha

Requisitos: Node.js 24 (ver `.nvmrc`) y Docker.

```bash
npm install
npm run setup      # crea los .env.local y genera AUTH_SECRET (nunca sobrescribe)
npm run db:up      # PostgreSQL 16 en 127.0.0.1:5433 (BDs app y app_test)
npm run db:migrate && npm run db:seed && npm run dev
```

- Web: http://localhost:3100 · API: http://localhost:4100
- Usuarios de desarrollo: `admin@example.com` (ADMIN) y `user@example.com` (USER), contraseña `test1234`. El seed solo corre contra `localhost`.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | API y web juntas |
| `npm test` / `lint` / `typecheck` / `build` | Todos los workspaces (`-w @portal/web` para acotar) |
| `npm run db:migrate` | Crear y aplicar una migración (solo BD local) |
| `npm run db:deploy` | Aplicar migraciones existentes (producción) |
| `npm run db:seed` | Datos de desarrollo (idempotente) |
| `npm run db:down` | Detener PostgreSQL local (el volumen se conserva) |

## Crear un proyecto desde la plantilla

1. Copia la carpeta (sin `.git`, `node_modules`, `.next` ni `.env.local`) y ejecuta `git init`.
2. Identidad:
   - `packages/shared/src/app-config.ts` (`APP_SLUG`: nombre de la cookie de sesión, así no choca con otros proyectos en `localhost`);
   - `apps/web/src/lib/site-config.ts` (nombre, descripción, idioma);
   - `apps/web/src/app/globals.css` (colores) y `apps/web/src/app/layout.tsx` (fuente).
3. Ajusta `CLAUDE.md` y crea las entidades copiando `Item`.

## Antes de producción

- Configurar `NEXT_PUBLIC_SITE_URL` con el dominio real y servir por HTTPS (HSTS se envía en producción).
- Agregar una Content Security Policy (hoy no hay).
- Los límites de frecuencia viven en memoria, por proceso: con varias instancias, usar un almacén compartido.
- Sugeridos según el proyecto: CI (lint, typecheck, test con PostgreSQL y build) y un endpoint de salud.
- BD gestionada (Supabase u otra): `docs/recipes/supabase-vercel.md`.
