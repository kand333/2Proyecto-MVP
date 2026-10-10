import { Leaf } from "@phosphor-icons/react/ssr";

/**
 * Moving strip of real facts (docs/design.md, block 2; DEC-016: the only loop of the site). The list is
 * rendered twice so the loop has no gap; the copy is hidden from screen readers. Pauses on hover or
 * focus, and stays still with reduced motion (global rule in globals.css).
 */
export function HomeMarquee({ phrases }: { phrases: string[] }) {
  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-8 pr-8">
      {phrases.map((phrase) => (
        <li key={phrase} className="flex items-center gap-8 whitespace-nowrap text-sm font-medium text-ink">
          {phrase}
          <Leaf aria-hidden="true" className="size-4 text-accent" />
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label="Beneficios" className="overflow-hidden border-y border-line bg-surface">
      <div className="group flex h-12 w-max items-center">
        <div className="flex animate-[marquee_40s_linear_infinite] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}
