/**
 * Texts and images of the home page (RF-25, docs/design.md). Draft copy: review it before launch.
 * Images: put the files in `apps/web/public/home/` and set their paths here (T039); while an image
 * is null, its slot shows the brand panel with the same aspect ratio.
 */
export type HomeImage = { src: string; alt: string };

export const homeContent = {
  hero: {
    titleLines: ["¡Hola! Somos", "Terpenex"],
    cta: { label: "Explorar", href: "/products" },
    image: null as HomeImage | null,
  },
  /** Real facts only: they repeat in the moving strip. */
  marquee: ["Envío a todo Chile", "Retiro en tienda", "Pago por transferencia", "Solo mayores de 18 años"],
  featured: { title: "Colección destacada", linkLabel: "Ver catálogo" },
  band: {
    statement: "Terpenos, líquidos y accesorios elegidos uno a uno, para que cada preparación salga como la planeaste.",
  },
  split: {
    title: ["Prepara con calma.", "Disfruta sin apuro."],
    body: "Encuentra terpenos de perfil botánico, dispositivos y accesorios en un solo lugar, con despacho a todo Chile.",
    image: null as HomeImage | null,
  },
  about:
    "Terpenex Company es una tienda chilena de terpenos, cigarrillos electrónicos, líquidos y accesorios para mayores de 18 años. Despachamos a todo Chile y también puedes retirar tu pedido.",
};
