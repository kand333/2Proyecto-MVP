import { afterEach, describe, expect, it, vi } from "vitest";
import {
  changePassword,
  fetchCurrentUser,
  getSafeRedirectPath,
  logIn,
  logOut,
  registerAccount,
  updateProfile,
} from "./auth-client";

const { mutateMock, flashMock } = vi.hoisted(() => ({ mutateMock: vi.fn(), flashMock: vi.fn() }));
vi.mock("swr", () => ({ mutate: mutateMock }));
vi.mock("./flash", () => ({ flash: flashMock }));

const user = { id: "u1", name: "Ana", email: "ana@example.com", role: "USER", isActive: true };

afterEach(() => {
  vi.unstubAllGlobals();
  mutateMock.mockReset();
  flashMock.mockReset();
});

describe("fetchCurrentUser", () => {
  it("returns the session user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(user)));
    await expect(fetchCurrentUser()).resolves.toEqual(user);
  });

  it("returns null without a session (401)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "No has iniciado sesión", status: 401 }, { status: 401 })),
    );
    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it("throws other errors so they are not mistaken for a logged-out user", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Bad gateway", { status: 502 })));
    await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 502 });
  });
});

describe("login, registration and logout", () => {
  it("logs in and stores the user in the shared session cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(user));
    vi.stubGlobal("fetch", fetchMock);

    await expect(logIn({ email: "ana@example.com", password: "clave segura" })).resolves.toEqual(user);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/login");
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", user, { revalidate: false });
    expect(flashMock).toHaveBeenCalledWith("Sesión iniciada. ¡Hola, Ana!");
  });

  it("registers and stores the new user in the session cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(user, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await registerAccount({ name: "Ana", email: "ana@example.com", password: "clave segura", birthDate: "1990-05-17" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/register");
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", user, { revalidate: false });
    expect(flashMock).toHaveBeenCalledWith("Cuenta creada. Te damos la bienvenida, Ana.");
  });

  it("does not touch the session cache when the login is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ message: "Email o contraseña incorrectos", status: 401 }, { status: 401 })),
    );
    await expect(logIn({ email: "ana@example.com", password: "x" })).rejects.toMatchObject({
      message: "Email o contraseña incorrectos",
    });
    expect(mutateMock).not.toHaveBeenCalled();
    expect(flashMock).not.toHaveBeenCalled();
  });

  it("logs out and clears the session cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await logOut();
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", null, { revalidate: false });
    expect(flashMock).toHaveBeenCalledWith("Sesión cerrada.");
  });

  it("announces nothing when the logout fails (the caller reports it)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(logOut()).rejects.toMatchObject({ message: "No pudimos cerrar la sesión" });
    expect(flashMock).not.toHaveBeenCalled();
  });
});

describe("getSafeRedirectPath", () => {
  it.each([
    ["/account", "/account"],
    ["/items?page=2", "/items?page=2"],
    [null, "/"],
    ["", "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["javascript:alert(1)", "/"],
    // The browser drops tabs and newlines, and reads "\\" as "/": these would become "//evil.example".
    ["/\t/evil.example", "/"],
    ["/\n/evil.example", "/"],
    ["/\\/evil.example", "/"],
    ["/%2F/evil.example", "/%2F/evil.example"],
    ["/account#profile", "/account#profile"],
  ])("%o → %o", (next, expected) => {
    expect(getSafeRedirectPath(next)).toBe(expected);
  });
});

describe("account updates", () => {
  it("saves the profile with PATCH and refreshes the session cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ...user, name: "Ana Nueva" }));
    vi.stubGlobal("fetch", fetchMock);

    await updateProfile({ name: "Ana Nueva", email: "ana@example.com" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/account/profile");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "PATCH" });
    expect(mutateMock).toHaveBeenCalledWith("/api/auth/me", { ...user, name: "Ana Nueva" }, { revalidate: false });
  });

  it("changes the password with PUT and surfaces the API message on errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(changePassword({ currentPassword: "a", newPassword: "nueva clave 1" })).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/account/password");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "PUT" });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({ message: "La contraseña actual no es correcta", status: 400 }, { status: 400 }),
      ),
    );
    await expect(changePassword({ currentPassword: "mala", newPassword: "nueva clave 1" })).rejects.toMatchObject({
      message: "La contraseña actual no es correcta",
    });
  });
});
