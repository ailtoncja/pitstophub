import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CarFront, Flag, Lightbulb, ListOrdered, SlidersHorizontal, Users, type LucideIcon } from 'lucide-react';
import { paths } from '../app/paths';
import { EmptyState, PillStrip, Skeleton } from '../components/ui';
import { accentOf } from '../lib/categories-meta';
import { iconOfCategory } from '../lib/category-icons';
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

/** "Como funciona": uma pagina so com as regras da categoria, uma secao por cartao e atalhos para pular entre elas. */
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
      <div className="px-margin pt-6">
        {ready ? <EmptyState title={t('cat.notFound')} /> : <Skeleton className="h-40" />}
      </div>
    );
  }

  const Icon = iconOfCategory(category.id);
  const accent = accentOf(category.id);

  return (
    <div className="flex flex-col w-full pb-10 page-in">
      <div className="px-margin pt-space-md space-y-space-md">
        <Link to={paths.category(category.id)} className="inline-flex items-center gap-2 text-on-surface-variant hover:text-white py-1">
          <ArrowLeft className="w-[18px] h-[18px]" />
          <span className="type-label-badge uppercase tracking-wider">{category.name}</span>
        </Link>

        <header className="relative overflow-hidden rounded-lg bg-asphalt border border-hairline carbon-lines">
          <div className="flex items-center gap-4 p-5">
            <span className="w-14 h-14 rounded-md bg-surface-container-high border border-hairline flex items-center justify-center shrink-0">
              <Icon className="w-[30px] h-[30px] text-white" />
            </span>
            <div className="min-w-0 space-y-1">
              <h1 className="type-headline-lg uppercase text-white">{t('rules.title')}</h1>
              <p className="type-body-sm text-on-surface-variant">
                <span className="font-semibold" style={{ color: accent }}>{category.name}</span> · {t('rules.hero')}
              </p>
            </div>
          </div>
        </header>
      </div>

      {rules.length === 0 ? (
        <div className="px-margin pt-space-lg"><EmptyState title={t('rules.title')} hint={t('rules.unavailable')} /></div>
      ) : (
        <>
          <div className="sticky top-16 z-30 bg-carbon/90 backdrop-blur-md px-margin pt-2 pb-1 mt-space-sm">
            <PillStrip
              options={rules.map((rule, index) => ({ value: String(index), label: shortRuleTitle(lang === 'en' ? rule.enTitle ?? rule.title : rule.title) }))}
              value={String(current)}
              onChange={(value) => { setCurrent(Number(value)); goTo(Number(value)); }}
            />
          </div>

          <div className="px-margin pt-space-md grid gap-space-md lg:grid-cols-2 items-start">
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
                  className="scroll-mt-[8.5rem] rounded-lg bg-asphalt border border-hairline p-5 space-y-3.5"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-11 h-11 rounded-md bg-surface-container-high border border-hairline flex items-center justify-center shrink-0">
                      <RuleIcon className="w-6 h-6 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="type-label-telemetry text-primary">{String(index + 1).padStart(2, '0')}</p>
                      <h2 className="type-headline-md text-[18px] leading-[22px] uppercase text-white">{title}</h2>
                    </div>
                  </div>
                  <span className="block w-10 h-[3px] bg-primary-container" aria-hidden />
                  {text.lead && (
                    <p className={cn('font-inter text-[16px] leading-[25px]', short ? 'font-semibold text-on-surface' : 'text-tertiary')}>{text.lead}</p>
                  )}
                  {text.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="font-inter text-[16px] leading-[25px] text-tertiary">{paragraph}</p>
                  ))}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
