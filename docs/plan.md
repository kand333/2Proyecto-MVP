# Plan técnico

## Arquitectura reutilizada
- Capas y receta "Nuevo módulo = copiar Item" de `CLAUDE.md`: shared → `schema.prisma` + migración → repositorio → servicio → Route Handler admin → `lib/` web → componentes → páginas.
- Auth: `requireUser` / `requireAdmin` (`apps/api/src/lib/auth/authorization.ts`), `getOptionalUser` para endpoints que aceptan invitado o sesión (checkout). Web: `requireCustomerUser`, `getAdminUser` (`apps/web/src/lib/session.ts`).
- Errores `ApiError` (`lib/http/api-error.ts`); límites en `RATE_LIMITS` (`lib/http/rate-limit.ts`): añadir `subscribe`, `quote`, `order`.
- Búsqueda segura con `escapeLikePattern` (`lib/escape-like.ts`); paginación con `paginationQuerySchema` (shared) y `components/ui/pagination.tsx`.
- UI: `flash()`, `ConfirmDialog`, `auth-form-field.tsx` como patrón de campos con error, tokens de `globals.css`.
- Seed idempotente en `apps/api/prisma/seed/` (T008 añade `products.ts` junto a `test-users.ts`).
- Nuevo: catálogo, carrito, pedidos, ajustes, suscriptores. Sin dependencias nuevas.

## Diseño por workstream

### WS-06 · Identidad, diseño y legal
- Orquestación (DEC-013): `design-taste-frontend` dirige y escribe `docs/design.md` (T001); `frontend-design` aplica tokens y fuente; `react-rules` guía el código de componentes; `web-design-guidelines` audita al cerrar cada tarea de UI y en T031.
- T001: `docs/design.md`, `packages/shared/src/app-config.ts` (`APP_SLUG`), `apps/web/src/lib/site-config.ts`, tokens en `globals.css`, fuente en `app/layout.tsx`.
- T030: `components/ui/*`; reutiliza `confirm-dialog`, `flash-messages` y `pagination` en vez de duplicarlos.
- T023: receta de `CLAUDE.md` para quitar la capa pública de Item; quitar la entrada "Items" de `lib/admin-navigation.ts` (DEC-009).
- T025: páginas estáticas en `app/(site)/legal/*`; enlaces en `components/layout/site-footer.tsx`.
- Identidad Terpenex (DEC-015, DEC-016), estructura visual en `docs/design.md`:
  - T032: `globals.css` (+ `--highlight`, `--on-highlight`, `--color-highlight`, `--color-on-highlight`; `--font-display` → Archivo), `app/layout.tsx` (Archivo con `axes: ["wdth"]` + Geist), `site-config.ts` (`name`, `description`, `themeColor`, `contact` y `social` con strings vacíos), `APP_SLUG` y los tests que fijan `terpenos_*` (`site-header.test.tsx`, `ui-kit.test.tsx`, `age-gate.test.ts`, `session.test.ts`, `proxy.test.ts` y los de `apps/api/tests/`), `components/brand/wordmark.tsx`, `app/icon.png` (copia de `public/brand/terpenex-symbol.png`), `design-tokens.test.ts` con los pares de `highlight`, y la línea de fuentes de `CLAUDE.md`.
  - T034: `button.tsx` (radio 4 px, `iconEnd`, secundario `border-ink`), `icon-button.tsx`, `badge.tsx` (tonos `offer`, `soldOut`), `price.tsx` (`compareAtClp`), `product-card.tsx` (estructura de design.md), `product-carousel.tsx` (cliente, `scrollBy`, sin librerías), `field.tsx` (variante `underline`). Los consumidores actuales (`auth-form`, admin) solo cambian por el radio.
  - T036: `app/(site)/contact/page.tsx` estática con `siteConfig.contact`.
  - T035: `site-header.tsx`, `site-navigation.tsx`, `navigation-items.ts` (Inicio, Catálogo, Contacto; "Ingresar" pasa al icono Cuenta; "Items" sale de la nav pública), `header-search.tsx` (cliente, `router.push` a `/products?search=`), `header-cart-link.tsx` (lee el contador de `lib/cart.ts` si existe; si no, solo el icono), `site-footer.tsx` (legales de T025 + redes).
  - T037: `components/marketing/footer-subscribe.tsx` montado en `site-footer.tsx`; reutiliza el cliente y los mensajes de `subscribe-popup.tsx` (T016) si ya existe, si no los crea en `lib/subscribers.ts` para que el popup los reutilice.
  - T038: `app/(site)/page.tsx` (Server Component), `components/home/*` (un archivo por bloque), `lib/home-content.ts` (textos e imágenes `null`), `@keyframes marquee` en `globals.css`; destacados con `lib/public-products-api.ts` (`featured: true`, primera página; la UI muestra hasta 8).

### WS-02 · Edad y cuentas
- Datos: `User.birthDate DateTime? @db.Date` (nullable para cuentas existentes).
- Shared (`auth.ts`): `birthDate` obligatoria en `registerSchema` (`YYYY-MM-DD`); `MIN_CUSTOMER_AGE = 18` e `isAdult(birthDate, now)` con fecha de hoy en `America/Santiago` (DEC-008).
- API: `auth-service.ts` valida edad y guarda la fecha; 422 con `{ message, status }`. El campo web en `auth-form.tsx` va en el mismo PR (T002).
- Web (T003): `components/auth/age-gate.tsx` montado en `app/(site)/layout.tsx` (cliente, `localStorage` en try/catch, foco atrapado); página `app/(site)/age-restricted/page.tsx`.

### WS-01 · Catálogo
- Datos:
  - `Product`: `id`, `slug @unique`, `name`, `description`, `category ProductCategory`, `isPublished`, `isArchived`, timestamps; `@@index([isPublished, isArchived, category])`.
  - `ProductImage` (T028): `id`, `productId` (cascade), `url`, `publicId @unique`, `position`; `@@index([productId, position])`.
  - `ProductVariant`: `id`, `productId` (cascade), `name`, `sku @unique`, `priceClp Int`, `stock Int`, `isActive`, `position Int`.
  - T033 (DEC-017): `Product.isFeatured Boolean @default(false)` + `@@index([isFeatured])`; `ProductVariant.compareAtPriceClp Int?` con `CHECK ("compareAtPriceClp" IS NULL OR "compareAtPriceClp" > "priceClp")` en el SQL de la migración `add_offers_featured`. Shared: `compareAtPriceClp` opcional y nullable en el esquema de variante con `refine` (> `priceClp`, mensaje en el campo), `isFeatured` opcional en create/update, `featured` booleano en el esquema de lista pública, `compareAtFromClp: number | null` en `PublicProductSummary` (sin `isFeatured`: la portada filtra con `featured=true`), `isFeatured` en `Product` (admin), `compareAtPriceClp: number | null` en `PublicProductVariant`.
- API admin: `app/api/admin/products/**` (copia de `admin/items`); PATCH reemplaza variantes por SKU (crea, actualiza, desactiva las que faltan; nunca borra variantes con pedidos).
- API pública: `app/api/products/route.ts` y `[slug]/route.ts`; el DTO público no incluye `isArchived` ni stock exacto por encima de 10 (`inStock`, `lowStock`); `?featured=true` filtra destacados con el mismo criterio de visibilidad (RF-27).
- Web: `lib/products.ts` (estado URL con `category`, `search`, `page`, mismos nombres que la API), `lib/public-products-api.ts` (Server Components, patrón `public-items-api.ts`), `components/products/*`, páginas en `app/(site)/products/**` y `app/admin/products/**`. Fotos con `next/image` y loader de Cloudinary (RF-21, DEC-012). Precio con `formatClp()` (DEC-003).

### WS-03 · Carrito y checkout
- Datos:
  - `ShopSettings` (fila única `id = 1`): `flatShippingClp`, `freeShippingFromClp`, `pickupAddress`, `transferInstructions`.
  - `Order`: `id`, `number Int @default(autoincrement()) @unique`, `accessToken @unique`, `userId?`, `email`, `name`, `phone`, `birthDate @db.Date`, `status OrderStatus`, `shippingMethod ShippingMethod` (`DELIVERY`, `PICKUP`), dirección (`region`, `commune`, `street`, `extra?`), `subtotalClp`, `discountClp`, `shippingClp`, `totalClp`, `discountCode?`, `trackingNumber?`, timestamps por estado (`paidAt`, `shippedAt`, `deliveredAt`, `cancelledAt`).
  - `OrderItem`: `orderId`, `variantId`, snapshot `productName`, `variantName`, `sku`, `unitPriceClp`, `quantity`.
- Cotización (`services/checkout-service.ts`): una sola función `buildQuote(input, db = prisma)` usada por `quote` y por `orders` (T018 le pasa su transacción) para que nunca diverjan. El envío gratis se evalúa sobre el subtotal antes del descuento; líneas `UNAVAILABLE` valen 0 y `canCheckout` es falso mientras haya alguna con `issue`.
- Pedido (`services/order-service.ts`): `prisma.$transaction` → `buildQuote` → por línea `variant.updateMany({ where: { id, stock: { gte: qty }, isActive: true }, data: { stock: { decrement: qty } } })`; si `count === 0`, lanzar 409 (rollback) (DEC-004). Canje del código en la misma transacción.
- Edad: si hay sesión y `User.birthDate` existe, se usa; si no, `birthDate` es obligatoria en el payload; menor → 422.
- Web: `lib/cart.ts` + hook `use-cart.ts` (DEC-002), `app/(site)/cart`, `app/(site)/checkout`, `app/(site)/orders/[token]` (Server Component que llama a la API con el token; 404 si no existe).
- Regiones: lista de las 16 regiones de Chile en `packages/shared/src/order.ts`; la comuna es texto libre (≤ 60).

### WS-04 · Suscripción y descuento
- Datos: `Subscriber`: `email @unique`, `code @unique` (`BIENVENIDA-` + 6 caracteres aleatorios sin ambiguos), `marketingConsent Boolean`, `consentAt`, `redeemedAt?`, `redeemedOrderId?`.
- Reglas de RF-13 en `checkout-service.ts`; emails normalizados a minúsculas antes de comparar.
- Exportación (RF-20): serializador propio en `apps/api/src/lib/csv.ts`, reutilizable para otros exports.
- Web: `components/marketing/subscribe-popup.tsx` montado en el layout del sitio, solo tras aceptar el aviso de edad; respeta `prefers-reduced-motion`.

### WS-05 · Gestión de pedidos
- Transiciones en `services/order-admin-service.ts` con una tabla `ALLOWED_TRANSITIONS` en shared (la usan API y UI).
- Cancelar: transacción que repone stock por línea, libera el código (`redeemedAt = null`) y fija `cancelledAt`.
- Web admin: `app/admin/orders/**`; cliente: `app/(site)/account/orders/**`.

## Validación
| Milestone | WS | Comando | Éxito |
|---|---|---|---|
| M1 Base | WS-06, WS-02 | `npm test && npm run typecheck` | exit 0 tras T001-T003 |
| M2 Catálogo | WS-01 | `npm test -w @portal/api && npm test -w @portal/web` | exit 0 tras T004-T010 |
| M3 Compra | WS-03, WS-04 | `npm test && npm run lint && npm run typecheck` | exit 0 tras T011-T019 |
| M4 Operación | WS-05, WS-06 | `npm test && npm run lint && npm run typecheck && npm run build` | exit 0 tras T020-T026 (salvo T024) |
| M5 Marca | WS-06, WS-01, WS-04 | `npm test && npm run lint && npm run typecheck && npm run build` | exit 0 tras T032-T038 |

## Intervención humana
1. Revisar y hacer merge de cada PR (o activar el auto-merge nocturno).
2. Revisión legal y nombre definitivo antes de lanzar.
3. T024: elegir pasarela y cargar credenciales.
4. Portada (T039): subir las imágenes con los tamaños de T039 a `apps/web/public/home/`. Contacto y redes: completar `siteConfig.contact` y `siteConfig.social` en `apps/web/src/lib/site-config.ts`.
5. Fotos (T028): crear cuenta en Cloudinary y cargar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` en `apps/api/.env.local` y en el hosting. Sin ellas, subir fotos responde 503.
