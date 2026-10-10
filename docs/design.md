# Dirección de diseño

Fuente de verdad visual (DEC-013). Precedencia: `CLAUDE.md` > este archivo > skills. Stack: solo tokens de `globals.css`, `@phosphor-icons/react` (DEC-014) y animación únicamente con CSS.
Identidad Terpenex (DEC-015) y estructura de la landing de referencia (DEC-016): se copia la estructura de bloques, botones y tarjetas, nunca su contenido, mascota ni imágenes.

## Design Read

Lectura: tienda online de terpenos y vapeo 18+ en Chile, botánica y enérgica (verde de hoja + amarillo de gota del logo), con portada de bloques grandes y tipografía de marca en mayúsculas, sobre Tailwind 4 + tokens propios, sin design system externo.

- Audiencia: adultos que compran desde el móvil, minoristas y B2B; deben sentir una marca con carácter y a la vez una tienda seria y legal.
- Restricción silenciosa: regulación y salud (aviso de edad, advertencia sanitaria). La energía va en la portada; catálogo, carrito y checkout siguen siendo sobrios.

## Diales

| Dial | Valor | Motivo |
|---|---|---|
| `DESIGN_VARIANCE` | 5 | Portada de bloques a sangre con ritmo; el resto, rejilla ordenada. |
| `MOTION_INTENSITY` | 3 | Transiciones de estado y una sola cinta en movimiento (DEC-016). |
| `VISUAL_DENSITY` | 5 | Catálogo y carrito se escanean rápido. |

## Identidad

- Nombre: **Terpenex Company** (`siteConfig.name`); en la UI corta, "Terpenex". `APP_SLUG = "terpenex"`.
- Logo: `apps/web/public/brand/terpenex-logo.png` (original, fondo blanco opaco) y `terpenex-symbol.png` (símbolo recortado 512 px, fondo blanco). El PNG solo se usa sobre fondo blanco o como favicon (`app/icon.png`).
- Wordmark (`components/brand/wordmark.tsx`): texto real "TERPENEX" en `font-display` ancho (`wdth` 125, peso 800), "TERPENE" en `accent` y "X" en `highlight`; en el pie, debajo, "COMPANY" en `muted` con tracking amplio. Nombre accesible: "Terpenex Company, inicio". La X es logotipo: no cuenta como texto para contraste.
- Tono: español de Chile, frases cortas y verbos claros ("Explorar", "Añadir al carrito", "Confirmar pedido"). Sin jerga de vapeo ni promesas de salud.
- Una cosa memorable: la banda amarilla a sangre con la declaración de marca en mayúsculas.

## Paleta (roles de `globals.css`)

| Rol | Claro | Oscuro | Uso |
|---|---|---|---|
| `paper` | `#f5f8f2` | `#0b120d` | Fondo de página y fondo de imagen de producto |
| `surface` | `#ffffff` | `#121b15` | Header, pie, formularios, diálogos |
| `ink` | `#11231a` | `#edf4ec` | Texto principal; fondo del badge "Agotado" |
| `muted` | `#4b5c50` | `#a2b4a5` | Texto secundario, precio anterior |
| `line` | `#dbe3d6` | `#233229` | Bordes y divisores |
| `accent` | `#1e5b2b` | `#86c96f` | Botón primario, enlaces, nombre de producto, foco |
| `accent-hover` | `#15461f` | `#a1d68e` | Hover del acento |
| `on-accent` | `#ffffff` | `#0b120d` | Texto sobre `accent` |
| `highlight` | `#f3c623` | `#e8bd1d` | Banda de marca, badge "Oferta", X del wordmark |
| `on-highlight` | `#11231a` | `#0b120d` | Texto sobre `highlight` |

Reglas:
- Verde = acción; amarillo = superficie de marca. `highlight` nunca es color de texto sobre `paper` o `surface` (1,5:1 en claro).
- Rojo y esmeralda solo para error y éxito.
- Prohibido: beige/crema con latón, morado, degradados, neón, negro puro.

### Contraste (WCAG AA, texto ≥ 4,5:1)

Calculado con la fórmula WCAG 2.x; `apps/web/src/app/design-tokens.test.ts` lo mide y falla si algún par baja de 4,5 (T032 añade los pares de `highlight`).

| Par | Claro | Oscuro |
|---|---|---|
| `ink` / `paper` | 15,32 | 16,95 |
| `ink` / `surface` | 16,42 | 15,71 |
| `muted` / `paper` | 6,65 | 8,68 |
| `muted` / `surface` | 7,13 | 8,05 |
| `accent` / `paper` | 7,57 | 9,58 |
| `accent` / `surface` | 8,12 | 8,88 |
| `on-accent` / `accent` | 8,12 | 9,58 |
| `on-accent` / `accent-hover` | 10,89 | 11,32 |
| `on-highlight` / `highlight` | 10,09 | 10,60 |
| `paper` / `ink` (badge Agotado) | 15,32 | 16,95 |

`line` es decorativo: ningún dato depende de verlo.

## Tipografía

- **Archivo** variable (`next/font/google`, ejes `wght` y `wdth` 62-125) como `font-display`; **Geist** como `font-sans` para el cuerpo. Sin serif.
- Cortes de ancho con las utilidades nativas de Tailwind `font-stretch-expanded` (125 %) y `font-stretch-condensed` (75 %), siempre junto a `font-display` (la `@font-face` de Archivo declara `font-stretch: 62% 125%`).
- Wordmark: Archivo `wdth` 125, 800.
- Titulares de portada y de sección: Archivo `wdth` 75, 800, mayúsculas, `leading-[0.95]`, `tracking-tight`; 2 líneas máximo en el hero. Es tipografía de marca, no eyebrow: no hay etiquetas pequeñas en mayúsculas sobre los títulos.
- Navegación del header: Archivo `wdth` 75, 600, mayúsculas, `text-base`.
- Cuerpo: Geist `text-base leading-relaxed`, medida ≤ 65 caracteres. Botones y formularios en Geist, sentence case.
- Precios: Geist `tabular-nums`, CLP sin decimales (`$12.990`).

## Forma y materialidad

- Radios: 4 px en botones y campos; 8 px en tarjetas, diálogos e imagen de producto; píldora solo en `Badge`.
- Tarjetas de producto sin borde ni sombra: la imagen sobre `paper` es el contenedor. Tarjetas con borde solo para resumen de pedido y formularios.
- Sombras tintadas (`shadow-soft`, `shadow-lift`) solo en diálogos y menús.
- Iconos: Phosphor, peso `regular`, 20-24 px.

## Componentes (`components/ui/`, `components/brand/`)

| Componente | Estructura |
|---|---|
| `Button` primario | Rectangular 4 px, `bg-accent text-on-accent`, `h-11 px-5`, Geist 600, icono final opcional (`iconEnd`, p. ej. `ArrowRight`). Nunca "→" escrito. |
| `Button` secundario | Mismo tamaño, `border border-ink text-ink`, hover `bg-ink text-paper`. |
| `IconButton` | 44 × 44 px, icono 22 px, `aria-label` obligatorio; contador opcional (círculo `accent` con número, `aria-label` "Carrito, 3 unidades"). |
| `Badge` | Píldora sólida `text-xs font-semibold px-2.5 py-0.5`. Tonos nuevos: `offer` ("Oferta", `highlight`/`on-highlight`) y `soldOut` ("Agotado", `ink`/`paper`). Se conservan los tonos de estado del admin. |
| `Price` | Precio `ink` 600 tabular; con `compareAtClp`, a continuación `<s>` en `muted` precedido de texto `sr-only` "Precio anterior". |
| `ProductCard` | Imagen 1:1 radio 8 px sobre `paper` (marcador: símbolo en `muted` si no hay foto); badge en la esquina superior izquierda de la imagen (`Agotado` gana a `Oferta`, solo uno); debajo, nombre en `accent` `text-sm` 1-2 líneas y fila de precio. Toda la tarjeta es un enlace; hover: imagen `scale-[1.02]` 200 ms. |
| `ProductCarousel` | Fila `overflow-x-auto snap-x snap-mandatory`, sin barra visible, tarjetas `w-[44%] sm:w-[30%] lg:w-[16%]`; botones anterior/siguiente (`IconButton`) que hacen `scrollBy` de una página; con teclado, el foco recorre las tarjetas. |
| `Input variant="underline"` | Solo en la suscripción del pie, dentro de `Field`: label visible encima, input sin caja con `border-b border-ink`, botón `IconButton` `ArrowRight` "Suscribirme" alineado a la derecha. |
| `Wordmark` | Ver Identidad. |

Siguen vigentes `Field`, `Select`, `Skeleton`, `EmptyState`, `ConfirmDialog`, `flash-messages` y `pagination`, con los radios nuevos.

## Pantallas clave

**Header (todas las páginas públicas).** 72 px, `bg-surface`, borde inferior `line`, sticky. Izquierda: `Wordmark` y, en línea a su derecha, la nav "Inicio", "Catálogo", "Contacto" (activa en `ink`, resto en `muted`). Derecha: `IconButton` Buscar (despliega un campo bajo el header que navega a `/products?search=`; `Escape` lo cierra), Cuenta (`/login` o `/account`) y Carrito (`/cart`, con contador). En 375 px: wordmark, Buscar, Carrito y botón de menú; la nav va en el menú.

**Portada (`/`)**, bloques en este orden:
1. Hero a sangre: imagen de fondo (`object-cover`, 70 vh en escritorio, 4:5 en 375 px) con velo oscuro a la izquierda para AA (`bg-ink/70 text-paper` en claro, `dark:bg-paper/70 dark:text-ink` en oscuro: en ambos modos, velo oscuro y texto claro); texto alineado a la izquierda y centrado en vertical: titular de marca en 2 líneas ("¡Hola! Somos" / "Terpenex"), y botón "Explorar" con `ArrowRight` a `/products`, en `highlight`/`on-highlight` (sobre el fondo `accent` un botón primario verde no se vería). Sin subtítulo ni segundo CTA.
2. Cinta (48 px, `bg-surface`, borde `line` arriba y abajo): frases reales separadas por el símbolo pequeño, en bucle lento. Se pausa con hover o foco y queda estática con reduced motion.
3. Colección destacada: título de sección a la izquierda, enlace "Ver catálogo" a la derecha, `ProductCarousel` con hasta 8 productos `isFeatured`. Sin destacados, el bloque no se renderiza.
4. Banda de marca a sangre `bg-highlight`: símbolo del logo (sobre un disco `surface`, por su fondo blanco) a la izquierda en escritorio, arriba en 375 px; declaración de marca centrada en mayúsculas, 3-4 líneas, `text-on-highlight`.
5. Sección dividida: imagen (≈ 74 % del ancho) a la izquierda, a la derecha un título de marca corto (2 líneas) y un párrafo ≤ 25 palabras. En 375 px: imagen arriba, texto debajo.
6. Quiénes somos: franja `paper` con un párrafo ≤ 65 caracteres por línea (venta al detalle y B2B, envío a todo Chile).
7. Pie (abajo).

Imágenes de la portada: rutas en `lib/home-content.ts`; mientras valgan `null`, cada slot muestra un panel `bg-accent` con el símbolo, del mismo tamaño que la imagen final (sin saltos de layout). Tamaños esperados en T039.

**Pie (todas las páginas públicas).** `bg-surface`, borde superior `line`. Fila 1: a la derecha, suscripción (título "10 % en tu primer pedido", `Input variant="underline"` de email, checkbox de consentimiento obligatorio, código al suscribirse). Fila 2: `Wordmark` con "COMPANY"; enlaces legales (términos, privacidad, envíos, advertencia sanitaria). Fila 3: "© AAAA Terpenex Company" a la izquierda, iconos de Instagram y Facebook a la derecha (solo los que tengan URL en `siteConfig.social`).

**Catálogo (`/products`).** Título de sección, barra de filtros (categoría y búsqueda) y rejilla de `ProductCard`: 2 columnas en móvil, 3 en `md`, 4 en `xl`. Estado vacío con acción para limpiar filtros; esqueletos con la forma de la rejilla.

**Ficha (`/products/[slug]`).** Galería 1:1 a la izquierda, información a la derecha (una columna en móvil): nombre (Archivo, sin mayúsculas forzadas), `Price` con precio anterior si hay oferta, selector de variante accesible, stock, botón primario "Añadir al carrito" a todo el ancho de la columna (deshabilitado si "Agotado"). Advertencia sanitaria visible en `VAPES` y `E_LIQUIDS`, con borde y texto AA.

**Contacto (`/contact`).** Título de sección y lista de canales de `siteConfig.contact` (WhatsApp, email, Instagram, horario) con icono Phosphor; los vacíos no se muestran.

**Carrito.** Lista con `divide-y`: imagen pequeña, nombre y variante, cantidad 1-10, precio, quitar. Resumen fijo al pie en móvil. Estado vacío con enlace al catálogo.

**Checkout.** Una columna ≤ 40 rem. Etiqueta sobre cada campo, ayuda opcional, error debajo; método de envío con radios grandes; resumen con subtotal, descuento, envío y total. Confirmar es la única acción primaria.

## Movimiento (solo CSS)

- Transiciones de 150-200 ms en color, borde, opacidad y escala de imagen; `:active` con `scale-[0.98]`.
- Entradas puntuales: avisos (`flash-in`) y diálogos.
- Única animación en bucle: la cinta de la portada (`@keyframes marquee`, `translateX`, ≥ 30 s por vuelta).
- Todo se apaga con `prefers-reduced-motion` (regla global en `globals.css`); la cinta queda estática y legible.

## Estados obligatorios

Cargando (esqueleto con la forma final), vacío (con acción), error (junto al campo o formulario) y éxito (`flash()`). Foco visible global (`:focus-visible`, `accent`); sobre la banda amarilla el foco usa `ink`.

## Lista de rechazo

Se rechaza una pantalla si tiene: colores fuera de los tokens; `highlight` como color de texto sobre fondo claro; beige/latón, morado o degradados; mascota, imágenes o textos copiados de la referencia; tres tarjetas idénticas como único recurso; hero con más de 3 elementos de texto; botón con etiqueta en dos líneas; dos CTA con la misma intención; "→" escrito en un botón o enlace; placeholder como etiqueta; etiqueta pequeña en mayúsculas sobre un título; icono dibujado a mano; emoji; raya (em/en dash) en textos visibles; texto de salud con tono publicitario; desborde horizontal a 375 px; foco invisible; contraste por debajo de AA.
