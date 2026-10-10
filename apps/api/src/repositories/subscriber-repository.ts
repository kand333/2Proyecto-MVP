import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { escapeLikePattern } from "@/lib/escape-like";
import { prisma } from "@/lib/prisma";

export function findSubscriberByEmail(email: string) {
  return prisma.subscriber.findUnique({ where: { email } });
}

/** Throws P2002 when the email or the code already exists. */
export function insertSubscriber(email: string, code: string) {
  return prisma.subscriber.create({ data: { email, code, marketingConsent: true } });
}

/** The email contains the search (ignoring case). */
export function subscriberSearchWhere(search: string | undefined): Prisma.SubscriberWhereInput {
  return search ? { email: { contains: escapeLikePattern(search), mode: "insensitive" } } : {};
}

/** Subscribers matching `where`, newest first, and their total. */
export async function findSubscribers(where: Prisma.SubscriberWhereInput, pagination: { skip: number; take: number }) {
  const [records, total] = await prisma.$transaction([
    prisma.subscriber.findMany({ where, orderBy: [{ consentAt: "desc" }, { id: "desc" }], ...pagination }),
    prisma.subscriber.count({ where }),
  ]);
  return { records, total };
}
