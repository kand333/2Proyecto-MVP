import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PasswordForm, ProfileForm } from "./account-edit-forms";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const user = { id: "u1", name: "Ana García", email: "ana@test.com", role: "USER" as const, isActive: true };

describe("ProfileForm", () => {
  it("starts with the current name and email, without asking for the password", () => {
    const html = renderToStaticMarkup(<ProfileForm user={user} />);
    expect(html).toContain("Datos personales");
    expect(html).toMatch(/id="profile-name"[^>]*value="Ana García"|value="Ana García"[^>]*id="profile-name"/);
    expect(html).toMatch(/id="profile-email"[^>]*value="ana@test.com"|value="ana@test.com"[^>]*id="profile-email"/);
    // The current password appears only once the email is changed.
    expect(html).not.toContain('id="profile-current-password"');
    expect(html).toContain(">Guardar datos</button>");
  });
});

describe("PasswordForm", () => {
  it("asks for the current password, the new one and its repetition", () => {
    const html = renderToStaticMarkup(<PasswordForm />);
    expect(html).toContain("Cambiar contraseña");
    expect(html).toContain("Por seguridad, confirma tu contraseña actual.");
    expect(html).toMatch(/id="password-current"[^>]*autoComplete="current-password"|autoComplete="current-password"[^>]*id="password-current"/);
    expect(html).toContain('id="password-new"');
    expect(html).toContain('id="password-confirm"');
    expect(html).toContain("Nueva contraseña (mínimo 8 caracteres)");
    expect(html.match(/autoComplete="new-password"/g)).toHaveLength(2);
  });

  it("uses its own validation messages, not the browser bubbles", () => {
    expect(renderToStaticMarkup(<PasswordForm />)).toContain('<form noValidate=""');
  });
});
