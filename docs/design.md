# Dirección de diseño

Fuente de verdad visual (DEC-013). Precedencia: `CLAUDE.md` > este archivo > skills. Stack: solo tokens de `globals.css`, `@phosphor-icons/react` (DEC-014) y animación únicamente con CSS.

## Design Read

Lectura: tienda online de comercio regulado 18+ para compradores adultos en Chile, con un lenguaje sobrio y botánico (confianza primero, producto después), apoyada en Tailwind 4 + tokens propios + Geist, sin design system externo.

- Audiencia: adultos que comparan variantes y precios en el móvil; deben sentir que es una tienda seria y legal, no un sitio "de vapeo".
- Restricción silenciosa: regulación y salud (aviso de edad, advertencia sanitaria). La claridad pesa más que el adorno.

## Diales

| Dial | Valor | Motivo |
|---|---|---|
| `DESIGN_VARIANCE` | 4 | Comercio regulado: composición ordenada, asimetría solo en la portada. |
| `MOTION_INTENSITY` | 2 | Transiciones de estado; nada de movimiento decorativo. |
| `VISUAL_DENSITY` | 5 | Catálogo y carrito necesitan escanearse rápido. |

## Identidad

- Nombre: **Terpenos & Vapes** (`siteConfig.name`; nombre definitivo pendiente, ver plan). `APP_SLUG = "terpenos"`.
- Tono: español de Chile neutro, frases cortas, verbos claros ("Añadir al carrito", "Confirmar pedido"). Sin jerga de vapeo ni promesas de salud.
- Una cosa memorable: el verde profundo sobre un papel casi blanco con tinte vegetal; todo lo demás es silencioso.

## Paleta (roles de `globals.css`)

| Rol | Claro | Oscuro | Uso |
|---|---|---|---|
| `paper` | `#f6f8f5` | `#0d1310` | Fondo de página |
| `surface` | `#ffffff` | `#141c17` | Tarjetas, formularios, diálogos |
| `ink` | `#14211b` | `#eef3ef` | Texto principal |
| `muted` | `#4a5a51` | `#9fb1a6` | Texto secundario, ayudas |
| `line` | `#dbe2dc` | `#26332b` | Bordes y divisores |
| `accent` | `#1f6048` | `#6fd0a0` | Botón primario, enlaces, foco |
| `accent-hover` | `#174a37` | `#8fdcb6` | Hover del acento |
| `on-accent` | `#f6f8f5` | `#0d1310` | Texto sobre `accent` |

Reglas: un solo acento (verde) en todo el sitio. Rojo y esmeralda solo para error y éxito. Prohibido: beige/crema con latón, morado, degradados decorativos, neón.

### Contraste (WCAG AA, texto ≥ 4,5:1)

Medido por `apps/web/src/app/design-tokens.test.ts`, que falla si algún par baja de 4,5.

| Par | Claro | Oscuro |
|---|---|---|
| `ink` / `paper` | 15,57 | 16,73 |
| `ink` / `surface` | 16,63 | 15,48 |
| `muted` / `paper` | 6,85 | 8,33 |
| `muted` / `surface` | 7,31 | 7,71 |
| `accent` / `paper` | 6,96 | 10,03 |
| `accent` / `surface` | 7,43 | 9,27 |
| `on-accent` / `accent` | 6,96 | 10,03 |
| `on-accent` / `accent-hover` | 9,49 | 11,70 |

`line` es decorativo: ningún dato depende de verlo.

## Tipografía

- **Geist** (`next/font/google`, variable `--font-sans-family`) para todo; `font-display` apunta a la misma fuente. Sin serif.
- Títulos: `font-semibold tracking-tight`, 2 líneas máximo en escritorio. Cuerpo: `text-base leading-relaxed`, medida ≤ 65 caracteres.
- Precios: cifras tabulares (`tabular-nums`), formato CLP sin decimales (`$12.990`).

## Forma y materialidad

- Radio único: 12 px en tarjetas y diálogos, 8 px en campos y botones. Sin píldoras salvo `Badge`.
- Tarjetas solo cuando agrupan (producto, resumen de pedido); el resto con `border-t`, `divide-y` y espacio.
- Sombras tintadas (`shadow-soft`, `shadow-lift`), nunca negro puro.
- Iconos: Phosphor, un solo peso (`regular`) en todo el sitio.

## Pantallas clave

**Portada.** Cabecera de 72 px. Hero a dos columnas en escritorio (texto a la izquierda, composición de producto a la derecha), una columna en 375 px. Titular ≤ 2 líneas, subtexto ≤ 20 palabras, un CTA primario ("Ver catálogo") y uno secundario. Debajo: las cuatro categorías como filas con borde, no cuatro tarjetas idénticas; luego envío y retiro; el pie con enlaces legales.

**Catálogo (`/products`).** Barra de filtros (categoría y búsqueda) sobre una rejilla de 2 columnas en móvil, 3 en `md` y 4 en `xl`. `ProductCard`: imagen 4:5 (marcador neutro sin foto), nombre, precio "desde", estado "Agotado". Estado vacío con acción para limpiar filtros; esqueletos con la forma de la rejilla.

**Ficha (`/products/[slug]`).** Galería a la izquierda, información a la derecha (una columna en móvil). Selector de variante accesible, precio, stock, botón "Añadir al carrito" (deshabilitado si "Agotado"). Advertencia sanitaria visible en `VAPES` y `E_LIQUIDS`, con borde y texto de contraste AA, no en gris tenue.

**Carrito.** Lista con `divide-y`: nombre y variante, cantidad 1-10, precio, quitar. Resumen fijo al pie en móvil. Estado vacío con enlace al catálogo.

**Checkout.** Una columna ≤ 40 rem. Etiqueta sobre cada campo, ayuda opcional, error debajo; método de envío con radios grandes; resumen con subtotal, descuento, envío y total. Sin pasos decorativos: confirmar es la única acción primaria.

## Movimiento (solo CSS)

- Transiciones de 150-200 ms en color, borde y opacidad; `:active` con `scale-[0.98]`.
- Entradas puntuales: avisos (`flash-in`), diálogos y la portada al cargar; nada en bucle.
- Todo se apaga con `prefers-reduced-motion` (regla global en `globals.css`).

## Estados obligatorios

Cargando (esqueleto con la forma final), vacío (con acción), error (junto al campo o formulario) y éxito (`flash()`). Foco visible global (`:focus-visible`, acento).

## Lista de rechazo

Se rechaza una pantalla si tiene: colores fuera de los tokens; beige/latón, morado o degradados decorativos; tres tarjetas idénticas como único recurso; hero con más de 4 elementos de texto; botón con etiqueta en dos líneas; dos CTA con la misma intención; placeholder como etiqueta; icono dibujado a mano; emoji; texto de salud con tono publicitario; desborde horizontal a 375 px; foco invisible; contraste por debajo de AA.
