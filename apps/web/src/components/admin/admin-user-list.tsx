import type { AdminUserSummary } from "@portal/shared/admin-user";
import { USER_ROLES } from "@portal/shared/enums";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import type { PaginatedResponse } from "@portal/shared/pagination";
import Link from "next/link";
import { userRoleLabels } from "@/components/account/account-overview";
import { Pagination } from "@/components/ui/pagination";
import { ADMIN_USERS_PATH, toAdminUserListQuery, type AdminUserListParams } from "@/lib/admin-users";
import { cn } from "@/lib/cn";
import { siteConfig } from "@/lib/site-config";
import { AdminUserActions } from "./admin-user-actions";
import { AdminUserCreate } from "./admin-user-create";

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, { dateStyle: "medium" });
const numberFormatter = new Intl.NumberFormat(siteConfig.locale);
const lastSeenFormatter = new Intl.DateTimeFormat(siteConfig.locale, { dateStyle: "medium", timeStyle: "short", hourCycle: "h23", timeZone: "America/Santiago" });

/** Hover text of the status badge: online now, or the last connection. */
export const presenceLabel = ({ isOnline, lastSeenAt }: Pick<AdminUserSummary, "isOnline" | "lastSeenAt">) =>
  isOnline
    ? "Conectado ahora"
    : lastSeenAt
      ? `Última conexión: ${lastSeenFormatter.format(new Date(lastSeenAt))}`
      : "Sin conexiones registradas";

/**
 * Below `xl` each row is a compact card (flex-wrap): name and email on top, then role, status, date and
 * activity on one wrapped line, then the actions in a single row. Denser still on narrow phones (`max-sm`).
 * From `xl` up it is a table (room for the sidebar).
 */
const rowClassName =
  "flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-line py-3 last:border-b-0 max-sm:gap-y-1.5 max-sm:py-2.5 xl:table-row";
const cellClassName = "xl:table-cell xl:border-b xl:border-line xl:py-4 xl:pr-4 xl:align-middle";
const headerClassName = "py-3 pr-4 text-left font-semibold";
const controlClassName =
  "h-12 rounded-sm border border-line bg-surface px-4 text-ink transition-colors duration-200 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
/** Block-level (`flex w-fit`): an inline badge sits on the text baseline and ends up below the cell's middle. */
const badgeClassName = "flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";

/** «Ana García» → «AG». */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase("es"))
    .join("");

type AdminUserListProps = {
  result: PaginatedResponse<AdminUserSummary>;
  params: AdminUserListParams;
  /** The administrator viewing the list: their own row cannot be changed here. */
  currentAdminId: string;
};

/** ADMIN users: create (collapsible panel), search and filters, and per-user edit, status and delete. */
export function AdminUserList({ result, params, currentAdminId }: AdminUserListProps) {
  const { data: users, meta } = result;
  const isFiltered = Boolean(params.search || params.role || params.status);
  const firstShown = (meta.page - 1) * meta.pageSize + 1;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Usuarios</h1>
      <p className="mt-2 text-lg text-muted">
        Tu cuenta primero, luego quienes están conectados (en verde) y después el resto. Un usuario desactivado no puede ingresar.
      </p>

      <div className="mt-8">
        <AdminUserCreate />
      </div>

      {/* A plain GET form: the filters live in the URL and work without JavaScript. */}
      <form
        action={ADMIN_USERS_PATH}
        method="get"
        role="search"
        aria-label="Buscar usuarios"
        className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]"
      >
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <label htmlFor="admin-user-search" className="sr-only">
            Buscar por nombre o email
          </label>
          <input
            id="admin-user-search"
            name="search"
            type="search"
            defaultValue={params.search}
            maxLength={MAX_SEARCH_LENGTH}
            placeholder="Buscar por nombre o email…"
            className={cn(controlClassName, "w-full px-5")}
          />
        </div>
        <div>
          <label htmlFor="admin-user-role" className="sr-only">
            Rol
          </label>
          <select id="admin-user-role" name="role" defaultValue={params.role ?? ""} className={cn(controlClassName, "w-full")}>
            <option value="">Todos los roles</option>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {userRoleLabels[role]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="admin-user-status" className="sr-only">
            Estado
          </label>
          <select id="admin-user-status" name="status" defaultValue={params.status ?? ""} className={cn(controlClassName, "w-full")}>
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="h-12 flex-1 rounded-sm bg-accent px-7 font-semibold text-on-accent transition-colors duration-200 hover:bg-accent-hover lg:flex-none"
          >
            Buscar
          </button>
          {isFiltered && (
            <Link
              href={ADMIN_USERS_PATH}
              className="text-sm font-semibold text-ink underline decoration-accent decoration-1 underline-offset-4 transition-colors duration-200 hover:decoration-ink"
            >
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <p aria-live="polite" className="mt-6 text-sm text-muted">
        {meta.total === 0
          ? "0 usuarios"
          : `${numberFormatter.format(firstShown)}-${numberFormatter.format(firstShown + users.length - 1)} de ${numberFormatter.format(meta.total)} ${meta.total === 1 ? "usuario" : "usuarios"}`}
      </p>

      {users.length === 0 ? (
        <p className="mt-4 rounded-[1.25rem] border border-dashed border-line p-8 text-center text-muted">
          {meta.total === 0 ? "Ningún usuario coincide con la búsqueda o los filtros." : "No hay usuarios en esta página."}
        </p>
      ) : (
        <div className="mt-3 rounded-[1.25rem] border border-line bg-surface px-4 shadow-soft max-sm:px-3 xl:px-6">
          <table className="w-full border-collapse text-left xl:table-fixed">
            <caption className="sr-only">Usuarios registrados</caption>
            {/* Fixed widths for the short columns and the three action buttons; the user takes the rest. */}
            <colgroup>
              <col />
              <col className="xl:w-[6rem]" />
              <col className="xl:w-[6rem]" />
              <col className="xl:w-[6.5rem]" />
              <col className="xl:w-[17.5rem]" />
            </colgroup>
            <thead className="max-xl:sr-only">
              <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <th scope="col" className={headerClassName}>Usuario</th>
                <th scope="col" className={headerClassName}>Rol</th>
                <th scope="col" className={headerClassName}>Estado</th>
                <th scope="col" className={headerClassName}>Registro</th>
                <th scope="col" className={cn(headerClassName, "pr-0 text-right")}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={cn(rowClassName, "xl:[&:last-child>td]:border-b-0")}>
                  <td className={cn(cellClassName, "basis-full")}>
                    <div className="flex items-center gap-3 max-sm:gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold max-sm:size-8 max-sm:text-xs",
                          user.role === "ADMIN" ? "bg-accent text-on-accent" : "bg-line/60 text-ink",
                        )}
                      >
                        {initialsOf(user.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink max-sm:text-sm" title={user.name}>
                          {user.name}
                          {user.id === currentAdminId && <span className="ml-1.5 text-xs font-normal text-muted">(tú)</span>}
                        </span>
                        <span className="block truncate text-sm text-muted max-sm:text-xs" title={user.email}>
                          {user.email}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className={cellClassName}>
                    <span className={cn(badgeClassName, user.role === "ADMIN" ? "border-accent/50 text-accent" : "border-line text-muted")}>
                      {user.role === "ADMIN" ? "Admin" : userRoleLabels[user.role]}
                    </span>
                  </td>
                  <td className={cellClassName}>
                    <span
                      title={presenceLabel(user)}
                      className={cn(
                        badgeClassName,
                        !user.isActive
                          ? "border-red-300/60 text-red-700 dark:border-red-900 dark:text-red-400"
                          : user.isOnline
                            ? // Green only for whoever is online right now.
                              "gap-1.5 border-emerald-600/50 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300"
                            : "border-accent/40 bg-accent/10 text-ink",
                      )}
                    >
                      {user.isOnline && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
                      {user.isActive ? "Activo" : "Inactivo"}
                      {user.isOnline && <span className="sr-only"> · conectado ahora</span>}
                    </span>
                  </td>
                  {/* Secondary: hidden on narrow phones, where name, email, role and status must fit first. */}
                  <td className={cn(cellClassName, "text-sm text-muted max-xl:text-xs max-sm:hidden")}>
                    <span className="xl:hidden">Desde </span>
                    <time dateTime={user.createdAt}>{dateFormatter.format(new Date(user.createdAt))}</time>
                  </td>
                  <td className={cn(cellClassName, "basis-full xl:pr-0")}>
                    <AdminUserActions user={user} isCurrentAdmin={user.id === currentAdminId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        pathname={ADMIN_USERS_PATH}
        searchParams={toAdminUserListQuery(params)}
        currentPage={meta.page}
        totalPages={meta.totalPages}
      />
    </div>
  );
}
