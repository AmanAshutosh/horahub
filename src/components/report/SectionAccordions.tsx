import type { ReadingSection } from '@/types/reading';
import { Accordion } from '@/components/ui/Accordion';
import { Cite } from '@/components/ui/Cite';

export function SectionAccordions({ section, openFirst }: { section: ReadingSection; openFirst?: boolean }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      <p className="section-acc-label">{section.heading}</p>
      {section.items.map((item, i) => (
        <Accordion
          key={item.title}
          title={item.title}
          subtitle={item.tags?.join(' · ')}
          defaultOpen={openFirst ? i === 0 : false}
        >
          <p>{item.body}</p>
          {item.citation && <Cite citation={item.citation} />}
          {item.note && (
            <p className="life-area-note">{item.note}</p>
          )}
        </Accordion>
      ))}
    </section>
  );
}
