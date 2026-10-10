# Decisiones

## DEC-001 · Pago por transferencia en el MVP; pasarela después
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: el usuario quiere pasarela, pero conectarla exige credenciales y aprobación del rubro, que no hay.
- Evidencia: el usuario pidió "lo haré después, continuemos con la web funcional".
- Opciones: conservadora: transferencia confirmada por el admin / propuesta: un proveedor simulado para desarrollo.
- Elegida: transferencia. Un proveedor simulado en producción permitiría marcar pedidos como pagados sin pagar; la transferencia es un flujo real y seguro desde el día uno.
- Impacto: WS-03 (RF-09, RF-10), WS-05 (RF-15), RF-11 queda pendiente (T024).
- Rollback: al conectar la pasarela, el estado `PENDING_PAYMENT` se reutiliza; la transferencia puede quedar como segundo medio.

## DEC-002 · Carrito en el navegador, totales en el servidor
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: dónde vive el carrito con compra como invitado.
- Opciones: tabla `Cart` en BD / `localStorage` con cotización en servidor.
- Elegida: `localStorage` (solo IDs de variante y cantidades). Sin sesión de invitado ni limpieza de carritos abandonados; el servidor nunca confía en precios del cliente (RF-07).
- Impacto: WS-03, T014, T017.
- Rollback: añadir tabla `Cart` sin cambiar el contrato de cotización.

## DEC-003 · Dinero en CLP como `Int`
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: representación de precios.
- Elegida: enteros en pesos (el CLP no usa decimales). Descuento: `floor(subtotal * 0.10)`.
- Impacto: WS-01, WS-03, WS-04, T004, T013.
- Rollback: migración a otra moneda requeriría columna de moneda y unidades menores.

## DEC-004 · El stock se descuenta al crear el pedido
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: con pago por transferencia hay horas entre pedido y pago.
- Opciones: descontar al pagar (riesgo de sobreventa) / descontar al crear el pedido (reserva).
- Elegida: descontar al crear, con `updateMany … where stock >= qty` dentro de una transacción; si alguna línea falla, rollback y 409. Cancelar repone. Los pedidos impagos los cancela el admin a mano (sin cron en el MVP).
- Impacto: WS-03 (T018), WS-05 (T020).
- Rollback: mover el descuento a la transición `PAID`.

## DEC-005 · Categoría como enum
- Fecha: 2026-10-08 · Estado: aprobada
- Elegida: enum `ProductCategory` = `TERPENES`, `VAPES`, `E_LIQUIDS`, `ACCESSORIES` en Prisma y en `@portal/shared` (verificado por `shared-contract.test.ts`). `VAPES` y `E_LIQUIDS` muestran la advertencia sanitaria.
- Impacto: WS-01, T004, T005.
- Rollback: tabla `Category` con migración de datos.

## DEC-006 · Imágenes por URL con `<img>`
- Fecha: 2026-10-08 · Estado: reemplazada por DEC-012
- Problema: `next/image` con dominios remotos obliga a tocar `next.config.ts`, y subir archivos requiere un servicio externo.
- Elegida: campo `imageUrl` (https, opcional) y `<img loading="lazy">` con dimensiones fijas. Cloudinary (receta en `docs/recipes/`) queda para después.
- Impacto: WS-01, T005, T009, T010.
- Rollback: aplicar la receta de Cloudinary.

## DEC-007 · Pedido de invitado accesible por token
- Fecha: 2026-10-08 · Estado: aprobada
- Elegida: `Order.accessToken` aleatorio de 32 bytes en base64url, único; `/orders/[token]` lo consulta. Nunca se expone el `id` ni se permite buscar por email.
- Impacto: WS-03 (T018, T019), WS-05.
- Rollback: —

## DEC-008 · Edad: aviso en cliente, garantía en servidor
- Fecha: 2026-10-08 · Estado: aprobada
- Evidencia: el usuario eligió "declaración + fecha".
- Elegida: el aviso 18+ es solo UX (`localStorage`); la API rechaza con 422 a menores en el registro y en cada pedido según la fecha de nacimiento. Edad mínima en `@portal/shared` (`MIN_CUSTOMER_AGE = 18`), calculada en `America/Santiago`.
- Impacto: WS-02, T002, T003, T018.
- Rollback: —

## DEC-009 · Se conserva el módulo admin de Item
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: `CLAUDE.md` documenta cómo retirar solo la capa pública; retirar todo exige una migración destructiva.
- Elegida: retirar la capa pública (T023) y quitar "Items" de la navegación admin; el código admin queda como referencia.
- Impacto: WS-06, T023.
- Rollback: —

## DEC-010 · Sin emails en el MVP
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: enviar emails requiere proveedor y credenciales.
- Elegida: el código de descuento y la confirmación del pedido se muestran en pantalla.
- Impacto: WS-03 (T019), WS-04 (T015).
- Rollback: añadir proveedor de email (tarea humana por el secreto).

## DEC-011 · Contrato del issue #1 integrado como exportación de suscriptores
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: la rama `claude/issue-1-20261008-0507` trae otro `docs/spec.md` (exportar Items a CSV) que choca con este contrato.
- Evidencia: el usuario pidió integrar de forma incremental y quitar lo innecesario; Item queda oculto (DEC-009).
- Elegida: descartar la exportación de Items y reutilizar sus reglas de CSV (RFC 4180, anti-inyección de fórmulas, BOM, tope de filas) para suscriptores, útil mientras no haya proveedor de email (DEC-010).
- Impacto: WS-04, RF-20, T027. El issue #1 y su rama se cierran sin merge.
- Rollback: —

## DEC-012 · Fotos de producto con Cloudinary
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: el admin necesita subir fotos; pegar URLs (DEC-006) es frágil.
- Evidencia: el usuario aprobó usar la receta `docs/recipes/cloudinary.md`; `CLAUDE.md` prohíbe binarios en BD.
- Elegida: subida firmada desde la API a Cloudinary; la BD guarda `url` y `publicId`. Sin dependencias nuevas.
- Autorizado de forma explícita para el implementador: añadir los nombres `CLOUDINARY_*` (vacíos) a `.env.example` y a los tests de env, y el bloque `images` en `apps/web/next.config.ts`. Los valores de las claves los carga el usuario; sin ellos, la subida responde 503 y el resto funciona, así que los tests y el modo noche no dependen del secreto.
- Impacto: WS-01, RF-01, RF-21, T004, T010, T028, T029.
- Rollback: sección "Reversión" de la receta.

## DEC-013 · Diseño dirigido por design-taste-frontend
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: 30 tareas de UI implementadas por separado (muchas de noche) derivan en estéticas distintas.
- Evidencia: el usuario pidió priorizar el diseño con las skills del proyecto y `design-taste-frontend` como directora.
- Elegida: una sola dirección visual en `docs/design.md` (T001) antes de cualquier pantalla; kit de UI base (T030) del que dependen las tareas de UI; auditoría al cerrar cada tarea de UI y una final (T031). Roles: taste dirige, `frontend-design` ejecuta identidad, `react-rules` guía el código y `web-design-guidelines` audita. Precedencia: `CLAUDE.md` > `docs/design.md` > skills; lo que taste recomiende fuera del stack (Motion, Zustand, otros design systems, imágenes de picsum) no aplica.
- Impacto: WS-06, RF-17, RF-22, T001, T030, T031 y las deps de T003, T009, T010, T012, T021, T025, T026.
- Rollback: —

## DEC-014 · Phosphor como única librería de iconos; animación solo CSS
- Fecha: 2026-10-08 · Estado: aprobada
- Problema: taste prohíbe dibujar iconos a mano y recomienda Motion; `CLAUDE.md` prohíbe dependencias sin aprobación.
- Evidencia: el usuario aprobó `@phosphor-icons/react` y eligió animaciones solo con CSS.
- Elegida: `@phosphor-icons/react@2.1.10` (exacta) en `apps/web`, instalada fuera de la cola para que el modo noche no instale nada. Sin Motion: transiciones y keyframes CSS con `prefers-reduced-motion`.
- Impacto: WS-06, RF-22, T030.
- Rollback: quitar la dependencia y sustituir los iconos.

## DEC-015 · Identidad Terpenex Company
- Fecha: 2026-10-09 · Estado: aprobada
- Problema: el nombre era provisional ("Terpenos & Vapes") y la paleta de T001 tenía un solo acento verde; el usuario aportó el logo definitivo (hojas verdes, gota y "X" amarillas).
- Evidencia: el usuario eligió "Terpenex Company" con `APP_SLUG = "terpenex"` y wordmark tipográfico + PNG solo para favicon y fondos blancos (el PNG tiene fondo blanco opaco).
- Opciones: conservadora: mantener un solo acento y usar el amarillo solo en el logo / propuesta: segundo token de superficie `highlight` con `on-highlight`.
- Elegida: `highlight` como superficie de marca (banda, badge "Oferta", X del wordmark), nunca como texto sobre fondo claro (1,5:1). Archivo variable (`wdth`) para display y wordmark, Geist para cuerpo, vía `next/font` (sin dependencias). Reemplaza la regla "un solo acento" de `docs/design.md` y amplía la lista de tokens de `CLAUDE.md`.
- Impacto: WS-06, RF-17, RF-23, T032, T034. Cambiar `APP_SLUG` renombra cookies y claves de almacenamiento: las sesiones locales y el aviso de edad aceptado se pierden una vez.
- Rollback: restaurar tokens, fuente y `APP_SLUG` anteriores desde git.

## DEC-016 · Estructura de bananacompany.cl como referencia
- Fecha: 2026-10-09 · Estado: aprobada
- Problema: el usuario quiere la estructura de botones, productos y portada de esa landing "lo más exacta" posible, y varias piezas chocan con `design-taste-frontend` y con el `docs/design.md` anterior.
- Evidencia: captura completa de bananacompany.cl aportada por el usuario el 2026-10-09 (no se versiona: es de un tercero; su estructura queda descrita en `docs/design.md`).
- Opciones: conservadora: tomar solo el orden de bloques / propuesta: copiar la estructura de bloques, header, botones y tarjetas con tokens y tipografía propios.
- Elegida: la propuesta. Excepciones explícitas a la skill: badge de estado sobre la imagen del producto (estado real, no decoración), una única cinta en bucle (se pausa con hover/foco y se detiene con reduced motion) y titulares de marca en mayúsculas condensadas (no son eyebrows). No se copian textos, mascota ni imágenes.
- Impacto: WS-06, WS-04, RF-24, RF-25, RF-26, RF-28, T034, T035, T036, T037, T038, T039.
- Rollback: volver a la sección "Pantallas clave" anterior de `docs/design.md` (git).

## DEC-017 · Ofertas y destacados en el modelo
- Fecha: 2026-10-09 · Estado: aprobada
- Problema: la estructura de referencia muestra "Oferta" con precio tachado y una colección destacada; el modelo de T005 no tiene esos datos.
- Evidencia: el usuario aprobó incluir ambos.
- Opciones: conservadora: carrusel con los más recientes y sin ofertas / propuesta: `ProductVariant.compareAtPriceClp Int?` y `Product.isFeatured Boolean`.
- Elegida: la propuesta, en una migración nueva `add_offers_featured` (T005 ya está hecha) con `CHECK (compareAtPriceClp IS NULL OR compareAtPriceClp > priceClp)` y la misma regla en shared. La tarjeta usa la variante activa más barata; "Agotado" reemplaza a "Oferta". El precio de referencia lo carga el admin y debe ser real (revisión legal).
- Impacto: WS-01, RF-27, T033, T006, T007, T008, T009, T010, T034, T038.
- Rollback: migración que elimina ambas columnas; la UI deja de mostrar "Oferta" y la portada oculta la colección.
