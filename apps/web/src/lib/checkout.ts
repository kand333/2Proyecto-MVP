import type { CartLine, OrderCreate, OrderCreated, Quote, ShippingMethod } from "@portal/shared/order";
import type { PublicShopSettings } from "@portal/shared/settings";
import { fetchJson, postJson } from "./api-client";

type QuoteRequest = { lines: readonly CartLine[]; shippingMethod: ShippingMethod; email?: string; discountCode?: string };

/** Prices, stock, shipping and discount of the cart, computed by the server (RF-07). */
export const fetchQuote = (request: QuoteRequest) => postJson<Quote>("/api/checkout/quote", request);

/** Places the order (RF-08); the answer carries the secret token of its page. */
export const placeOrder = (order: OrderCreate) => postJson<OrderCreated>("/api/orders", order);

export const SETTINGS_KEY = "/api/settings";

/** Delivery fee, free delivery threshold and pickup address (RF-10). */
export const fetchPublicSettings = () => fetchJson<PublicShopSettings>(SETTINGS_KEY);

/** Page of an order by its token (RF-09). */
export const orderPath = (token: string) => `/orders/${token}`;
