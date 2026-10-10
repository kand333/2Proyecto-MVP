import { ChatCircleText, Clock, EnvelopeSimple, InstagramLogo } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";

export type ContactChannels = { whatsapp: string; email: string; instagram: string; hours: string };

type Row = { key: string; icon: Icon; label: string; value: string; href?: string };

/** Only the filled channels, each with its link (RF-28). WhatsApp keeps the digits of the number. */
function rowsOf({ whatsapp, email, instagram, hours }: ContactChannels): Row[] {
  const rows: (Row | false)[] = [
    Boolean(whatsapp) && { key: "whatsapp", icon: ChatCircleText, label: "WhatsApp", value: whatsapp, href: `https://wa.me/${whatsapp.replace(/\D/g, "")}` },
    Boolean(email) && { key: "email", icon: EnvelopeSimple, label: "Email", value: email, href: `mailto:${email}` },
    Boolean(instagram) && { key: "instagram", icon: InstagramLogo, label: "Instagram", value: instagram.replace(/^https?:\/\/(www\.)?/, ""), href: instagram },
    Boolean(hours) && { key: "hours", icon: Clock, label: "Horario", value: hours },
  ];
  return rows.filter((row): row is Row => row !== false);
}

export function ContactChannelList({ channels }: { channels: ContactChannels }) {
  const rows = rowsOf(channels);
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ChatCircleText}
        title="Pronto publicaremos nuestros canales"
        description="Mientras tanto, revisa el catálogo y haz tu pedido en línea."
      />
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {rows.map(({ key, icon: IconComponent, label, value, href }) => (
        <li key={key} className="flex items-center gap-4 py-5">
          <IconComponent aria-hidden="true" className="size-6 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="text-sm text-muted">{label}</p>
            {href ? (
              <a
                href={href}
                className="break-words font-semibold text-ink underline-offset-4 hover:text-accent hover:underline"
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {value}
              </a>
            ) : (
              <p className="font-semibold text-ink">{value}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
