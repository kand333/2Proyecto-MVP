"use client";

import {
  isAdult,
  loginSchema,
  MIN_CUSTOMER_AGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  registerSchema,
  UNDERAGE_MESSAGE,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from "@portal/shared/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ApiClientError } from "@/lib/api-client";
import { getSafeRedirectPath, logIn, logOut, registerAccount } from "@/lib/auth-client";
import { AuthFormField } from "./auth-form-field";

type Mode = "login" | "register";
type FieldName = "name" | "email" | "password" | "birthDate";
type FieldErrors = Partial<Record<FieldName, string>>;

const copy = {
  login: { submit: "Ingresar", sending: "Ingresando…", fields: ["email", "password"] as FieldName[] },
  register: { submit: "Crear cuenta", sending: "Creando cuenta…", fields: ["name", "email", "password", "birthDate"] as FieldName[] },
};

/** Login and registration form. After success it goes to `?next=` (only paths of this site) or home. */
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: currentUser } = useCurrentUser();
  const [values, setValues] = useState<Record<FieldName, string>>({
    name: "",
    email: "",
    password: "",
    birthDate: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const next = searchParams.get("next");
  const redirectPath = getSafeRedirectPath(next);
  const fields = copy[mode].fields;
  const otherModeHref = `${mode === "login" ? "/register" : "/login"}${next ? `?${new URLSearchParams({ next })}` : ""}`;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.name as FieldName;
    setValues((previous) => ({ ...previous, [name]: event.target.value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  function showFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
    const errors: FieldErrors = {};
    for (const issue of issues) errors[issue.path[0] as FieldName] ??= issue.message;
    setFieldErrors(errors);
    const firstInvalid = fields.find((name) => errors[name]);
    if (firstInvalid) document.getElementById(`auth-${firstInvalid}`)?.focus();
  }

  const showUnderage = () => showFieldErrors([{ path: ["birthDate"], message: UNDERAGE_MESSAGE }]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    setFormError("");

    let send: () => Promise<unknown>;
    if (mode === "login") {
      const parsed = loginSchema.safeParse({ email: values.email, password: values.password });
      if (!parsed.success) return showFieldErrors(parsed.error.issues);
      send = () => logIn(parsed.data);
    } else {
      const parsed = registerSchema.safeParse(values);
      if (!parsed.success) return showFieldErrors(parsed.error.issues);
      // The API has the last word (422), checked here too so the error shows without a round trip.
      if (!isAdult(parsed.data.birthDate)) return showUnderage();
      send = () => registerAccount(parsed.data);
    }

    setIsSending(true);
    try {
      await send();
      router.replace(redirectPath);
    } catch (error) {
      if (mode === "register" && error instanceof ApiClientError && error.status === 422) {
        showFieldErrors([{ path: ["birthDate"], message: error.message }]);
      } else {
        setFormError(
          error instanceof ApiClientError ? error.message : "No pudimos conectar con el servidor. Inténtalo de nuevo.",
        );
      }
      // Never keep a rejected password in the form.
      setValues((previous) => ({ ...previous, password: "" }));
      setIsSending(false);
    }
  }

  if (currentUser && !isSending) {
    return (
      <div role="status" className="space-y-4">
        <p className="text-ink">
          Ya iniciaste sesión como <span className="font-semibold">{currentUser.name}</span>.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={redirectPath}
            className="inline-flex h-11 items-center rounded-full bg-accent px-6 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
          >
            Continuar
          </Link>
          <button
            type="button"
            onClick={() => logOut().catch(() => setFormError("No pudimos cerrar la sesión"))}
            className="border-b border-accent pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {mode === "register" && (
        <AuthFormField
          id="auth-name"
          name="name"
          label="Nombre"
          type="text"
          autoComplete="name"
          maxLength={USER_NAME_MAX_LENGTH}
          value={values.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />
      )}
      <AuthFormField
        id="auth-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        spellCheck={false}
        maxLength={USER_EMAIL_MAX_LENGTH}
        value={values.email}
        onChange={handleChange}
        error={fieldErrors.email}
      />
      <AuthFormField
        id="auth-password"
        name="password"
        label={mode === "register" ? `Contraseña (mínimo ${PASSWORD_MIN_LENGTH} caracteres)` : "Contraseña"}
        type="password"
        autoComplete={mode === "register" ? "new-password" : "current-password"}
        maxLength={PASSWORD_MAX_LENGTH}
        value={values.password}
        onChange={handleChange}
        error={fieldErrors.password}
      />
      {mode === "register" && (
        <AuthFormField
          id="auth-birthDate"
          name="birthDate"
          label={`Fecha de nacimiento (mayores de ${MIN_CUSTOMER_AGE} años)`}
          type="date"
          autoComplete="bday"
          min="1900-01-01"
          value={values.birthDate}
          onChange={handleChange}
          error={fieldErrors.birthDate}
        />
      )}

      {formError && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSending}
        className="h-11 w-full rounded-full bg-accent px-6 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
      >
        {isSending ? copy[mode].sending : copy[mode].submit}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
        <Link
          href={otherModeHref}
          className="font-semibold text-ink underline decoration-accent decoration-1 underline-offset-4 hover:decoration-ink"
        >
          {mode === "login" ? "Crear cuenta" : "Ingresar"}
        </Link>
      </p>
    </form>
  );
}
