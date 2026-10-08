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
- Fecha: 2026-10-08 · Estado: aprobada
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
