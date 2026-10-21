import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import { paths } from '../app/paths';
import { Avatar } from '../components/Avatar';
import { CategoryHeader } from '../components/CategoryHeader';
import { StatusTag } from '../components/pit';
import { raceChangeText } from '../components/RaceChangeNote';
import { RaceSpotlight } from '../components/RaceSpotlight';
import { useToast } from '../components/Toast';
import { Button, EmptyState, SectionTitle, Skeleton } from '../components/ui';
import { findCategoryDriver, findCategoryTeam, teamOfDriver } from '../lib/entities';
import { hasStartTime, monthShort, pad2, racePlace, raceTitle, timeOf, timeZoneLabel, weekdayShort } from '../lib/format';
import { useT } from '../lib/i18n';
import { buildIcs, downloadIcs } from '../lib/ics';
import { calendarSections, raceChange } from '../lib/race-changes';
import { roundNumber, upcomingRaces } from '../lib/season';
import { useNow } from '../lib/useNow';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useCategory, useLiveData } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import { MOTORSPORT_DATA, type Category, type Race } from '../types';

const SESSION_KEYS = { fp1: 'ses.fp1', fp2: 'ses.fp2', fp3: 'ses.fp3', 'sprint-qualifying': 'ses.sprintQualifying', sprint: 'ses.sprint', qualifying: 'ses.qualifying', race: 'ses.race' } as const;
const dayMonthNumericShort = (date: Date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

/** Temporada completa da categoria: a proxima etapa em destaque e uma linha por rodada, as que faltam primeiro. */
export default function CalendarPage() {
  const { t, lang } = useT();
  const toast = useToast();
  const { ready } = useLiveData();
  const { selectedId } = useSelectedCategory();
  const category = useCategory(selectedId);
  const now = useNow(30_000);

  const season = category?.calendar[0]?.date.slice(0, 4);
  const races = useMemo(
    () =>
      (category?.calendar ?? [])
        .filter((race) => race.status !== 'cancelled')
        .slice()
        .sort((a, b) => raceStartDate(a).getTime() - raceStartDate(b).getTime()),
    [category],
  );
  const upcoming = useMemo(() => (category ? upcomingRaces(category.calendar, now) : []), [category, now]);
  const next = upcoming[0] ?? null;
  const done = useMemo(() => races.filter((race) => race.status === 'completed').reverse(), [races]);
  // As listas mostram tambem as etapas canceladas (riscadas, na posicao da data); a contagem acima e a proxima etapa nao.
  const catalog = useMemo(() => MOTORSPORT_DATA.find((item) => item.id === category?.id)?.calendar ?? [], [category?.id]);
  const sections = useMemo(() => calendarSections(category?.calendar ?? [], catalog, now), [category, catalog, now]);

  if (!category) {
    return <div className="px-margin lg:px-0 pt-6 space-y-3"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-28" /><Skeleton className="h-48" /></div>;
  }

  const exportAll = () => {
    if (upcoming.length === 0) return;
    downloadIcs(`pitstophub-${category.id}.ics`, buildIcs(upcoming.map((race) => ({ category, race })), lang));
    toast.show(t('cal.exported'), { kind: 'ok' });
  };

  return (
    <div className="px-margin lg:px-0 pb-10 page-in">
      <CategoryHeader category={category} current="calendar" />

      {races.length === 0 ? (
        <div className="mt-6">
          {!ready ? <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-48" /></div> : <EmptyState icon={CalendarPlus} title={t('cal.noUpcoming')} hint={t('cal.noUpcomingHint')} />}
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="type-headline-md text-white">{t('cal.seasonTitle', { year: season ?? '' })}</h2>
              <p className="type-body-md text-silver mt-1">{t('cal.stats', { total: races.length, done: done.length, left: upcoming.length })}</p>
            </div>
            {upcoming.length > 0 && (
              <Button variant="secondary" onClick={exportAll}>
                <CalendarPlus className="w-[18px] h-[18px]" /> {t('cal.exportBtn')}
              </Button>
            )}
          </div>

          {next && (
            <Link to={paths.race(category.id, next.id)} className="block group" aria-label={raceTitle(next, lang)}>
              <RaceSpotlight race={next} categoryId={category.id} now={now} className="group-hover:border-white/35 transition-colors min-h-[16rem] lg:min-h-[19rem]" />
            </Link>
          )}

          {sections.toCome.length > 0 && (
            <section className="space-y-3">
              <SectionTitle>{t('cal.toCome')}</SectionTitle>
              <ul className="rounded-2xl bg-asphalt border border-hairline divide-y divide-hairline-soft overflow-hidden">
                {sections.toCome.map((race) =>
                  race.status === 'cancelled' ? (
                    <CancelledRow key={race.id} category={category} race={race} catalog={catalog} />
                  ) : (
                    <RoundRow key={race.id} category={category} race={race} highlighted={race.id === next?.id} now={now} />
                  ),
                )}
              </ul>
            </section>
          )}

          {sections.played.length > 0 && (
            <section className="space-y-3">
              <SectionTitle>{t('cal.played')}</SectionTitle>
              <ul className="rounded-2xl bg-asphalt border border-hairline divide-y divide-hairline-soft overflow-hidden">
                {sections.played.map((race) =>
                  race.status === 'cancelled' ? (
                    <CancelledRow key={race.id} category={category} race={race} catalog={catalog} />
                  ) : (
                    <RoundRow key={race.id} category={category} race={race} highlighted={false} now={now} />
                  ),
                )}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Etapa cancelada na lista: apagada e riscada, sem numero de rodada nem acoes de agenda, com a substituta (ou "sem
 * substituta") na linha de baixo. A linha toda leva a pagina da etapa, que tem o link para a substituta.
 */
function CancelledRow({ category, race, catalog }: { category: Category; race: Race; catalog: Race[] }) {
  const { t, lang } = useT();
  const date = raceStartDate(race);
  const change = raceChange(catalog, race);
  const place = race.circuit || racePlace(race, lang);
  const status = [t('cir.cancelled'), change && change.kind !== 'replaces' ? raceChangeText(change, t, lang) : null].filter(Boolean).join(' · ');

  return (
    <li>
      <Link to={paths.race(category.id, race.id)} className="flex items-center gap-4 pl-4 pr-4 py-4 group">
        <span className="w-12 shrink-0 text-center leading-none">
          <span className="type-headline-md text-silver-dim tabular block">{pad2(date.getDate())}</span>
          <span className="type-label-telemetry text-silver-dim block mt-1">{monthShort(date, lang)}</span>
        </span>
        <span className="flex-1 min-w-0">
          <span className="type-body-md font-semibold text-silver block truncate line-through decoration-silver/60 group-hover:decoration-white/60">{raceTitle(race, lang)}</span>
          {place && <span className="type-body-sm text-silver-dim block truncate">{place}</span>}
          <span className="type-body-sm text-silver block mt-0.5">{status}</span>
        </span>
      </Link>
    </li>
  );
}

function RoundRow({ category, race, highlighted, now }: { category: Category; race: Race; highlighted: boolean; now: number }) {
  const { t, lang } = useT();
  const toast = useToast();
  const date = raceStartDate(race);
  const round = roundNumber(category.calendar, race);
  const completed = race.status === 'completed';
  const winnerDriver = findCategoryDriver(category, race.winner);
  const winnerTeam = winnerDriver ? teamOfDriver(category, winnerDriver) : findCategoryTeam(category, race.winner);
  const sessions = highlighted ? (race.sessions ?? []).filter((s) => s.kind === 'fp1' || s.kind === 'qualifying' || s.kind === 'race') : [];
  const startsSoon = highlighted && date.getTime() - now < 24 * 3600_000;
  const place = race.circuit || racePlace(race, lang);

  return (
    <li className={cn(highlighted && 'bg-white/[0.06]')}>
      <div className="flex items-center gap-4 pl-4 pr-2 py-4">
        <Link to={paths.race(category.id, race.id)} className="flex-1 min-w-0 flex items-center gap-4 group">
          <span className="w-12 shrink-0 text-center leading-none">
            <span className="type-headline-md text-white tabular block">{pad2(date.getDate())}</span>
            <span className="type-label-telemetry text-silver block mt-1">{monthShort(date, lang)}</span>
          </span>
          <span className="flex-1 min-w-0">
            <span className="type-body-md font-semibold text-white block truncate group-hover:underline underline-offset-4 decoration-white/40">{raceTitle(race, lang)}</span>
            <span className="type-body-sm text-silver block truncate">{[t('cal.round', { n: pad2(round) }), place].filter(Boolean).join(' · ')}</span>
            {completed && race.winner && (
              <span className="mt-1.5 flex items-center gap-2 type-body-sm text-silver">
                <Avatar src={winnerDriver?.image ?? winnerDriver?.cutout ?? winnerTeam?.badge} name={race.winner} size={24} />
                <span className="truncate">{t('cal.winner')}: <span className="text-white font-semibold">{race.winner}</span></span>
              </span>
            )}
          </span>
        </Link>

        <div className="shrink-0 flex items-center gap-1">
          {completed ? (
            <span className="inline-flex items-center gap-1.5 type-label-badge text-silver pr-2"><CheckCircle2 className="w-4 h-4" />{t('cal.final')}</span>
          ) : (
            <>
              <span className="text-right pr-1">
                {hasStartTime(race) && (
                  <span className="type-headline-sm text-white tabular block">{timeOf(date, lang)}</span>
                )}
                {hasStartTime(race) && <span className="type-label-telemetry text-silver block">{weekdayShort(date, lang)} · {timeZoneLabel(date)}</span>}
                {startsSoon && <StatusTag live className="text-[0.75rem] text-white">{t('cal.liveSoon')}</StatusTag>}
              </span>
              <button
                type="button"
                aria-label={t('cal.saveAgenda')}
                onClick={() => {
                  downloadIcs(`pitstophub-${category.id}-${race.id}.ics`, buildIcs([{ category, race }], lang));
                  toast.show(t('cal.exported'), { kind: 'ok' });
                }}
                className="w-11 h-11 rounded-full flex items-center justify-center text-silver hover:text-white hover:bg-white/10 transition-colors"
              >
                <CalendarPlus className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {sessions.length > 0 && (
        <ul className="pb-3 pl-[4.75rem] pr-4 space-y-1.5">
          {sessions.map((session) => {
            const sessionDate = new Date(session.startsAt);
            const isRace = session.kind === 'race';
            return (
              <li key={session.kind} className="flex items-center justify-between gap-3 type-body-sm">
                <span className={cn(isRace ? 'text-white font-semibold' : 'text-silver')}>{t(SESSION_KEYS[session.kind])}</span>
                <span className="text-silver tabular shrink-0">
                  {weekdayShort(sessionDate, lang)} · {dayMonthNumericShort(sessionDate)} · <span className="text-white font-semibold">{timeOf(sessionDate, lang)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
