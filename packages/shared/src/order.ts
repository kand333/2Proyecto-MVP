import { z } from "zod";
import { birthDateSchema, registerSchema } from "./auth";
import { paginationQuerySchema } from "./pagination";
import { welcomeCodePattern } from "./subscriber";

// Contract of the quote and order endpoints (RF-07, RF-08, RF-09). Amounts are whole CLP (DEC-003).

/** Must match the Prisma enum `OrderStatus`. */
export const ORDER_STATUSES = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

/** Must match the Prisma enum `ShippingMethod`. */
export const SHIPPING_METHODS = ["DELIVERY", "PICKUP"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const SHIPPING_METHOD_LABELS: Record<ShippingMethod, string> = {
  DELIVERY: "Despacho a domicilio",
  PICKUP: "Retiro en tienda",
};

/** The 16 regions of Chile, by ISO 3166-2:CL code, north to south. */
export const CHILE_REGIONS = {
  AP: "Arica y Parinacota",
  TA: "Tarapacá",
  AN: "Antofagasta",
  AT: "Atacama",
  CO: "Coquimbo",
  VS: "Valparaíso",
  RM: "Metropolitana de Santiago",
  LI: "Libertador General Bernardo O'Higgins",
  ML: "Maule",
  NB: "Ñuble",
  BI: "Biobío",
  AR: "La Araucanía",
  LR: "Los Ríos",
  LL: "Los Lagos",
  AI: "Aysén del General Carlos Ibáñez del Campo",
  MA: "Magallanes y de la Antártica Chilena",
} as const;
export type ChileRegion = keyof typeof CHILE_REGIONS;
const regionCodes = Object.keys(CHILE_REGIONS) as [ChileRegion, ...ChileRegion[]];

export const MIN_LINE_QUANTITY = 1;
export const MAX_LINE_QUANTITY = 10;
export const MAX_CART_LINES = 30;
export const COMMUNE_MAX_LENGTH = 60;
export const STREET_MAX_LENGTH = 120;
export const ADDRESS_EXTRA_MAX_LENGTH = 120;
export const PHONE_MAX_LENGTH = 20;

const cartLineSchema = z.object({
  variantId: z.uuid({ error: "Producto inválido" }),
  quantity: z
    .number({ error: "Cantidad inválida" })
    .int({ error: "La cantidad debe ser un número entero" })
    .min(MIN_LINE_QUANTITY, { error: `La cantidad mínima es ${MIN_LINE_QUANTITY}` })
    .max(MAX_LINE_QUANTITY, { error: `La cantidad máxima es ${MAX_LINE_QUANTITY} por producto` }),
});
export type CartLine = z.output<typeof cartLineSchema>;

/** 1-30 lines, one per variant (DEC-002: the browser cart sends only ids and quantities). */
const cartLinesSchema = z
  .array(cartLineSchema, { error: "Carrito inválido" })
  .min(1, { error: "El carrito está vacío" })
  .max(MAX_CART_LINES, { error: `El carrito admite hasta ${MAX_CART_LINES} productos distintos` })
  .superRefine((lines, context) => {
    const seen = new Set<string>();
    lines.forEach((line, index) => {
      if (seen.has(line.variantId)) context.addIssue({ code: "custom", path: [index, "variantId"], message: "Producto repetido en el carrito" });
      seen.add(line.variantId);
    });
  });

const shippingMethodSchema = z.enum(SHIPPING_METHODS, { error: "Elige despacho o retiro" });

/** Optional welcome code, compared in uppercase; an empty value means no code. */
const discountCodeSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() || undefined : value),
  z.string().regex(welcomeCodePattern, { error: "El código de descuento no es válido" }).optional(),
);

/** Body of `POST /api/checkout/quote`: prices, stock, shipping and discount are computed by the server (RF-07). */
export const quoteSchema = z.object({
  lines: cartLinesSchema,
  shippingMethod: shippingMethodSchema,
  /** Needed to check the welcome code (RF-13). */
  email: registerSchema.shape.email.optional(),
  discountCode: discountCodeSchema,
});
export type QuoteInput = z.output<typeof quoteSchema>;

const addressSchema = z.object({
  region: z.enum(regionCodes, { error: "Elige una región" }),
  commune: z
    .string({ error: "Ingresa la comuna" })
    .trim()
    .min(1, { error: "Ingresa la comuna" })
    .max(COMMUNE_MAX_LENGTH, { error: `La comuna admite hasta ${COMMUNE_MAX_LENGTH} caracteres` }),
  street: z
    .string({ error: "Ingresa calle y número" })
    .trim()
    .min(1, { error: "Ingresa calle y número" })
    .max(STREET_MAX_LENGTH, { error: `La dirección admite hasta ${STREET_MAX_LENGTH} caracteres` }),
  extra: z
    .string({ error: "Detalle de dirección inválido" })
    .trim()
    .max(ADDRESS_EXTRA_MAX_LENGTH, { error: `El detalle admite hasta ${ADDRESS_EXTRA_MAX_LENGTH} caracteres` })
    .transform((value) => value || undefined)
    .optional(),
});
export type OrderAddress = z.output<typeof addressSchema>;

/**
 * Body of `POST /api/orders` (RF-08). `birthDate` is required when the buyer is a guest or the
 * account has none (the server decides); `address` is required for delivery.
 */
export const orderCreateSchema = quoteSchema
  .extend({
    email: registerSchema.shape.email,
    name: registerSchema.shape.name,
    phone: z
      .string({ error: "Ingresa tu teléfono" })
      .trim()
      .min(8, { error: "Ingresa un teléfono válido" })
      .max(PHONE_MAX_LENGTH, { error: "Ingresa un teléfono válido" })
      .regex(/^\+?[0-9 ]+$/, { error: "Usa solo números, espacios y un + inicial" }),
    birthDate: birthDateSchema.optional(),
    address: addressSchema.optional(),
  })
  .superRefine((order, context) => {
    if (order.shippingMethod === "DELIVERY" && !order.address) {
      context.addIssue({ code: "custom", path: ["address"], message: "Ingresa la dirección de despacho" });
    }
  });
export type OrderCreate = z.output<typeof orderCreateSchema>;

/** Why a cart line cannot be bought now: gone or deactivated, or more units than in stock. */
export type QuoteLineIssue = "UNAVAILABLE" | "INSUFFICIENT_STOCK";

export type QuoteLine = {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  /** Current price from the database, never the client's (RF-07). 0 when unavailable. */
  unitPriceClp: number;
  quantity: number;
  lineTotalClp: number;
  issue: QuoteLineIssue | null;
};

/** Answer of `POST /api/checkout/quote` (RF-07, RF-13). */
export type Quote = {
  lines: QuoteLine[];
  subtotalClp: number;
  discountClp: number;
  shippingClp: number;
  totalClp: number;
  /** The welcome code applied, if any. */
  discountCode: string | null;
  /** Shown next to the code field when the code was sent but does not apply. */
  discountError: string | null;
  /** False while a line has an issue: checkout does not go on until it is fixed. */
  canCheckout: boolean;
};

export const ORDER_UNDERAGE_MESSAGE = "Debes tener al menos 18 años para comprar";
export const ORDER_BIRTH_DATE_REQUIRED = "Ingresa tu fecha de nacimiento";
export const ORDER_STOCK_CONFLICT = "Algún producto ya no está disponible o no tiene stock suficiente. Revisa tu carrito.";

/** Answer of `POST /api/orders`: the token is the only way to see a guest order (DEC-007). */
export type OrderCreated = { number: number; accessToken: string };

/** Shape of a secret order token (DEC-007): 32 bytes in base64url. */
export const orderTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export type OrderViewItem = { productName: string; variantName: string; sku: string; unitPriceClp: number; quantity: number; lineTotalClp: number };

/** An order as its buyer sees it (`GET /api/orders/{token}`, RF-09; and the account pages, RF-16). */
export type OrderView = {
  number: number;
  status: OrderStatus;
  createdAt: string;
  email: string;
  name: string;
  shippingMethod: ShippingMethod;
  address: { region: ChileRegion; commune: string; street: string; extra: string | null } | null;
  items: OrderViewItem[];
  subtotalClp: number;
  discountClp: number;
  shippingClp: number;
  totalClp: number;
  discountCode: string | null;
  trackingNumber: string | null;
  /** From the shop settings while the order waits for its transfer (RF-10). */
  transferInstructions: string | null;
  /** From the shop settings for pickup orders. */
  pickupAddress: string | null;
};

/** Valid status changes (RF-15), used by the API and by the admin buttons. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => ALLOWED_TRANSITIONS[from].includes(to);

export const TRACKING_NUMBER_MAX_LENGTH = 60;

/** Body of `PATCH /api/admin/orders/{id}/status`: SHIPPED requires the tracking number. */
export const orderStatusChangeSchema = z
  .object({
    status: z.enum(ORDER_STATUSES, { error: "Estado inválido" }),
    trackingNumber: z
      .string({ error: "Número de seguimiento inválido" })
      .trim()
      .max(TRACKING_NUMBER_MAX_LENGTH, { error: `El número de seguimiento admite hasta ${TRACKING_NUMBER_MAX_LENGTH} caracteres` })
      .transform((value) => value || undefined)
      .optional(),
  })
  .superRefine((change, context) => {
    if (change.status === "SHIPPED" && !change.trackingNumber) {
      context.addIssue({ code: "custom", path: ["trackingNumber"], message: "Ingresa el número de seguimiento" });
    }
  });
export type OrderStatusChange = z.output<typeof orderStatusChangeSchema>;

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

/** Query of `GET /api/admin/orders`: page, status, and search by number or email (same names as the web URL). */
export const adminOrderListQuerySchema = paginationQuerySchema.extend({
  status: z.preprocess(emptyToUndefined, z.enum(ORDER_STATUSES, { error: "Estado inválido" }).optional()),
});
export type AdminOrderListQuery = z.output<typeof adminOrderListQuerySchema>;

/** A row of the admin list. */
export type AdminOrderSummary = {
  id: string;
  number: number;
  status: OrderStatus;
  createdAt: string;
  name: string;
  email: string;
  shippingMethod: ShippingMethod;
  totalClp: number;
};

/** The admin detail: the buyer's view plus what only the shop needs. */
export type AdminOrder = OrderView & { id: string; phone: string; hasAccount: boolean };

export const orderIdSchema = z.uuid();

/** A row of the customer's order list (`GET /api/account/orders`, RF-16). */
export type AccountOrderSummary = { id: string; number: number; status: OrderStatus; createdAt: string; totalClp: number; itemCount: number };
