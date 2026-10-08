import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AuthForm } from "./auth-form";

let currentSearch = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));
vi.mock("@/hooks/use-current-user", () => ({ useCurrentUser: vi.fn() }));

beforeEach(() => {
  currentSearch = "";
  vi.mocked(useCurrentUser).mockReturnValue({ data: null } as ReturnType<typeof useCurrentUser>);
});

describe("AuthForm", () => {
  it("asks for email and current password to log in", () => {
    const html = renderToStaticMarkup(<AuthForm mode="login" />);
    expect(html).not.toContain('id="auth-name"');
    expect(html).toMatch(/id="auth-email"[^>]*type="email"|type="email"[^>]*id="auth-email"/);
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain(">Ingresar</button>");
    expect(html).toContain('href="/register"');
  });

  it("asks for name, email and a new password to register", () => {
    const html = renderToStaticMarkup(<AuthForm mode="register" />);
    expect(html).toContain('id="auth-name"');
    expect(html).toContain('autoComplete="new-password"');
    expect(html).toContain("Contraseña (mínimo 8 caracteres)");
    expect(html).toContain(">Crear cuenta</button>");
    expect(html).toContain('href="/login"');
  });

  it("keeps the page to return to when switching between login and registration", () => {
    currentSearch = "next=%2Faccount";
    expect(renderToStaticMarkup(<AuthForm mode="login" />)).toContain('href="/register?next=%2Faccount"');
  });

  it("uses its own validation messages, not the browser bubbles", () => {
    expect(renderToStaticMarkup(<AuthForm mode="login" />)).toContain('<form noValidate=""');
  });

  it("tells a logged-in user and offers to continue or log out instead of the form", () => {
    vi.mocked(useCurrentUser).mockReturnValue({
      data: { id: "u1", name: "Ana Rojas", email: "ana@example.com", role: "USER", isActive: true },
    } as ReturnType<typeof useCurrentUser>);
    currentSearch = "next=%2Fitems";

    const html = renderToStaticMarkup(<AuthForm mode="login" />);
    expect(html).toContain("Ya iniciaste sesión como <span");
    expect(html).toContain("Ana Rojas");
    expect(html).toContain('href="/items"');
    expect(html).toContain("Cerrar sesión");
    expect(html).not.toContain("<form");
  });
});
