import { requireSessionUser } from "@/lib/session";

/**
 * Every page under /account needs a session; visitors go to the login. Each page also sends an
 * ADMIN to its own area (`requireCustomerUser`), with the destination that fits that page.
 */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  await requireSessionUser("/account");
  return children;
}
