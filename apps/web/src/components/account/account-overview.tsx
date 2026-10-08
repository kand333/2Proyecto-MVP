import type { AuthUser } from "@portal/shared/auth";
import type { UserRole } from "@portal/shared/enums";
import Link from "next/link";

export const userRoleLabels: Record<UserRole, string> = {
  USER: "Usuario",
  ADMIN: "Administrador",
};

/** Private area: basic information and the link to edit it. Add the sections of each project below. */
export function AccountOverview({ user }: { user: AuthUser }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">Mi cuenta</h1>
      <p className="mt-3 text-lg text-muted">Hola, {user.name}.</p>

      <div className="mt-12">
        <section aria-labelledby="account-information-title">
          <div className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
            <h2 id="account-information-title" className="font-display text-2xl font-semibold tracking-tight text-ink">
              Información
            </h2>
            <dl className="mt-4 divide-y divide-line/70">
              <div className="py-3">
                <dt className="text-sm text-muted">Nombre</dt>
                <dd className="mt-0.5 font-medium text-ink break-words">{user.name}</dd>
              </div>
              <div className="py-3">
                <dt className="text-sm text-muted">Email</dt>
                <dd className="mt-0.5 font-medium text-ink break-all">{user.email}</dd>
              </div>
              <div className="py-3">
                <dt className="text-sm text-muted">Tipo de cuenta</dt>
                <dd className="mt-0.5 font-medium text-ink">{userRoleLabels[user.role]}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col items-start gap-3">
              <Link
                href="/account/edit"
                className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover"
              >
                Editar cuenta
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
