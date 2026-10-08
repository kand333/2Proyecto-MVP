/**
 * Identity of this app in places shared with other local projects. Cookies on `localhost` are shared
 * across ports, so each project derived from the starter sets its own slug here.
 */
export const APP_SLUG = "starter";

/** httpOnly session cookie set by the API and forwarded by the web server. */
export const SESSION_COOKIE_NAME = `${APP_SLUG}_session`;

/** sessionStorage key of the pending flash messages. */
export const FLASH_STORAGE_KEY = `${APP_SLUG}:flash`;
