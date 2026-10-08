import type { AdminDashboardStats } from "@portal/shared/admin";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const numberFormatter = new Intl.NumberFormat(siteConfig.locale);

type Indicator = { label: string; value: number; detail?: string };

type IndicatorGroupProps = {
  id: string;
  title: string;
  indicators: Indicator[];
  /** Optional link to manage what the group counts. */
  action?: { label: string; href: string };
};

function IndicatorGroup({ id, title, indicators, action }: IndicatorGroupProps) {
  return (
    <section aria-labelledby={id}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id={id} className="font-display text-3xl font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex border-b border-accent pb-0.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
          >
            {action.label}
          </Link>
        )}
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {indicators.map((indicator) => (
          <div key={indicator.label} className="rounded-[1.25rem] border border-line bg-surface p-6 shadow-soft">
            <dt className="text-sm text-muted">{indicator.label}</dt>
            <dd className="mt-2 font-display text-5xl font-semibold leading-none tracking-tight text-ink tabular-nums lining-nums">
              {numberFormatter.format(indicator.value)}
            </dd>
            {indicator.detail && <dd className="mt-2 text-sm text-muted">{indicator.detail}</dd>}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** ADMIN dashboard: user and item counts. */
export function AdminDashboard({ stats }: { stats: AdminDashboardStats }) {
  const { total, published } = stats.items;
  const unpublished = total - published;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-semibold tracking-tight text-ink sm:text-6xl">Panel administración</h1>
      <p className="mt-3 text-lg text-muted">Resumen del sitio.</p>

      <div className="mt-12 space-y-12">
        <IndicatorGroup
          id="items-indicators-title"
          title="Items"
          action={{ label: "Administrar items", href: "/admin/items" }}
          indicators={[
            { label: "Total", value: total },
            {
              label: "Publicados",
              value: published,
              detail: unpublished === 1 ? "1 sin publicar" : `${numberFormatter.format(unpublished)} sin publicar`,
            },
          ]}
        />
        <IndicatorGroup
          id="users-indicators-title"
          title="Usuarios"
          action={{ label: "Administrar usuarios", href: "/admin/users" }}
          indicators={[{ label: "Usuarios", value: stats.users }]}
        />
      </div>
    </div>
  );
}
