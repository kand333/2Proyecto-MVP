import { z } from "zod";
import { registerSchema } from "./auth";
import { paginationQuerySchema } from "./pagination";

// Contract of the subscription and welcome code endpoints (RF-12, RF-13, RF-14).

export const WELCOME_CODE_PREFIX = "BIENVENIDA-";
/** Without look-alike characters (0/O, 1/I/L), so the code can be read and typed back. */
export const WELCOME_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const WELCOME_CODE_LENGTH = 6;
/** Off the subtotal of the first order, rounded down to the peso (DEC-003). */
export const WELCOME_DISCOUNT_PERCENT = 10;

export const welcomeCodePattern = new RegExp(`^${WELCOME_CODE_PREFIX}[${WELCOME_CODE_ALPHABET}]{${WELCOME_CODE_LENGTH}}$`);

/** Body of `POST /api/subscribers`: marketing consent is mandatory. */
export const subscribeSchema = z.object({
  email: registerSchema.shape.email,
  marketingConsent: z.literal(true, { error: "Acepta recibir novedades para obtener tu código" }),
});
export type SubscribeInput = z.input<typeof subscribeSchema>;

/** Answer of `POST /api/subscribers`: the same code every time for the same email. */
export type SubscribeResponse = { code: string };

/** Query of `GET /api/admin/subscribers`: page and search over the email. */
export const subscriberListQuerySchema = paginationQuerySchema;
export type SubscriberListQuery = z.output<typeof subscriberListQuerySchema>;

/** A subscriber as the admin sees it (RF-14). */
export type AdminSubscriber = {
  email: string;
  code: string;
  consentAt: string;
  redeemedAt: string | null;
};
