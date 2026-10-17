import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CarFront, Flag, Lightbulb, ListOrdered, SlidersHorizontal, Users, type LucideIcon } from 'lucide-react';
import { CategoryHeader } from '../components/CategoryHeader';
import { EmptyState, PillStrip, Skeleton } from '../components/ui';
import { splitBio } from '../lib/bio';
import { useScrollTopOn } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { ruleKind, shortRuleTitle, type RuleKind } from '../lib/rules';
import { cn } from '../lib/utils';
import { useCategory, useLiveData } from '../state/live-data';

const KIND_ICON: Record<RuleKind, LucideIcon> = {
  scoring: ListOrdered,
  balance: SlidersHorizontal,
  classes: Users,
  car: CarFront,
  fun: Lightbulb,
  format: Flag,
};

// So a frase curta vira destaque; um bloco longo em negrito cansa a leitura.
const LEAD_MAX = 150;

/** "Como funciona": as regras da categoria numa coluna de leitura, com indice lateral no computador e atalhos no celular. */
export default function RulesPage() {
  const { categoryId } = useParams();
  useScrollTopOn(categoryId ?? '');
  const { t, lang } = useT();
  const { ready } = useLiveData();
  const category = useCategory(categoryId);
  const [params] = useSearchParams();
  const rules = category?.rulesFormat ?? [];
  const [current, setCurrent] = useState(0);
  const sections = useRef<(HTMLElement | null)[]>([]);
  const initial = Number(params.get('s')) || 0;

  const goTo = (index: number, smooth = true) => {
    sections.current[index]?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  };

  // Abre ja na secao pedida (?s=) e acompanha a secao visivel para destacar o atalho.
  useEffect(() => {
    if (rules.length === 0) return;
    if (initial > 0 && initial < rules.length) window.setTimeout(() => goTo(initial, false), 60);
  }, [rules.length, initial]);

  useEffect(() => {
    if (rules.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setCurrent(Number((visible.target as HTMLElement).dataset.index ?? 0));
      },
      { rootMargin: '-130px 0px -55% 0px' },
    );
    sections.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [rules.length]);

  if (!category) {
    return (
      <div className="px-margin lg:px-0 pt-6">
        {ready ? <EmptyState title={t('cat.notFound')} /> : <Skeleton className="h-40" />}
      </div>
    );
  }

  const titles = rules.map((rule) => shortRuleTitle(lang === 'en' ? rule.enTitle ?? rule.title : rule.title));

  return (
    <div className="pb-12 page-in">
      <div className="px-margin lg:px-0">
        <CategoryHeader category={category} current="rules" />
      </div>

      {rules.length === 0 ? (
        <div className="px-margin lg:px-0 pt-6"><EmptyState title={t('rules.title')} hint={t('rules.unavailable')} /></div>
      ) : (
        <>
          <div className="lg:hidden sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 bg-black px-margin pt-3 pb-2 border-b border-hairline-soft">
            <PillStrip
              options={rules.map((_, index) => ({ value: String(index), label: titles[index] }))}
              value={String(current)}
              onChange={(value) => { setCurrent(Number(value)); goTo(Number(value)); }}
            />
          </div>

          <div className="px-margin lg:px-0 pt-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 items-start">
            <nav aria-label={t('rules.title')} className="hidden lg:block sticky top-8">
              <h2 className="type-headline-sm text-white mb-3">{t('rules.title')}</h2>
              <ol className="space-y-0.5">
                {titles.map((title, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => { setCurrent(index); goTo(index); }}
                      aria-current={index === current ? 'true' : undefined}
                      className={cn('w-full text-left px-3 h-10 rounded-xl type-body-md transition-colors duration-200', index === current ? 'bg-white text-black font-bold' : 'text-silver hover:text-white hover:bg-white/10')}
                    >
                      {title}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="max-w-[68ch] space-y-12">
              {rules.map((rule, index) => {
                const title = lang === 'en' ? rule.enTitle ?? rule.title : rule.title;
                const text = splitBio(lang === 'en' ? rule.enBody ?? rule.body : rule.body);
                const RuleIcon = KIND_ICON[ruleKind(`${rule.title} ${rule.enTitle ?? ''}`)];
                const short = text.lead.length <= LEAD_MAX;
                return (
                  <section
                    key={rule.title}
                    ref={(node) => { sections.current[index] = node; }}
                    data-index={index}
                    className="scroll-mt-[8rem] lg:scroll-mt-8 space-y-4"
                  >
                    <h2 className="type-headline-md text-white flex items-center gap-3">
                      <RuleIcon className="w-6 h-6 shrink-0" aria-hidden />
                      {title}
                    </h2>
                    {text.lead && <p className={cn('type-body-lg', short ? 'font-semibold text-white' : 'text-silver')}>{text.lead}</p>}
                    {text.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="type-body-lg text-silver">{paragraph}</p>
                    ))}
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
