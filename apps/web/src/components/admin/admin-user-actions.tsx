"use client";

import { adminUserUpdateSchema, type AdminUserSummary } from "@portal/shared/admin-user";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, USER_EMAIL_MAX_LENGTH, USER_NAME_MAX_LENGTH } from "@portal/shared/auth";
import { USER_ROLES, type UserRole } from "@portal/shared/enums";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { userRoleLabels } from "@/components/account/account-overview";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { useConfirmDialog, type ConfirmOptions } from "@/components/ui/confirm-dialog";
import { deleteUser, diffUserChanges, updateUser, type UserEditValues } from "@/lib/admin-users";
import { ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { flash } from "@/lib/flash";

const buttonClassName =
  "inline-flex h-9 w-full items-center justify-center rounded-full border border-line px-2 text-sm max-sm:h-8 max-sm:text-xs font-semibold text-ink transition-colors duration-200 hover:border-accent hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50";
const dangerHoverClassName = "hover:border-red-700 hover:text-red-700 dark:hover:border-red-400 dark:hover:text-red-400";

const errorMessageOf = (error: unknown) =>
  error instanceof ApiClientError ? error.message : "No pudimos guardar el cambio. Inténtalo de nuevo.";

/** The warning shown before saving an edit: what changes, with the sensitive parts called out. */
function describeChanges(user: AdminUserSummary, values: UserEditValues, changes: ReturnType<typeof diffUserChanges>): ReactNode {
  const items: ReactNode[] = [];
  if (changes.name !== undefined) items.push(`Nombre: «${values.name.trim()}».`);
  if (changes.email !== undefined) items.push(`Email (también es su usuario para ingresar): ${values.email.trim().toLowerCase()}.`);
  if (changes.password !== undefined) items.push("Nueva contraseña: la actual dejará de funcionar.");
  if (changes.role === "ADMIN") items.push(<strong className="text-ink">Rol Administrador: tendrá acceso completo a la administración.</strong>);
  if (changes.role === "USER") items.push("Rol Usuario: perderá el acceso a la administración.");
  if (changes.isActive === false) items.push("Desactivada: no podrá ingresar y su sesión se cerrará.");
  if (changes.isActive === true) items.push("Activada: podrá volver a ingresar.");
  return (
    <>
      <p>Vas a cambiar la cuenta de {user.name}:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </>
  );
}

type EditUserDialogProps = {
  user: AdminUserSummary;
  onClose: () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

/** Modal form to edit a user's data, role and status; saving asks for confirmation first. */
function EditUserDialog({ user, onClose, confirm }: EditUserDialogProps) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [values, setValues] = useState<UserEditValues>({ name: user.name, email: user.email, password: "", role: user.role, isActive: user.isActive });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "password", string>>>({});
  const [message, setMessage] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function setValue<Field extends keyof UserEditValues>(name: Field, value: UserEditValues[Field]) {
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const changes = diffUserChanges(user, values);
    if (Object.keys(changes).length === 0) {
      setMessage({ tone: "info", text: "No hay cambios que guardar." });
      return;
    }
    const parsed = adminUserUpdateSchema.safeParse(changes);
    if (!parsed.success) {
      const fieldErrors: typeof errors = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as keyof typeof errors] ??= issue.message;
      setErrors(fieldErrors);
      return;
    }
    const isSensitive = changes.role === "ADMIN" || changes.isActive === false || changes.password !== undefined;
    const accepted = await confirm({
      title: "¿Guardar los cambios?",
      message: describeChanges(user, values, changes),
      confirmLabel: "Guardar cambios",
      tone: isSensitive ? "danger" : "default",
    });
    if (!accepted) return;

    setIsSaving(true);
    try {
      await updateUser(user.id, parsed.data);
      flash(`Cambios guardados en la cuenta de ${parsed.data.name ?? user.name}.`);
      router.refresh();
      onClose();
    } catch (error) {
      setMessage({ tone: "error", text: errorMessageOf(error) });
      setIsSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[1.25rem] border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 p-6">
        <h2 id={titleId} className="font-display text-2xl font-semibold tracking-tight">
          Editar usuario
        </h2>
        <AuthFormField
          id={`edit-name-${user.id}`}
          label="Nombre"
          type="text"
          maxLength={USER_NAME_MAX_LENGTH}
          value={values.name}
          onChange={(event) => setValue("name", event.target.value)}
          error={errors.name}
        />
        <AuthFormField
          id={`edit-email-${user.id}`}
          label="Email"
          type="email"
          spellCheck={false}
          maxLength={USER_EMAIL_MAX_LENGTH}
          value={values.email}
          onChange={(event) => setValue("email", event.target.value)}
          error={errors.email}
        />
        <AuthFormField
          id={`edit-password-${user.id}`}
          label={`Nueva contraseña (opcional, mínimo ${PASSWORD_MIN_LENGTH} caracteres)`}
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          value={values.password}
          onChange={(event) => setValue("password", event.target.value)}
          error={errors.password}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`edit-role-${user.id}`} className="mb-1.5 block text-sm font-medium text-ink">
              Rol
            </label>
            <select
              id={`edit-role-${user.id}`}
              value={values.role}
              onChange={(event) => setValue("role", event.target.value as UserRole)}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-ink focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {userRoleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 self-end pb-2.5 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(event) => setValue("isActive", event.target.checked)}
              className="size-4 accent-accent"
            />
            Cuenta activa
          </label>
        </div>
        {message && (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={message.tone === "error" ? "text-sm text-red-700 dark:text-red-400" : "text-sm text-muted"}
          >
            {message.text}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-full border border-line px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent hover:bg-paper">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="h-11 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover disabled:opacity-70"
          >
            {isSaving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

type AdminUserActionsProps = {
  user: AdminUserSummary;
  /** The administrator's own row: no changes here (the API refuses them too). */
  isCurrentAdmin: boolean;
};

/** Edit, activate/deactivate and delete a user; every change asks for confirmation in a modal. */
export function AdminUserActions({ user, isCurrentAdmin }: AdminUserActionsProps) {
  const router = useRouter();
  const { confirm, dialog } = useConfirmDialog();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isCurrentAdmin) return <p className="text-sm text-muted max-sm:text-xs xl:text-right">Se edita en «Mi cuenta»</p>;

  async function run(action: () => Promise<unknown>, doneMessage: string) {
    setIsSaving(true);
    setError(null);
    try {
      await action();
      flash(doneMessage);
      router.refresh();
    } catch (caught) {
      setError(errorMessageOf(caught));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive() {
    const accepted = await confirm(
      user.isActive
        ? {
            title: `¿Desactivar a ${user.name}?`,
            message: "No podrá ingresar y su sesión se cerrará. Puedes volver a activarla cuando quieras.",
            confirmLabel: "Desactivar",
            tone: "danger",
          }
        : { title: `¿Activar a ${user.name}?`, message: "Podrá volver a ingresar con su contraseña.", confirmLabel: "Activar" },
    );
    if (accepted) {
      await run(
        () => updateUser(user.id, { isActive: !user.isActive }),
        `Cuenta de ${user.name} ${user.isActive ? "desactivada" : "activada"}.`,
      );
    }
  }

  async function handleDelete() {
    const accepted = await confirm({
      title: `¿Eliminar a ${user.name}?`,
      message: (
        <>
          Se borra la cuenta <strong className="text-ink">para siempre</strong>. Esta acción no se puede deshacer.
        </>
      ),
      confirmLabel: "Eliminar definitivamente",
      tone: "danger",
    });
    if (accepted) await run(() => deleteUser(user.id), `Cuenta de ${user.name} eliminada.`);
  }

  return (
    // Three equal columns: the buttons line up row after row, whatever their label ("Activar" / "Desactivar").
    <div className="grid w-full max-w-[17.5rem] grid-cols-3 items-center gap-2 xl:ml-auto">
      <button type="button" disabled={isSaving} onClick={() => setIsEditing(true)} aria-label={`Editar a ${user.name}`} className={buttonClassName}>
        Editar
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={handleToggleActive}
        aria-label={`${user.isActive ? "Desactivar" : "Activar"} a ${user.name}`}
        className={cn(buttonClassName, user.isActive && dangerHoverClassName)}
      >
        {user.isActive ? "Desactivar" : "Activar"}
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={handleDelete}
        aria-label={`Eliminar a ${user.name}`}
        className={cn(buttonClassName, dangerHoverClassName)}
      >
        Eliminar
      </button>
      {error && (
        <p role="alert" className="col-span-3 text-sm text-red-700 dark:text-red-400 xl:text-right">
          {error}
        </p>
      )}
      {isEditing && <EditUserDialog user={user} onClose={() => setIsEditing(false)} confirm={confirm} />}
      {dialog}
    </div>
  );
}
