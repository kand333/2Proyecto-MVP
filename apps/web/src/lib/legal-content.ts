/**
 * Legal pages (RF-18). DRAFT pending legal review in Chile before launch (see docs/spec.md): every
 * page says so on screen. Plain paragraphs only; edit the texts here.
 */
export type LegalSlug = "terms" | "privacy" | "shipping" | "health-warning";

export type LegalPage = { title: string; description: string; sections: { heading: string; paragraphs: string[] }[] };

export const LEGAL_DRAFT_NOTICE = "Borrador pendiente de revisión legal";

export const legalPages: Record<LegalSlug, LegalPage> = {
  terms: {
    title: "Términos y condiciones",
    description: "Condiciones de compra en Terpenex Company.",
    sections: [
      {
        heading: "Quiénes pueden comprar",
        paragraphs: [
          "Solo personas mayores de 18 años. Al comprar declaras tu fecha de nacimiento y podemos rechazar o cancelar pedidos de menores de edad.",
        ],
      },
      {
        heading: "Precios y pago",
        paragraphs: [
          "Los precios están en pesos chilenos e incluyen IVA. El total del pedido se calcula al confirmar y el pago se realiza por transferencia bancaria.",
          "El pedido queda reservado hasta que confirmemos el pago; podemos cancelarlo si no recibimos la transferencia.",
        ],
      },
      {
        heading: "Ofertas y códigos",
        paragraphs: ["El precio anterior que mostramos en una oferta es el precio que cobramos antes. El código de bienvenida vale para el primer pedido del email suscrito."],
      },
    ],
  },
  privacy: {
    title: "Política de privacidad",
    description: "Cómo usamos tus datos en Terpenex Company.",
    sections: [
      {
        heading: "Datos que pedimos",
        paragraphs: ["Nombre, email, teléfono, fecha de nacimiento y dirección de despacho, solo para procesar tus pedidos y verificar tu edad."],
      },
      {
        heading: "Comunicaciones",
        paragraphs: ["Solo te enviamos novedades y promociones si aceptaste recibirlas al suscribirte."],
      },
      {
        heading: "Tus derechos",
        paragraphs: ["Puedes pedir acceso, rectificación o eliminación de tus datos a través de nuestros canales de contacto."],
      },
    ],
  },
  shipping: {
    title: "Envíos y retiro",
    description: "Despacho a todo Chile y retiro en tienda.",
    sections: [
      {
        heading: "Despacho",
        paragraphs: ["Despachamos a todo Chile una vez confirmado el pago. El costo de despacho se muestra en el checkout antes de confirmar el pedido."],
      },
      {
        heading: "Retiro en tienda",
        paragraphs: ["Si eliges retiro, te mostramos la dirección al confirmar el pedido. Lleva tu número de pedido y tu documento de identidad."],
      },
      {
        heading: "Seguimiento",
        paragraphs: ["Cuando enviamos tu pedido, verás el número de seguimiento en la página de tu pedido."],
      },
    ],
  },
  "health-warning": {
    title: "Advertencia sanitaria",
    description: "Información sobre productos con nicotina.",
    sections: [
      {
        heading: "Productos con nicotina",
        paragraphs: [
          "Los cigarrillos electrónicos y líquidos con nicotina contienen una sustancia altamente adictiva. No se recomiendan para personas que no fuman, embarazadas ni personas con enfermedades cardiovasculares.",
          "Mantén estos productos fuera del alcance de niñas, niños y mascotas.",
        ],
      },
      {
        heading: "Venta solo a mayores de 18 años",
        paragraphs: ["No vendemos a menores de edad bajo ninguna circunstancia."],
      },
    ],
  },
};

/** Footer order of the links. */
export const LEGAL_LINKS: { slug: LegalSlug; label: string }[] = [
  { slug: "terms", label: "Términos y condiciones" },
  { slug: "privacy", label: "Privacidad" },
  { slug: "shipping", label: "Envíos y retiro" },
  { slug: "health-warning", label: "Advertencia sanitaria" },
];
