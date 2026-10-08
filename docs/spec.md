# Tienda de terpenos y cigarrillos electrónicos

> Estado: SHIP
> Tipo: starter · Tamaño: normal · Actualizado: 2026-10-08

## Objetivo
E-commerce para Chile que vende terpenos, cigarrillos electrónicos, líquidos y accesorios solo a mayores de 18 años.
Un visitante verificado como mayor de edad encuentra un producto, elige variante y completa un pedido (con o sin cuenta) en menos de 3 minutos; el admin gestiona catálogo, stock y pedidos desde `/admin` sin tocar la base de datos.

## Alcance
- Dentro: catálogo con variantes y stock, verificación de edad, carrito, checkout como invitado o con cuenta, pago por transferencia confirmado por el admin, envío con tarifa fija o retiro, popup de suscripción con 10 % de descuento en el primer pedido, gestión de pedidos, identidad de la tienda y páginas legales.
- Fuera: pasarela de pago real (RF-11, la conecta el usuario más adelante), envío de emails, integración con couriers, tarifas por región, verificación documental de identidad, multi-moneda, reseñas, cupones distintos del de bienvenida, subida de imágenes (se usan URLs), exportar Items a CSV (DEC-011).

## Workstreams

### WS-01 · Catálogo · L
- Objetivo: productos con variantes administrables y catálogo público navegable.
- deps: WS-06 (solo T001, identidad)
- Aceptación: dado un producto publicado con una variante con stock, cuando un visitante abre `/products`, entonces lo ve con su precio en CLP y puede abrir su ficha.

### WS-02 · Edad y cuentas · S
- Objetivo: impedir la compra a menores de 18 años.
- deps: —
- Aceptación: dado un visitante que declara fecha de nacimiento de hace 17 años, cuando intenta registrarse o pedir, entonces la API responde 422.

### WS-03 · Carrito y checkout · L
- Objetivo: del carrito a un pedido `PENDING_PAYMENT` con totales calculados en el servidor.
- deps: WS-01, WS-02, WS-04
- Aceptación: dado un carrito con 2 variantes con stock, cuando el visitante completa el checkout, entonces se crea el pedido, el stock baja y ve las instrucciones de transferencia.

### WS-04 · Suscripción y descuento · M
- Objetivo: captar emails con un popup y premiar el primer pedido con un 10 %.
- deps: —
- Aceptación: dado un email suscrito sin pedidos previos, cuando usa su código en el checkout, entonces el subtotal baja un 10 % (redondeado hacia abajo al peso).

### WS-05 · Gestión de pedidos · M
- Objetivo: el admin procesa pedidos; el cliente consulta los suyos.
- deps: WS-03
- Aceptación: dado un pedido `PENDING_PAYMENT`, cuando el admin lo marca pagado y luego enviado con número de seguimiento, entonces el cliente ve ambos estados.

### WS-06 · Identidad y legal · S
- Objetivo: la plantilla deja de parecer el starter y muestra la información legal mínima.
- deps: —
- Aceptación: dado cualquier página pública, cuando se carga, entonces muestra el nombre de la tienda y enlaces a términos, privacidad, envíos y advertencia sanitaria.

## Requisitos funcionales
- **RF-01** (WS-01) Admin crea, edita, publica/despublica y archiva productos con categoría, slug único, descripción, URL de imagen y 1-20 variantes (nombre, SKU único, precio CLP entero > 0, stock ≥ 0, activa). Dado un SKU repetido, cuando guarda, entonces 409.
- **RF-02** (WS-01) Catálogo público en `/products`: solo productos publicados con ≥ 1 variante activa; filtro por categoría y búsqueda en la URL (`category`, `search`, `page`); 12 por página. Dado `?category=TERPENES`, cuando carga, entonces solo muestra terpenos.
- **RF-03** (WS-01) Ficha `/products/[slug]` con selector de variante, precio, stock ("Agotado" deshabilita la compra) y la advertencia sanitaria si la categoría contiene nicotina (`VAPES`, `E_LIQUIDS`). Dado un slug inexistente o despublicado, cuando se abre, entonces 404.
- **RF-04** (WS-02) Aviso de edad al entrar a cualquier página pública: "Soy mayor de 18" lo recuerda en ese navegador; "Soy menor" lleva a `/age-restricted` sin catálogo. Es solo UX; la garantía la dan RF-05 y RF-08.
- **RF-05** (WS-02) El registro exige fecha de nacimiento; dado un menor de 18 años, cuando se registra, entonces 422 con error en el campo.
- **RF-06** (WS-03) Carrito en el navegador: añadir variante, cambiar cantidad (1-10), quitar; persiste al recargar; el header muestra el número de unidades.
- **RF-07** (WS-03) `POST /api/checkout/quote` recalcula precios, stock, envío y descuento en el servidor. Dado un carrito con un precio manipulado, cuando cotiza, entonces usa el precio de la BD.
- **RF-08** (WS-03) Checkout como invitado o con cuenta: email, nombre, teléfono, fecha de nacimiento (si la cuenta no la tiene o es invitado), método de envío y dirección en Chile (región, comuna, calle y número) si es despacho. Dado stock suficiente, cuando confirma, entonces crea el pedido `PENDING_PAYMENT` con número correlativo y descuenta stock de forma atómica; dado stock insuficiente en cualquier línea, entonces 409 y no crea nada.
- **RF-09** (WS-03) Tras el pedido, `/orders/[token]` muestra el resumen, el estado y las instrucciones de transferencia. El token es secreto (≥ 128 bits); sin token válido, 404.
- **RF-10** (WS-03) Ajustes de tienda editables en `/admin/settings`: tarifa fija de despacho, monto para envío gratis, dirección de retiro e instrucciones de transferencia. El checkout los usa al instante.
- **RF-11** (WS-03) Pago en línea con pasarela. [PENDIENTE: el usuario elegirá pasarela y aportará credenciales más adelante (Mercado Pago recomendado); no bloquea el resto]
- **RF-12** (WS-04) Popup de suscripción a visitantes que pasaron el aviso de edad: email y consentimiento de marketing obligatorio; al suscribirse muestra su código del 10 %. Se muestra una vez por navegador (cerrar o suscribirse lo oculta) y respeta `prefers-reduced-motion`.
- **RF-13** (WS-04) El código de bienvenida aplica un 10 % sobre el subtotal (no al envío) una sola vez, solo si el email del pedido es el email suscrito y ese email no tiene pedidos previos no cancelados. Dado otro email, cuando se usa el código, entonces la cotización lo rechaza con un mensaje junto al campo.
- **RF-14** (WS-04) Admin ve en `/admin/subscribers` los suscriptores paginados con fecha y si canjearon el código.
- **RF-15** (WS-05) Admin lista pedidos en `/admin/orders` (filtro por estado, búsqueda por número o email, paginado), ve el detalle y aplica transiciones válidas: `PENDING_PAYMENT→PAID|CANCELLED`, `PAID→SHIPPED|DELIVERED|CANCELLED`, `SHIPPED→DELIVERED`. `SHIPPED` exige número de seguimiento. Cancelar repone stock y libera el código de descuento. Dada una transición inválida, entonces 409.
- **RF-16** (WS-05) Un cliente con cuenta ve sus pedidos en `/account/orders` y su detalle; los pedidos como invitado con el mismo email no se vinculan.
- **RF-17** (WS-06) Identidad: nombre de la tienda, `APP_SLUG`, metadatos y paleta propia en los tokens de `globals.css`.
- **RF-18** (WS-06) Páginas `/legal/terms`, `/legal/privacy`, `/legal/shipping` y `/legal/health-warning`, enlazadas en el footer. Contenido inicial con texto marcado "Borrador pendiente de revisión legal".
- **RF-19** (WS-06) Retirar la capa pública de Item según la receta de `CLAUDE.md`; el módulo admin de Item se conserva (DEC-009).
- **RF-20** (WS-04) Admin descarga desde `/admin/subscribers` un CSV con los suscriptores (`email,code,consentAt,redeemedAt`, más recientes primero, máx. 10 000 filas): RFC 4180, BOM UTF-8 y celdas que empiezan por `=`, `+`, `-`, `@`, tab o CR prefijadas con `'` (DEC-011). Dado un USER, cuando pide el CSV, entonces 403.

## No funcionales
- Dinero en CLP como entero (DEC-003); sin decimales en la UI (`$12.990`).
- Toda entrada validada con esquemas de `@portal/shared`; autorización en cada handler y página privada según `CLAUDE.md`.
- Límites de frecuencia en suscripción, cotización y creación de pedidos (`lib/http/rate-limit.ts`).
- Responsive desde 375 px, sin desborde; accesible por teclado (popup y aviso de edad con foco atrapado y `Escape` donde corresponda).
- Sin dependencias nuevas.

## Casos límite
- Dos compradores piden la última unidad a la vez: solo uno crea el pedido (RF-08).
- El admin cambia un precio entre la cotización y el pedido: el pedido usa el precio vigente y lo muestra antes de confirmar.
- Variante desactivada o producto despublicado que sigue en un carrito: la cotización la marca y el checkout no avanza hasta quitarla.
- Pedido cancelado que usó el código: el código vuelve a estar disponible.
- Cuenta antigua (admin o seed) sin fecha de nacimiento: el checkout la pide.
- Carrito vacío o con cantidades fuera de 1-10: 400.

## Riesgos y pendientes
- [PENDIENTE: revisión legal en Chile antes de publicar — advertencias sanitarias obligatorias, restricciones de publicidad de productos con nicotina (afecta al popup de marketing) y condiciones de venta y despacho. No bloquea el desarrollo, sí el lanzamiento]
- [PENDIENTE: nombre definitivo de la tienda — se usa "Terpenos & Vapes" como provisional]
- Las pasarelas pueden rechazar el rubro: confirmarlo antes de RF-11.
- Sin emails, el cliente invitado depende del enlace con token: la página de confirmación pide guardarlo.
