# Receta: PostgreSQL en Supabase + API en Vercel

El core funciona con cualquier PostgreSQL vía `DATABASE_URL`. Esta receta agrega lo que necesita Supabase en producción: un rol propio para Prisma, el pooler, SSL verificado y RLS. También cubre el despliegue de la API en Vercel (serverless).
Desarrollo y tests siguen en la BD local de Docker: `db:migrate` nunca se ejecuta contra Supabase.

## 1. Dependencias

Ninguna.

## 2. Rol de Prisma en Supabase (una vez por proyecto)

1. En el SQL Editor, crea el usuario `prisma` con `BYPASSRLS`. El SQL está en la guía de Supabase: https://supabase.com/docs/guides/database/prisma
2. Descarga la CA: **Project Settings → Database → SSL Configuration → Download certificate**. Guárdala en `apps/api/certs/prod-ca-2021.crt`; es pública y se puede versionar.

## 3. Variables de entorno

Local, para aplicar migraciones (`apps/api/.env.local`, temporalmente; vuelve a la URL local al terminar). Pooler en modo **sesión** (puerto 5432, IPv4):

```text
DATABASE_URL=postgresql://prisma.<ref>:<clave>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=verify-full&sslrootcert=certs/prod-ca-2021.crt
```

En Vercel (proyecto de la API, raíz `apps/api`) → Settings → Environment Variables:

- `DATABASE_URL`: pooler en modo **transacción** (puerto 6543), recomendado para serverless: `postgresql://prisma.<ref>:<clave>@aws-0-<region>.pooler.supabase.com:6543/postgres`.
- `AUTH_SECRET`: 32 caracteres o más, distinto del de desarrollo.

En Vercel (proyecto web, raíz `apps/web`):

- `API_INTERNAL_URL`: URL de la API desplegada. Defínela **antes** del build: los rewrites se resuelven al compilar.
- `NEXT_PUBLIC_SITE_URL`: dominio real.

## 4. SSL verificado en serverless

En Vercel, una ruta de archivo en `sslrootcert` no se incluye en la función. Por eso la CA va como código y se fuerza la verificación por host.

`apps/api/src/lib/supabase-root-ca.ts`:

```ts
/** Supabase Root 2021 CA (public). Same content as certs/prod-ca-2021.crt. */
export const SUPABASE_ROOT_CA = `-----BEGIN CERTIFICATE-----
…pega aquí el contenido del .crt descargado…
-----END CERTIFICATE-----`;
```

`apps/api/src/lib/database-config.ts`:

```ts
import { SUPABASE_ROOT_CA } from "@/lib/supabase-root-ca";

/** `pg` lets URL SSL params override the `ssl` object, so they are dropped. */
const SSL_URL_PARAMS = ["sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat", "sslaccept"];
const isSupabaseHost = (hostname: string) => hostname.endsWith(".supabase.com") || hostname.endsWith(".supabase.co");

/** Supabase hosts always get TLS verified against the bundled CA (like verify-full); other hosts are used as given. */
export function getDatabaseConnectionConfig(databaseUrl: string) {
  const url = new URL(databaseUrl);
  if (!isSupabaseHost(url.hostname)) return { connectionString: databaseUrl };
  for (const param of SSL_URL_PARAMS) url.searchParams.delete(param);
  return { connectionString: url.toString(), ssl: { ca: SUPABASE_ROOT_CA, rejectUnauthorized: true as const } };
}
```

En `apps/api/src/lib/prisma.ts`:

```ts
const adapter = new PrismaPg(getDatabaseConnectionConfig(getRequiredEnvironmentVariable("DATABASE_URL")));
return new PrismaClient({
  adapter,
  // Opening a pooled TLS connection to a remote DB can exceed Prisma's default 2 s (P2028).
  transactionOptions: { maxWait: 10_000, timeout: 15_000 },
});
```

## 5. RLS (Data API de Supabase)

Las tablas de `public` son accesibles con las claves públicas (`anon`/`authenticated`) a través de la Data API. Activa RLS **sin políticas**: esos roles no ven filas. La API no se ve afectada, porque usa el rol `prisma` con `BYPASSRLS`.

Crea una migración (local, `npm run db:migrate -w @portal/api -- --name enable_rls --create-only`) con una línea por tabla:

```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;
```

Cada tabla nueva debe sumarse en su propia migración. En el SQL Editor, una sola vez:

```sql
alter table "_prisma_migrations" enable row level security;
```

## 6. Aplicar migraciones

Desde local, con la `DATABASE_URL` de Supabase (modo sesión):

```bash
npm run db:deploy
```

Vercel no ejecuta migraciones. Nunca uses `db:migrate` contra Supabase: necesita una base sombra. Tampoco uses `db:seed`: se niega a correr contra hosts no locales.

## 7. Validación

- Unit de `getDatabaseConnectionConfig`:
  - un host `*.supabase.com` recibe `ssl.ca` y pierde `sslmode`;
  - `localhost` queda intacto.
- `npm run db:status` contra Supabase: «Database schema is up to date».
- Tras desplegar, login y lectura en el sitio público. Con la clave `anon`, la Data API devuelve `[]` para `User`.

## 8. Reversión

- Borra `supabase-root-ca.ts`, `database-config.ts` y `certs/`.
- Vuelve `prisma.ts` a `new PrismaPg({ connectionString })`.
- Apunta `DATABASE_URL` al nuevo proveedor.

La migración de RLS es inofensiva fuera de Supabase: el dueño de la tabla no queda sujeto a RLS salvo con `FORCE`.
