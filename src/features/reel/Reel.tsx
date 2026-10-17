import { useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bell, BellRing, CalendarPlus, ChevronDown, MapPin, Share2 } from 'lucide-react';
import { paths } from '../../app/paths';
import { ReelBackdrop, StatusTag } from '../../components/pit';
import { useToast } from '../../components/Toast';
import { Countdown, GlyphButton, StateMark } from '../../components/ui';
import { dataStateOf } from '../../lib/categories-meta';
import { hasStartTime, racePlace, raceTitle, timeOf, timeZoneLabel, weekdayDayMonth } from '../../lib/format';
import { useT } from '../../lib/i18n';
import { buildIcs, downloadIcs } from '../../lib/ics';
import type { ReelItem } from '../../lib/reel';
import { cn } from '../../lib/utils';
import { raceStartDate } from '../../race-time';
import { useSelectedCategory } from '../../state/selected-category';
import { useSettings } from '../../state/settings';

/**
 * O reel: uma largada ocupa a tela, a seguinte ja esta carregada logo abaixo e o encaixe vertical e duro.
 * O item ativo e informado ao pai (a coluna lateral da Inicio troca junto).
 */
export function Reel({ items, activeIndex, onActive, className }: { items: ReelItem[]; activeIndex: number; onActive: (index: number) => void; className?: string }) {
  const { t } = useT();
  const scroller = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLElement | null)[]>([]);

  // O item ativo e o que esta mais perto do topo da area visivel. Ouvir a rolagem (da coluna no computador,
  // da pagina no celular) e medir e mais confiavel do que observar interseccao, e custa so alguns itens.
  useEffect(() => {
    const container = scroller.current;
    if (!container) return;
    const compute = () => {
      const desktop = window.matchMedia('(min-width: 1280px)').matches;
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
      const top = desktop ? container.getBoundingClientRect().top : Number.isNaN(padding) ? 0 : padding;
      let best = 0;
      let bestDistance = Infinity;
      refs.current.forEach((el, index) => {
        if (!el) return;
        const distance = Math.abs(el.getBoundingClientRect().top - top);
        if (distance < bestDistance) {
          best = index;
          bestDistance = distance;
        }
      });
      onActive(best);
    };
    compute();
    container.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      container.removeEventListener('scroll', compute);
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, [items, onActive]);

  const goTo = useCallback((index: number) => {
    const container = scroller.current;
    const el = refs.current[index];
    if (!container || !el) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (window.matchMedia('(min-width: 1280px)').matches) {
      container.scrollTo({ top: el.offsetTop - container.offsetTop, behavior });
    } else {
      // scroll-padding-top da pagina desconta a barra do topo
      el.scrollIntoView({ behavior, block: 'start' });
    }
  }, []);

  if (items.length === 0) return null;
  return (
    <div
      ref={scroller}
      className={cn('reel xl:overflow-y-auto no-scrollbar relative bg-black', className)}
      role="region"
      aria-label={t('reel.label')}
      onKeyDown={(event) => {
        // Com o foco num glifo do item atual, as setas verticais passam para o item anterior/seguinte.
        if (event.key === 'ArrowDown') { event.preventDefault(); goTo(Math.min(items.length - 1, activeIndex + 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); goTo(Math.max(0, activeIndex - 1)); }
      }}
    >
      {items.map((item, index) => (
        <ReelCard
          key={item.category.id}
          item={item}
          index={index}
          active={index === activeIndex}
          next={items[index + 1]}
          setRef={(el) => { refs.current[index] = el; }}
          onNext={() => {
            goTo(index + 1);
            // o foco acompanha: so o item atual tem controles na ordem de tabulacao
            window.setTimeout(() => refs.current[index + 1]?.querySelector<HTMLElement>('button, a')?.focus({ preventScroll: true }), 0);
          }}
        />
      ))}
    </div>
  );
}

function ReelCard({ item, index, active, next, setRef, onNext }: { item: ReelItem; index: number; active: boolean; next?: ReelItem; setRef: (el: HTMLElement | null) => void; onNext: () => void }) {
  const { t, lang } = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const settings = useSettings();
  const { select } = useSelectedCategory();
  const { category, race, phase } = item;
  // So o item atual entra na ordem de tabulacao (sao quatro glifos por item); os outros continuam lidos por leitores de tela.
  const tab = active ? 0 : -1;

  const start = raceStartDate(race);
  const timed = hasStartTime(race);
  const following = settings.isFollowingCategory(category.id);
  const title = raceTitle(race, lang);
  const place = race.circuit && race.circuit !== racePlace(race, lang) ? [race.circuit, racePlace(race, lang)].filter(Boolean).join(' · ') : racePlace(race, lang);
  const toggleFollow = () => {
    if (settings.toggleCategory(category.id)) {
      toast.show(following ? t('toast.alertsOff', { name: category.name }) : t('toast.alertsOn', { name: category.name }), { kind: 'alert' });
    }
  };
  const addToCalendar = () => {
    downloadIcs(`pitstophub-${category.id}-${race.id}.ics`, buildIcs([{ category, race }], lang));
    toast.show(t('cal.exported'), { kind: 'ok' });
  };
  const share = async () => {
    const url = `${window.location.origin}${paths.race(category.id, race.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${title} · ${category.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.show(t('toast.linkCopied'), { kind: 'ok' });
      }
    } catch {
      // compartilhamento cancelado
    }
  };
  const open = () => {
    select(category.id);
    navigate(paths.race(category.id, race.id));
  };

  return (
    <article ref={setRef} data-index={index} className="reel-item relative shrink-0" aria-label={`${category.name}: ${title}`}>
      <div className="absolute inset-0 overflow-hidden">
        <ReelBackdrop race={race} categoryId={category.id} eager={index < 2} />
      </div>

      {/* Legenda ancorada embaixo, a esquerda */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-6 pr-[5.25rem] lg:px-9 lg:pb-9 lg:pr-[7rem] space-y-2.5">
        <h2 className="text-[2rem] sm:text-[2.5rem] lg:text-[3.5rem] leading-[0.98] font-extrabold tracking-[-0.035em] text-white text-balance line-clamp-3">{title}</h2>

        <p className="text-[1.125rem] lg:text-[1.5rem] leading-tight font-bold text-white tabular">
          {phase === 'wrapped' ? (
            race.winner ? `${t('home.winner')}: ${race.winner}` : t('home.seasonWrapped')
          ) : (
            <>
              {weekdayDayMonth(start, lang)}
              {timed && <> · {timeOf(start, lang)} <span className="text-silver font-semibold">{timeZoneLabel(start)}</span></>}
            </>
          )}
        </p>

        <div className="min-h-[2.25rem] flex items-center">
          {phase === 'live' ? (
            <StatusTag live className="text-[1rem] text-white">{t('home.liveNow')}</StatusTag>
          ) : phase === 'awaiting' ? (
            <StatusTag className="text-[1rem]">{t('home.awaiting')}</StatusTag>
          ) : phase === 'wrapped' ? (
            <StatusTag className="text-[1rem]">{t('home.seasonWrapped')}</StatusTag>
          ) : timed ? (
            <Countdown target={start.getTime()} labels={{ d: t('unit.dShort'), h: t('unit.hShort'), m: t('unit.mShort') }} />
          ) : (
            <StatusTag className="text-[1rem]">{t('home.timeTbc')}</StatusTag>
          )}
        </div>

        {place && (
          <p className="flex items-center gap-2 type-body-md text-silver">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="line-clamp-2">{place}</span>
          </p>
        )}

        <Link to={paths.category(category.id)} onClick={() => select(category.id)} tabIndex={tab} className="inline-flex items-center gap-2.5 type-label-badge text-[0.875rem] text-white hover:underline underline-offset-4 decoration-white/50">
          <StateMark state={dataStateOf(category.id)} className="text-white" />
          <span>{category.name}</span>
          {item.round != null && item.rounds > 0 && <span className="text-silver font-medium">{t('home.roundOf', { n: item.round, total: item.rounds })}</span>}
        </Link>
      </div>

      {/* Trilho de glifos a direita: seguir, agenda, compartilhar, abrir */}
      <div className="absolute right-3 lg:right-6 bottom-6 lg:bottom-9 flex flex-col items-center gap-5">
        <GlyphButton label={following ? t('common.following') : t('common.follow')} active={following} tone="red" onClick={toggleFollow} showLabel tabIndex={tab}>
          {following ? <BellRing className="w-[22px] h-[22px]" /> : <Bell className="w-[22px] h-[22px]" />}
        </GlyphButton>
        {phase !== 'wrapped' && (
          <GlyphButton label={t('cal.saveAgenda')} visibleLabel={t('reel.agenda')} onClick={addToCalendar} showLabel tabIndex={tab}>
            <CalendarPlus className="w-[22px] h-[22px]" />
          </GlyphButton>
        )}
        <GlyphButton label={t('reel.share')} onClick={() => void share()} showLabel tabIndex={tab}>
          <Share2 className="w-[22px] h-[22px]" />
        </GlyphButton>
        <GlyphButton label={t('common.open')} onClick={open} showLabel tabIndex={tab}>
          <ArrowUpRight className="w-[22px] h-[22px]" />
        </GlyphButton>
      </div>

      {/* "A seguir": o proximo item ja esta carregado logo abaixo */}
      {next && (
        <button
          type="button"
          onClick={onNext}
          tabIndex={tab}
          className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-10 max-w-[calc(100%-2rem)] inline-flex items-center gap-2 h-9 pl-4 pr-3 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-colors active:scale-95"
        >
          <span className="type-label-badge text-[0.8125rem] truncate">
            <span className="text-silver font-medium">{t('reel.next')} </span>
            {next.category.name} · {raceTitle(next.race, lang)}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0" />
        </button>
      )}
    </article>
  );
}
