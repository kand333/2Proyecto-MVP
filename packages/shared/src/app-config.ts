/**
 * Identity of this app in places shared with other local projects. Cookies on `localhost` are shared
 * across ports, so each project derived from the starter sets its own slug here.
 */
export const APP_SLUG = "terpenex";

/** httpOnly session cookie set by the API and forwarded by the web server. */
export const SESSION_COOKIE_NAME = `${APP_SLUG}_session`;

/** sessionStorage key of the pending flash messages. */
export const FLASH_STORAGE_KEY = `${APP_SLUG}:flash`;

/** localStorage key that remembers the visitor declared being an adult (age notice, RF-04). */
export const AGE_GATE_STORAGE_KEY = `${APP_SLUG}:age-confirmed`;

/** localStorage key of the browser cart: variant ids and quantities only (DEC-002, RF-06). */
export const CART_STORAGE_KEY = `${APP_SLUG}:cart`;

/** localStorage key that remembers the subscription popup was already shown (RF-12: once per browser). */
export const SUBSCRIBE_POPUP_STORAGE_KEY = `${APP_SLUG}:subscribe-popup`;
