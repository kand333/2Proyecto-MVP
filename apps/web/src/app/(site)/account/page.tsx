import type { Metadata } from "next";
import { AccountOverview } from "@/components/account/account-overview";
import { requireCustomerUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false },
};

export default async function AccountPage() {
  // Checked in the page too, not only in the layout (see lib/session.ts).
  const user = await requireCustomerUser("/account");
  return <AccountOverview user={user} />;
}
