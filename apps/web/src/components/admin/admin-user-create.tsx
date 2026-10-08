"use client";

import { adminUserCreateSchema } from "@portal/shared/admin-user";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from "@portal/shared/auth";
import { USER_ROLES, type UserRole } from "@portal/shared/enums";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { userRoleLabels } from "@/components/account/account-overview";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { createUser } from "@/lib/admin-users";
import { ApiClientError } from "@/lib/api-client";
import { flash } from "@/lib/flash";

type Field = "name" | "email" | "password";
const emptyValues = {
  name: "",
  email: "",
  password: "",
  role: "USER" as UserRole,
};

/** Collapsible «Nuevo usuario» panel: creates an active account with a password set by ADMIN. */
export function AdminUserCreate() {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<{
    tone: "idle" | "saving" | "error";
    message: string;
  }>({ tone: "idle", message: "" });

  function setValue(name: keyof typeof emptyValues, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = adminUserCreateSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues)
        fieldErrors[issue.path[0] as Field] ??= issue.message;
      setErrors(fieldErrors);
      return;
    }
    if (
      parsed.data.role === "ADMIN" &&
      !(await confirm({
        title: "¿Crear un administrador?",
        message: (
          <>
            <strong className="text-ink">{parsed.data.name}</strong> tendrá
            acceso completo a la administración, incluidos los usuarios.
          </>
        ),
        confirmLabel: "Crear administrador",
        tone: "danger",
      }))
    ) {
      return;
    }

    setStatus({ tone: "saving", message: "Creando usuario…" });
    try {
      await createUser(parsed.data);
      setValues(emptyValues);
      setStatus({ tone: "idle", message: "" });
      flash(`Cuenta de ${parsed.data.name} creada${parsed.data.role === "ADMIN" ? " como administrador" : ""}.`);
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message:
          error instanceof ApiClientError
            ? error.message
            : "No pudimos crear el usuario. Inténtalo de nuevo.",
      });
    }
  }

  return (
    <>
      <details className="group rounded-[1.25rem] border border-line bg-surface shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-flex size-6 items-center justify-center rounded-full bg-accent text-sm text-on-accent"
            >
              +
            </span>
            Nuevo usuario
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5 text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </summary>

        <form
          noValidate
          onSubmit={handleSubmit}
          aria-label="Crear usuario"
          className="grid gap-4 border-t border-line p-5 sm:grid-cols-2"
        >
          <AuthFormField
            id="new-user-name"
            label="Nombre"
            type="text"
            autoComplete="off"
            maxLength={USER_NAME_MAX_LENGTH}
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            error={errors.name}
          />
          <AuthFormField
            id="new-user-email"
            label="Email"
            type="email"
            autoComplete="off"
            spellCheck={false}
            maxLength={USER_EMAIL_MAX_LENGTH}
            value={values.email}
            onChange={(event) => setValue("email", event.target.value)}
            error={errors.email}
          />
          <AuthFormField
            id="new-user-password"
            label={`Contraseña (mínimo ${PASSWORD_MIN_LENGTH} caracteres)`}
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX_LENGTH}
            value={values.password}
            onChange={(event) => setValue("password", event.target.value)}
            error={errors.password}
          />
          <div>
            <label
              htmlFor="new-user-role"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Rol
            </label>
            <select
              id="new-user-role"
              value={values.role}
              onChange={(event) => setValue("role", event.target.value)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-ink transition-colors duration-200 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {userRoleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
            <button
              type="submit"
              disabled={status.tone === "saving"}
              className="h-11 rounded-full bg-accent px-6 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover disabled:opacity-70"
            >
              {status.tone === "saving" ? "Creando…" : "Crear usuario"}
            </button>
            <p
              role={status.tone === "error" ? "alert" : "status"}
              className={
                status.tone === "error"
                  ? "text-sm text-red-700 dark:text-red-400"
                  : "text-sm font-medium text-ink"
              }
            >
              {status.message}
            </p>
          </div>
        </form>
      </details>
      {/* Outside <details>: its content is not rendered while it is closed. */}
      {dialog}
    </>
  );
}
