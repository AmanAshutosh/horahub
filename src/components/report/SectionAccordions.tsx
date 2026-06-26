import type { ReadingSection } from '@/types/reading';
import { Accordion } from '@/components/ui/Accordion';
import { Cite } from '@/components/ui/Cite';

/** Renders a reading section (houses / dasha effects) as accordions. */
export function SectionAccordions({ section, openFirst }: { section: ReadingSection; openFirst?: boolean }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <h2 className="mb-2.5 mt-5 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-widest text-gold before:inline-block before:h-px before:w-3.5 before:bg-gold">
        {section.heading}
      </h2>
      {section.items.map((item, i) => (
        <Accordion
          key={item.title}
          title={item.title}
          subtitle={item.tags?.join(' · ')}
          defaultOpen={openFirst ? i === 0 : false}
        >
          <p>{item.body}</p>
          {item.citation && <Cite citation={item.citation} />}
          {item.note && <p className="mt-2 text-[11.5px] text-ink-muted">{item.note}</p>}
        </Accordion>
      ))}
    </section>
  );
}
