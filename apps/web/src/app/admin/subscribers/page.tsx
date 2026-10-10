import { DownloadSimple } from "@phosphor-icons/react/ssr";
import { MAX_SEARCH_LENGTH } from "@portal/shared/limits";
import type { PaginatedResponse } from "@portal/shared/pagination";
import type { AdminSubscriber } from "@portal/shared/subscriber";
import type { Metadata } from "next";
import { AccessDenied } from "@/components/auth/access-denied";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import {
  ADMIN_SUBSCRIBERS_PATH,
  SUBSCRIBERS_EXPORT_URL,
  buildAdminSubscriberListApiPath,
  parseAdminSubscriberListParams,
  toAdminSubscriberListQuery,
} from "@/lib/admin-subscribers";
import { fetchWithSession, getAdminUser } from "@/lib/session";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Suscriptores | Administración",
  robots: { index: false },
};

const dateFormatter = new Intl.DateTimeFormat(siteConfig.locale, { dateStyle: "medium", timeZone: "America/Santiago" });

/** Subscribers with their welcome code and whether they redeemed it (RF-14), and the CSV export (RF-20). */
export default async function AdminSubscribersPage({ searchParams }: PageProps<"/admin/subscribers">) {
  // Checked here too: the layout check alone does not keep this content out of the response.
  if (!(await getAdminUser(ADMIN_SUBSCRIBERS_PATH))) return <AccessDenied />;

  const params = parseAdminSubscriberListParams(await searchParams);
  const { data: subscribers, meta } = await fetchWithSession<PaginatedResponse<AdminSubscriber>>(buildAdminSubscriberListApiPath(params));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-semibold tracking-tight text-ink">Suscriptores</h1>
          <p className="mt-2 text-sm text-muted">{meta.total === 1 ? "1 suscriptor" : `${meta.total} suscriptores`}</p>
        </div>
        <a href={SUBSCRIBERS_EXPORT_URL} download className={buttonClassName("secondary")}>
          <DownloadSimple aria-hidden="true" className="size-4" />
          Exportar CSV
        </a>
      </div>

      <form action={ADMIN_SUBSCRIBERS_PATH} role="search" className="mt-8 flex gap-3">
        <label htmlFor="admin-subscriber-search" className="sr-only">
          Buscar por email
        </label>
        <Input id="admin-subscriber-search" type="search" name="search" defaultValue={params.search} maxLength={MAX_SEARCH_LENGTH} placeholder="Buscar por email…" />
        <button type="submit" className={buttonClassName("secondary")}>
          Buscar
        </button>
      </form>

      {subscribers.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-8 text-center text-muted">
          {params.search ? "Ningún suscriptor coincide con la búsqueda." : "Aún no hay suscriptores."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-lg border border-line bg-surface px-4 sm:px-6">
          {subscribers.map((subscriber) => (
            <li key={subscriber.email} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink">{subscriber.email}</span>
                <span className="block text-sm text-muted">
                  Suscrito el <time dateTime={subscriber.consentAt}>{dateFormatter.format(new Date(subscriber.consentAt))}</time>, código{" "}
                  <code className="text-ink">{subscriber.code}</code>
                </span>
              </span>
              {subscriber.redeemedAt ? (
                <Badge tone="success">
                  Canjeado el <time dateTime={subscriber.redeemedAt}>{dateFormatter.format(new Date(subscriber.redeemedAt))}</time>
                </Badge>
              ) : (
                <Badge>Sin canjear</Badge>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination pathname={ADMIN_SUBSCRIBERS_PATH} searchParams={toAdminSubscriberListQuery(params)} currentPage={meta.page} totalPages={meta.totalPages} />
    </div>
  );
}
