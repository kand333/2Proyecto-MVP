import "server-only";
import { randomInt } from "node:crypto";
import { Prisma, type Subscriber as SubscriberRecord } from "@/generated/prisma/client";
import { toCsv } from "@/lib/csv";
import { findSubscriberByEmail, findSubscribers, insertSubscriber, subscriberSearchWhere } from "@/repositories/subscriber-repository";
import type { PaginatedResponse } from "@portal/shared/pagination";
import {
  WELCOME_CODE_ALPHABET,
  WELCOME_CODE_LENGTH,
  WELCOME_CODE_PREFIX,
  type AdminSubscriber,
  type SubscriberListQuery,
} from "@portal/shared/subscriber";

/** `BIENVENIDA-` plus 6 characters from a cryptographic source, so codes cannot be guessed in sequence. */
export function generateWelcomeCode(): string {
  let suffix = "";
  for (let index = 0; index < WELCOME_CODE_LENGTH; index += 1) suffix += WELCOME_CODE_ALPHABET[randomInt(WELCOME_CODE_ALPHABET.length)];
  return `${WELCOME_CODE_PREFIX}${suffix}`;
}

const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/**
 * Subscribes the email (already normalized) and returns its code; an email that is already subscribed
 * gets its same code back. A clash with a concurrent subscription of the same email, or with an
 * existing code, is retried.
 */
export async function subscribe(email: string): Promise<{ code: string; created: boolean }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await findSubscriberByEmail(email);
    if (existing) return { code: existing.code, created: false };
    try {
      return { code: (await insertSubscriber(email, generateWelcomeCode())).code, created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error("Could not create a unique welcome code");
}

const toAdminSubscriber = ({ email, code, consentAt, redeemedAt }: SubscriberRecord): AdminSubscriber => ({
  email,
  code,
  consentAt: consentAt.toISOString(),
  redeemedAt: redeemedAt?.toISOString() ?? null,
});

/** ADMIN list: newest first, with search over the email (RF-14). */
export async function listSubscribers({ search, page, pageSize }: SubscriberListQuery): Promise<PaginatedResponse<AdminSubscriber>> {
  const { records, total } = await findSubscribers(subscriberSearchWhere(search), { skip: (page - 1) * pageSize, take: pageSize });
  return { data: records.map(toAdminSubscriber), meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

/** At most this many rows in the CSV export (RF-20, DEC-011). */
export const MAX_EXPORT_ROWS = 10_000;

/** Every subscriber for the CSV export, newest first: `email,code,consentAt,redeemedAt` (RF-20). */
export async function exportSubscribersCsv(): Promise<string> {
  const { records } = await findSubscribers({}, { skip: 0, take: MAX_EXPORT_ROWS });
  return toCsv(
    ["email", "code", "consentAt", "redeemedAt"],
    records.map(({ email, code, consentAt, redeemedAt }) => [email, code, consentAt.toISOString(), redeemedAt?.toISOString() ?? null]),
  );
}
