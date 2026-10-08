import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireCustomerUser } from "@/lib/session";
import AccountEditPage from "./edit/page";
import AccountPage from "./page";

vi.mock("@/lib/session", () => ({ requireCustomerUser: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/account", useRouter: () => ({ refresh: vi.fn() }) }));

const user = { id: "u1", name: "Ana García", email: "ana@test.com", role: "USER" as const, isActive: true };

beforeEach(() => {
  vi.mocked(requireCustomerUser).mockReset().mockResolvedValue(user);
});

describe("account pages", () => {
  it("are for USER accounts: each page sends an ADMIN to the matching admin page", async () => {
    await AccountPage();
    expect(requireCustomerUser).toHaveBeenLastCalledWith("/account");
    await AccountEditPage();
    expect(requireCustomerUser).toHaveBeenLastCalledWith("/account/edit", "/admin/account");
  });
});
