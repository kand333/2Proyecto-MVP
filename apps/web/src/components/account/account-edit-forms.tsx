"use client";

import {
  changePasswordSchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  updateProfileSchema,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  type AuthUser,
} from "@portal/shared/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { ApiClientError } from "@/lib/api-client";
import { changePassword, updateProfile } from "@/lib/auth-client";

type Status = "idle" | "saving" | "saved" | "error";
type FieldErrors = Record<string, string | undefined>;
type Issue = { path: PropertyKey[]; message: string };

/** First error message of each field, in the order of `fieldIds`; focuses the first invalid field. */
function showFieldErrors(issues: Issue[], fieldIds: Record<string, string>, setErrors: (errors: FieldErrors) => void) {
  const errors: FieldErrors = {};
  for (const issue of issues) errors[String(issue.path[0])] ??= issue.message;
  setErrors(errors);
  const firstInvalid = Object.keys(fieldIds).find((name) => errors[name]);
  if (firstInvalid) document.getElementById(fieldIds[firstInvalid])?.focus();
}

const errorMessageOf = (error: unknown) =>
  error instanceof ApiClientError ? error.message : "No pudimos conectar con el servidor. Inténtalo de nuevo.";

function FormCard({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft sm:p-8">
      <h2 id={id} className="font-display text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-1 text-muted">{description}</p>
      {children}
    </section>
  );
}

function FormFeedback({ status, savedMessage, errorMessage }: { status: Status; savedMessage: string; errorMessage: string }) {
  if (status === "saved") return <p role="status" className="text-sm font-medium text-ink">{savedMessage}</p>;
  if (status === "error") return <p role="alert" className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>;
  return null;
}

function SubmitButton({ isSaving, label }: { isSaving: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={isSaving}
      className="h-11 rounded-sm bg-accent px-6 font-semibold text-on-accent transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-accent-hover active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
    >
      {isSaving ? "Guardando…" : label}
    </button>
  );
}

const profileFieldIds = { name: "profile-name", email: "profile-email", currentPassword: "profile-current-password" };

/** Name and email. Changing the email (the login) asks for the current password. */
export function ProfileForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: user.name, email: user.email, currentPassword: "" });
  const [savedEmail, setSavedEmail] = useState(user.email);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const emailChanges = values.email.trim().toLowerCase() !== savedEmail;

  function setValue(name: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
    if (status !== "saving") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;

    const parsed = updateProfileSchema.safeParse({
      name: values.name,
      email: values.email,
      currentPassword: emailChanges ? values.currentPassword : undefined,
    });
    if (!parsed.success) return showFieldErrors(parsed.error.issues, profileFieldIds, setFieldErrors);
    if (emailChanges && !values.currentPassword) {
      return showFieldErrors(
        [{ path: ["currentPassword"], message: "Ingresa tu contraseña actual para cambiar el email" }],
        profileFieldIds,
        setFieldErrors,
      );
    }

    setStatus("saving");
    try {
      const updated = await updateProfile(parsed.data);
      setSavedEmail(updated.email);
      setValues({ name: updated.name, email: updated.email, currentPassword: "" });
      setStatus("saved");
      // Server-rendered pages (e.g. /account) read the new data.
      router.refresh();
    } catch (error) {
      setErrorMessage(errorMessageOf(error));
      setValues((previous) => ({ ...previous, currentPassword: "" }));
      setStatus("error");
    }
  }

  return (
    <FormCard id="profile-title" title="Datos personales" description="Tu nombre y el email con el que ingresas.">
      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
        <AuthFormField
          id={profileFieldIds.name}
          name="name"
          label="Nombre"
          type="text"
          autoComplete="name"
          maxLength={USER_NAME_MAX_LENGTH}
          value={values.name}
          onChange={(event) => setValue("name", event.target.value)}
          error={fieldErrors.name}
        />
        <AuthFormField
          id={profileFieldIds.email}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          maxLength={USER_EMAIL_MAX_LENGTH}
          value={values.email}
          onChange={(event) => setValue("email", event.target.value)}
          error={fieldErrors.email}
        />
        {emailChanges && (
          <AuthFormField
            id={profileFieldIds.currentPassword}
            name="currentPassword"
            label="Contraseña actual (para confirmar el cambio de email)"
            type="password"
            autoComplete="current-password"
            maxLength={PASSWORD_MAX_LENGTH}
            value={values.currentPassword}
            onChange={(event) => setValue("currentPassword", event.target.value)}
            error={fieldErrors.currentPassword}
          />
        )}
        <FormFeedback status={status} savedMessage="Datos guardados." errorMessage={errorMessage} />
        <SubmitButton isSaving={status === "saving"} label="Guardar datos" />
      </form>
    </FormCard>
  );
}

const passwordFieldIds = {
  currentPassword: "password-current",
  newPassword: "password-new",
  confirmPassword: "password-confirm",
};
const emptyPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };

/** Password change: always confirmed with the current password. */
export function PasswordForm() {
  const [values, setValues] = useState(emptyPasswords);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function setValue(name: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
    if (status !== "saving") setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;

    const parsed = changePasswordSchema.safeParse({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    const issues: Issue[] = parsed.success ? [] : [...parsed.error.issues];
    if (values.confirmPassword !== values.newPassword) {
      issues.push({ path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
    }
    if (!parsed.success || issues.length > 0) return showFieldErrors(issues, passwordFieldIds, setFieldErrors);

    setStatus("saving");
    try {
      await changePassword(parsed.data);
      setValues(emptyPasswords);
      setStatus("saved");
    } catch (error) {
      setErrorMessage(errorMessageOf(error));
      setValues((previous) => ({ ...previous, currentPassword: "" }));
      setStatus("error");
    }
  }

  return (
    <FormCard
      id="password-title"
      title="Cambiar contraseña"
      description="Por seguridad, confirma tu contraseña actual."
    >
      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
        <AuthFormField
          id={passwordFieldIds.currentPassword}
          name="currentPassword"
          label="Contraseña actual"
          type="password"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.currentPassword}
          onChange={(event) => setValue("currentPassword", event.target.value)}
          error={fieldErrors.currentPassword}
        />
        <AuthFormField
          id={passwordFieldIds.newPassword}
          name="newPassword"
          label={`Nueva contraseña (mínimo ${PASSWORD_MIN_LENGTH} caracteres)`}
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.newPassword}
          onChange={(event) => setValue("newPassword", event.target.value)}
          error={fieldErrors.newPassword}
        />
        <AuthFormField
          id={passwordFieldIds.confirmPassword}
          name="confirmPassword"
          label="Repite la nueva contraseña"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.confirmPassword}
          onChange={(event) => setValue("confirmPassword", event.target.value)}
          error={fieldErrors.confirmPassword}
        />
        <FormFeedback status={status} savedMessage="Contraseña actualizada." errorMessage={errorMessage} />
        <SubmitButton isSaving={status === "saving"} label="Cambiar contraseña" />
      </form>
    </FormCard>
  );
}
