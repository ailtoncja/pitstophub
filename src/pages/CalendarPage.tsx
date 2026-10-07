import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, CalendarPlus, CheckCircle2, MapPin } from 'lucide-react';
import { paths } from '../app/paths';
import { Avatar } from '../components/Avatar';
import { CutButton } from '../components/pit';
import { useToast } from '../components/Toast';
import { CountdownPanel, EmptyState, LiveDot, Skeleton } from '../components/ui';
import { findCategoryDriver, findCategoryTeam, teamOfDriver } from '../lib/entities';
import { dayMonth, hasStartTime, monthShort, pad2, raceTitle, racePlace, timeOf, timeZoneLabel, weekdayShort } from '../lib/format';
import { useT } from '../lib/i18n';
import { buildIcs, downloadIcs } from '../lib/ics';
import { roundNumber, upcomingRaces } from '../lib/season';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useCategory, useLiveData } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import { useSettings } from '../state/settings';
import type { Category, Race } from '../types';

const SESSION_KEYS = { fp1: 'ses.fp1', fp2: 'ses.fp2', fp3: 'ses.fp3', 'sprint-qualifying': 'ses.sprintQualifying', sprint: 'ses.sprint', qualifying: 'ses.qualifying', race: 'ses.race' } as const;
const dayMonthNumericShort = (date: Date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

/** Temporada completa da categoria escolhida: resumo da proxima etapa e uma carta por rodada (como no app). */
export default function CalendarPage() {
  const { t, lang } = useT();
  const toast = useToast();
  const { ready } = useLiveData();
  const { selectedId } = useSelectedCategory();
  const category = useCategory(selectedId);
  const settings = useSettings();
  const now = Date.now();

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
  const done = races.filter((race) => race.status === 'completed').length;

  if (!category) {
    return <div className="px-margin pt-6 space-y-3"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-28" /><Skeleton className="h-48" /></div>;
  }

  const following = settings.isFollowingCategory(category.id);
  const toggleAlerts = () => {
    if (settings.toggleCategory(category.id)) {
      toast.show(following ? t('toast.alertsOff', { name: category.name }) : t('toast.alertsOn', { name: category.name }), { kind: 'alert' });
    }
  };
  const exportAll = () => {
    if (upcoming.length === 0) return;
    downloadIcs(`pitstophub-${category.id}.ics`, buildIcs(upcoming.map((race) => ({ category, race })), lang));
    toast.show(t('cal.exported'), { kind: 'ok' });
  };

  return (
    <div className="flex flex-col w-full px-margin pt-6 pb-10 gap-space-lg page-in">
      <header className="space-y-3">
        <p className="type-label-badge uppercase tracking-widest text-on-surface-variant">{lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}</p>
        <h1 className="type-headline-lg text-[34px] leading-9 uppercase text-on-surface border-b-[3px] border-primary-container pb-2 w-fit">{t('cal.seasonTitle', { year: season ?? '' })}</h1>
        <p className="type-label-badge uppercase tracking-wider text-on-surface-variant">
          {t('cal.stats', { total: races.length, done, left: upcoming.length })}
        </p>
      </header>

      {races.length === 0 ? (
        !ready ? <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-48" /></div> : <EmptyState icon={CalendarPlus} title={t('cal.noUpcoming')} hint={t('cal.noUpcomingHint')} />
      ) : (
        <>
          {next && (
            <div className="rounded-lg bg-asphalt border border-hairline overflow-hidden">
              <div className="p-4 space-y-3">
                <div className="min-w-0">
                  <p className="type-label-telemetry uppercase text-on-surface-variant">{t('home.nextRace')}</p>
                  <Link to={paths.race(category.id, next.id)} className="type-headline-md text-[20px] leading-6 uppercase text-white hover:text-primary block">{raceTitle(next, lang)}</Link>
                </div>
                {(hasStartTime(next) || raceStartDate(next).getTime() > now) && (
                  <CountdownPanel target={raceStartDate(next).getTime()} labels={{ d: t('unit.days'), h: t('unit.hours'), m: t('unit.minutes') }} />
                )}
              </div>
              <div className="grid grid-cols-2 border-t border-hairline-soft">
                <button type="button" onClick={exportAll} className="flex items-center justify-center gap-2 py-3 type-label-badge uppercase tracking-wider text-on-surface hover:bg-asphalt-alt">
                  <CalendarPlus className="w-4 h-4 text-primary" /> {t('cal.exportBtn')}
                </button>
                <button type="button" onClick={toggleAlerts} aria-pressed={following} className="flex items-center justify-center gap-2 py-3 type-label-badge uppercase tracking-wider text-on-surface hover:bg-asphalt-alt border-l border-hairline-soft">
                  {following ? <BellRing className="w-4 h-4 text-primary-container" /> : <Bell className="w-4 h-4 text-primary" />} {t('cal.alertsShort')}
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-space-md lg:grid-cols-2 items-start">
            {races.map((race) => (
              <RoundCard key={race.id} category={category} race={race} highlighted={race.id === next?.id} now={now} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RoundCard({ category, race, highlighted, now }: { category: Category; race: Race; highlighted: boolean; now: number }) {
  const { t, lang } = useT();
  const toast = useToast();
  const date = raceStartDate(race);
  const round = roundNumber(category.calendar, race);
  const completed = race.status === 'completed';
  const winnerDriver = findCategoryDriver(category, race.winner);
  const winnerTeam = winnerDriver ? teamOfDriver(category, winnerDriver) : findCategoryTeam(category, race.winner);
  const sessions = highlighted ? (race.sessions ?? []).filter((s) => s.kind === 'fp1' || s.kind === 'qualifying' || s.kind === 'race') : [];
  const startsSoon = highlighted && date.getTime() - now < 24 * 3600_000;

  return (
    <article className={cn('rounded-lg bg-asphalt border overflow-hidden', highlighted ? 'border-primary-container/70' : 'border-hairline')}>
      <div className={cn('flex items-center gap-3 px-4 py-3', highlighted ? 'bg-primary-container/15' : 'bg-surface-container-high')}>
        <div className="flex flex-col items-center leading-none">
          <span className="type-label-telemetry uppercase text-on-surface-variant">{monthShort(date, lang)}</span>
          <span className="type-headline-md text-[24px] leading-[26px] text-white mt-1">{pad2(date.getDate())}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="type-headline-sm text-[16px] uppercase text-on-surface">{t('cal.round', { n: pad2(round) })}</p>
          {hasStartTime(race) && (
            <p className="type-label-telemetry uppercase text-on-surface-variant">{weekdayShort(date, lang)} · {timeOf(date, lang)} {timeZoneLabel(date)}</p>
          )}
        </div>
        {completed ? (
          <span className="inline-flex items-center gap-1 type-label-telemetry uppercase text-on-surface-variant bg-surface-container-highest rounded-sm px-2 py-0.5"><CheckCircle2 className="w-3 h-3" />{t('cal.final')}</span>
        ) : startsSoon ? (
          <span className="inline-flex items-center gap-1.5 type-label-telemetry uppercase text-white bg-primary-container rounded-sm px-2 py-0.5"><LiveDot color="bg-white" />{t('cal.liveSoon')}</span>
        ) : null}
      </div>

      <div className="p-4 space-y-3.5">
        <div>
          <Link to={paths.race(category.id, race.id)} className="type-headline-md text-[20px] leading-6 uppercase text-white hover:text-primary block">{raceTitle(race, lang)}</Link>
          <p className="type-label-badge uppercase text-on-surface-variant mt-1 flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 mt-px shrink-0" />
            <span>{race.circuit || racePlace(race, lang)}</span>
          </p>
        </div>

        {completed && race.winner && (
          <div className="flex items-center gap-3 rounded-sm bg-surface-container-low px-3 py-2.5">
            <Avatar src={winnerDriver?.image ?? winnerDriver?.cutout ?? winnerTeam?.badge} name={race.winner} size={40} />
            <div className="min-w-0">
              <p className="type-label-telemetry uppercase text-on-surface-variant">{t('cal.winner')}</p>
              <p className="type-telemetry-counter text-[15px] text-white truncate">{race.winner}</p>
            </div>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="space-y-1.5">
            {sessions.map((session) => {
              const sessionDate = new Date(session.startsAt);
              const isRace = session.kind === 'race';
              return (
                <div key={session.kind} className={cn('flex items-center justify-between gap-3 rounded-sm px-3 py-2', isRace ? 'bg-primary-container/15' : 'bg-surface-container-low')}>
                  <span className={cn('type-body-sm truncate', isRace ? 'text-white font-semibold' : 'text-on-surface-variant')}>{t(SESSION_KEYS[session.kind])}</span>
                  <span className="type-label-telemetry uppercase text-on-surface-variant shrink-0">
                    {weekdayShort(sessionDate, lang)} · {dayMonthNumericShort(sessionDate)} · <span className="text-white font-bold">{timeOf(sessionDate, lang)}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-2">
          <CutButton variant="outline" to={paths.race(category.id, race.id)} className="flex-1">
            {completed ? t('cal.results') : t('cal.details')}
          </CutButton>
          {!completed && (
            <button
              type="button"
              aria-label={t('cal.saveAgenda')}
              onClick={() => {
                downloadIcs(`pitstophub-${category.id}-${race.id}.ics`, buildIcs([{ category, race }], lang));
                toast.show(t('cal.exported'), { kind: 'ok' });
              }}
              className="w-11 h-11 rounded-sm bg-surface-container-high border border-hairline flex items-center justify-center text-primary hover:bg-surface-container-highest"
            >
              <CalendarPlus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
