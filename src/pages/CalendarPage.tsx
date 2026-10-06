import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bell, BellRing, CalendarPlus, CheckCircle2, Clock, MapPin, Search, Timer, Trophy, X } from 'lucide-react';
import { paths } from '../app/paths';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import { CountdownTiles, EmptyState, LiveDot, PillStrip, SectionTitle, Skeleton } from '../components/ui';
import { getRaceCircuitInfo } from '../circuit-info';
import { CATEGORY_GROUPS, accentOf, type GroupId } from '../lib/categories-meta';
import { findCategoryDriver, findCategoryTeam, normalize, teamOfDriver } from '../lib/entities';
import { useRaceResults } from '../lib/f1-hooks';
import { dayMonth, hasStartTime, longDate, monthLong, monthShort, pad2, raceTitle, racePlace, timeOf, timeZoneLabel, weekdayShort } from '../lib/format';
import { useT } from '../lib/i18n';
import { buildIcs, downloadIcs } from '../lib/ics';
import { raceHighlights, roundNumber, upcomingRaces } from '../lib/season';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useLiveData } from '../state/live-data';
import { useSettings } from '../state/settings';
import type { Category, Race } from '../types';

type Item = { category: Category; race: Race };

const SESSION_KEYS = { fp1: 'ses.fp1', fp2: 'ses.fp2', fp3: 'ses.fp3', 'sprint-qualifying': 'ses.sprintQualifying', sprint: 'ses.sprint', qualifying: 'ses.qualifying', race: 'ses.race' } as const;

export default function CalendarPage() {
  const { t, lang } = useT();
  const toast = useToast();
  const { categories, ready } = useLiveData();
  const settings = useSettings();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');

  // ?c=<categoria> (links de notificacao e da Home) seleciona o grupo daquela categoria.
  const categoryParam = params.get('c');
  const groupOfParam = CATEGORY_GROUPS.find((g) => categoryParam && g.ids.includes(categoryParam))?.id;
  const [group, setGroup] = useState<GroupId | 'all'>(groupOfParam ?? 'all');
  const focusCategoryId = categoryParam && categories.some((c) => c.id === categoryParam) ? categoryParam : null;

  const now = Date.now();
  const scope = useMemo(() => {
    const ids = focusCategoryId
      ? new Set([focusCategoryId])
      : group === 'all'
        ? null
        : new Set(CATEGORY_GROUPS.find((g) => g.id === group)?.ids ?? []);
    const q = normalize(query);
    return categories
      .filter((c) => !ids || ids.has(c.id))
      .flatMap((category) => category.calendar.map((race) => ({ category, race })))
      .filter(({ category, race }) => {
        if (race.status === 'cancelled') return false;
        if (!q) return true;
        const haystack = normalize([race.name, race.enName, race.circuit, race.location, race.enLocation, category.name].filter(Boolean).join(' '));
        return haystack.includes(q);
      });
  }, [categories, group, focusCategoryId, query]);

  const upcoming: Item[] = useMemo(
    () =>
      scope
        .filter(({ race }) => race.status === 'upcoming' && raceStartDate(race).getTime() + 36 * 3600_000 > now)
        .sort((a, b) => raceStartDate(a.race).getTime() - raceStartDate(b.race).getTime()),
    [scope, now],
  );
  const completed: Item[] = useMemo(
    () =>
      scope
        .filter(({ race }) => race.status === 'completed')
        .sort((a, b) => raceStartDate(b.race).getTime() - raceStartDate(a.race).getTime()),
    [scope],
  );

  const featured = upcoming[0] ?? null;

  // Abas de mes: todos os meses que tem etapa no escopo atual.
  const months = useMemo(() => {
    const keys = Array.from(new Set(scope.map(({ race }) => race.date.slice(0, 7)))).sort();
    return keys;
  }, [scope]);
  const currentKey = new Date(now).toISOString().slice(0, 7);
  const defaultMonth = featured ? featured.race.date.slice(0, 7) : months.includes(currentKey) ? currentKey : months.at(-1) ?? currentKey;
  const [monthChoice, setMonthChoice] = useState<string | null>(null);
  const month = monthChoice && months.includes(monthChoice) ? monthChoice : defaultMonth;

  // Mantem o mes selecionado visivel na faixa de meses (o ano comeca em jan, mas a gente costuma estar em out).
  const monthStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = monthStripRef.current;
    const active = strip?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (strip && active) strip.scrollTo({ left: active.offsetLeft - strip.clientWidth / 2 + active.offsetWidth / 2, behavior: 'smooth' });
  }, [month]);

  const monthUpcoming = upcoming.filter((item, index) => index > 0 && item.race.date.startsWith(month));
  const monthCompleted = completed.filter((item) => item.race.date.startsWith(month));

  const groupOptions = [
    { value: 'all' as const, label: t('home.all') },
    ...CATEGORY_GROUPS.map((g) => ({ value: g.id, label: g.label[lang] })),
  ];

  const clearFocus = () => {
    const next = new URLSearchParams(params);
    next.delete('c');
    setParams(next, { replace: true });
  };

  const exportAll = () => {
    if (upcoming.length === 0) return;
    downloadIcs('pitstophub-calendario.ics', buildIcs(upcoming, lang));
    toast.show(t('cal.exported'), { kind: 'ok' });
  };

  const toggleAlerts = (category: Category) => {
    const wasOn = settings.isFollowingCategory(category.id);
    if (settings.toggleCategory(category.id)) {
      toast.show(wasOn ? t('toast.alertsOff', { name: category.name }) : t('toast.alertsOn', { name: category.name }), { kind: 'alert' });
    }
  };

  const monthDate = new Date(`${month}-01T12:00:00`);

  return (
    <div className="flex flex-col w-full pb-10 page-in">
      <h1 className="sr-only">{t('nav.calendar')}</h1>
      <div className="px-margin pt-space-xs space-y-3">
        {focusCategoryId ? (
          <div className="flex items-center gap-2">
            <button type="button" onClick={clearFocus} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-pill bg-racing-red text-white type-label-badge uppercase tracking-wider">
              {categories.find((c) => c.id === focusCategoryId)?.fullName}
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <PillStrip options={groupOptions} value={group} onChange={setGroup} />
        )}

        <div className="flex items-center gap-2">
          <label className="flex-1 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('cal.filter')}
              aria-label={t('cal.filter')}
              className="w-full bg-surface-container-low pl-9 pr-3 py-2 rounded-lg type-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:bg-surface-raised"
            />
          </label>
          <span className="shrink-0 px-3 py-2 rounded-lg bg-surface-container-low type-label-badge uppercase text-text-primary">
            {t('cal.seasonShort', { year: month.slice(0, 4) })}
          </span>
        </div>

        <div ref={monthStripRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-surface-container-lowest rounded-xl p-1" role="tablist">
          {months.map((key) => {
            const date = new Date(`${key}-01T12:00:00`);
            const active = key === month;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMonthChoice(key)}
                className={cn('flex-1 min-w-[3.5rem] py-2 rounded-lg type-label-badge uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1.5', active ? 'bg-surface-overlay text-white' : 'text-text-muted hover:text-white')}
              >
                {monthShort(date, lang)}
                {key === currentKey && <span className="w-1.5 h-1.5 rounded-full bg-racing-red" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>

      {!ready && scope.length === 0 ? (
        <div className="px-margin pt-4 space-y-3">
          <Skeleton className="h-72" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        <div className="px-margin pt-4 lg:grid lg:grid-cols-12 lg:gap-space-lg space-y-space-lg lg:space-y-0">
          <div className="lg:col-span-6 space-y-space-lg">
            {featured && <FeaturedCard item={featured} now={now} onToggleAlerts={toggleAlerts} alertsOn={settings.isFollowingCategory(featured.category.id)} />}
            {!featured && (
              <EmptyState icon={CalendarPlus} title={t('cal.noUpcoming')} hint={t('cal.noUpcomingHint')} />
            )}
          </div>

          <div className="lg:col-span-6 space-y-space-lg">
            <section>
              <SectionTitle bar right={t('cal.remaining', { n: upcoming.length })}>{t('cal.upcoming')}</SectionTitle>
              {monthUpcoming.length === 0 ? (
                <p className="type-body-sm text-text-muted py-4">{t('cal.noneInMonth', { month: monthLong(monthDate, lang) })}</p>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  {monthUpcoming.map((item) => (
                    <UpcomingRow key={`${item.category.id}-${item.race.id}`} item={item} onToggleAlerts={toggleAlerts} alertsOn={settings.isFollowingCategory(item.category.id)} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <SectionTitle bar right={completed.length > 0 ? t('cal.doneCount', { n: completed.length }) : undefined}>{t('cal.finished')}</SectionTitle>
              {monthCompleted.length === 0 ? (
                <p className="type-body-sm text-text-muted py-4">{t('cal.noneInMonth', { month: monthLong(monthDate, lang) })}</p>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  {monthCompleted.slice(0, 12).map((item, index) => (
                    <CompletedCard key={`${item.category.id}-${item.race.id}`} item={item} loadExtras={index < 4} />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl bg-surface-raised border border-surface-border p-space-md flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="type-label-telemetry uppercase text-racing-red font-semibold">{t('cal.exportKicker')}</p>
                <h3 className="type-headline-sm uppercase text-text-primary mt-1">{t('cal.exportTitle')}</h3>
                <p className="type-body-sm text-text-muted mt-1">{t('cal.exportBody')}</p>
              </div>
              <button type="button" onClick={exportAll} disabled={upcoming.length === 0} className="shrink-0 px-4 py-2.5 rounded-lg bg-surface-container-high text-racing-red type-label-badge uppercase tracking-wider active:scale-95 transition-all disabled:opacity-40">
                {t('cal.exportBtn')}
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Etapa em destaque ────────────────────────────────────────────────────────

function FeaturedCard({ item, now, onToggleAlerts, alertsOn }: { item: Item; now: number; onToggleAlerts: (c: Category) => void; alertsOn: boolean }) {
  const { t, lang } = useT();
  const toast = useToast();
  const { category, race } = item;
  const start = raceStartDate(race).getTime();
  const round = roundNumber(category.calendar, race);
  const info = getRaceCircuitInfo(race);
  const sessions = (race.sessions ?? []).filter((s) => s.kind === 'fp1' || s.kind === 'qualifying' || s.kind === 'race');
  const isLiveSoon = start - now < 24 * 3600_000;

  return (
    <section>
      <SectionTitle bar right={isLiveSoon ? <span className="inline-flex items-center gap-1.5 text-racing-red"><LiveDot />{t('cal.liveSoon')}</span> : null}>
        {t('cal.featured')}
      </SectionTitle>
      <article className="mt-2 rounded-2xl bg-surface-overlay border border-racing-red/70 glow-red overflow-hidden">
        <div className="relative h-36 bg-surface-container-lowest carbon-mesh flex items-center justify-center">
          {info?.trackImage && <img src={info.trackImage} alt="" className="h-full w-full object-contain p-4 opacity-90" />}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-overlay via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {isLiveSoon && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#1a0a0a] border border-racing-red type-label-telemetry uppercase text-racing-red font-bold">
                <LiveDot /> {t('cal.liveSoon')}
              </span>
            )}
            <span className="px-2 py-1 rounded bg-surface-container-lowest/80 backdrop-blur type-label-telemetry uppercase text-text-secondary">{category.name}</span>
          </div>
          <button type="button" onClick={() => onToggleAlerts(category)} aria-label={t('cal.alerts')} aria-pressed={alertsOn} className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-lowest/80 backdrop-blur text-text-secondary hover:text-racing-red">
            {alertsOn ? <BellRing className="w-4 h-4 text-racing-red" /> : <Bell className="w-4 h-4" />}
          </button>
        </div>

        <div className="p-space-md space-y-space-md">
          <div>
            <p className="type-label-telemetry uppercase text-racing-red font-bold tracking-widest">
              {category.fullName} • {t('home.round', { n: round })}
            </p>
            <Link to={paths.race(category.id, race.id)} className="block type-headline-lg uppercase text-text-primary mt-1 hover:text-white">
              {raceTitle(race, lang)}
            </Link>
            <p className="type-body-sm text-text-secondary flex items-start gap-1.5 mt-1.5">
              <MapPin className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
              <span>{[race.circuit, racePlace(race, lang)].filter(Boolean).join(' • ')}</span>
            </p>
          </div>

          <p className="type-label-telemetry uppercase tracking-wider text-text-secondary">
            {weekdayShort(new Date(start), lang)} • {dayMonth(new Date(start), lang)}{hasStartTime(race) ? ` • ${timeOf(new Date(start), lang)} ${timeZoneLabel(new Date(start))}` : ''}
          </p>

          {hasStartTime(race) && start > now && <CountdownTiles target={start} labels={{ d: t('unit.days'), h: t('unit.hours'), m: t('unit.minutes') }} />}

          {sessions.length > 0 ? (
            <div className="space-y-1.5">
              {sessions.map((session) => {
                const date = new Date(session.startsAt);
                const isRace = session.kind === 'race';
                return (
                  <div key={session.kind} className={cn('flex items-center justify-between gap-3 rounded-lg px-3 py-2.5', isRace ? 'bg-racing-red/10' : 'bg-surface-container-low')}>
                    <span className="flex items-center gap-2 type-body-sm min-w-0">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isRace ? 'bg-racing-red' : 'bg-secondary')} />
                      <span className={cn('truncate', isRace ? 'text-text-primary font-semibold' : 'text-text-secondary')}>{t(SESSION_KEYS[session.kind])}</span>
                    </span>
                    <span className="flex items-center gap-2 type-label-telemetry uppercase shrink-0">
                      <span className="text-text-muted">{weekdayShort(date, lang)} • {dayMonthNumericShort(date)}</span>
                      <span className={cn('px-1.5 py-0.5 rounded font-bold', isRace ? 'bg-racing-red text-white' : 'bg-surface-container-high text-text-primary')}>
                        {timeOf(date, lang)}{isRace ? ` ${timeZoneLabel(date)}` : ''}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : hasStartTime(race) ? (
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 bg-racing-red/10">
              <span className="type-body-sm text-text-primary font-semibold flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-racing-red" />{t('ses.race')}</span>
              <span className="type-label-telemetry uppercase text-text-secondary">{dayMonth(new Date(start), lang)} • <span className="font-bold text-white">{timeOf(new Date(start), lang)} {timeZoneLabel(new Date(start))}</span></span>
            </div>
          ) : null}

          <div className="grid grid-cols-5 gap-space-sm">
            <button
              type="button"
              onClick={() => {
                downloadIcs(`pitstophub-${category.id}-${race.id}.ics`, buildIcs([item], lang));
                toast.show(t('cal.exported'), { kind: 'ok' });
              }}
              className="col-span-3 h-11 flex items-center justify-center gap-2 rounded-lg bg-racing-red text-white type-label-badge whitespace-nowrap uppercase tracking-wider active:scale-[0.98] hover:bg-[#c50500] transition-all"
            >
              <CalendarPlus className="w-4 h-4" />
              {t('cal.saveAgenda')}
            </button>
            <Link to={paths.race(category.id, race.id)} className="col-span-2 h-11 flex items-center justify-center gap-2 rounded-lg bg-surface-container text-text-primary type-label-badge whitespace-nowrap uppercase tracking-wider hover:bg-surface-variant transition-all">
              <Timer className="w-4 h-4" />
              {t('cal.viewCircuit')}
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}

const dayMonthNumericShort = (date: Date) => `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;

// ─── Proximos confrontos ──────────────────────────────────────────────────────

function UpcomingRow({ item, onToggleAlerts, alertsOn }: { item: Item; onToggleAlerts: (c: Category) => void; alertsOn: boolean }) {
  const { t, lang } = useT();
  const { category, race } = item;
  const date = raceStartDate(race);
  const accent = accentOf(category.id);

  return (
    <article className="relative flex items-stretch gap-4 rounded-xl bg-surface-raised border border-surface-border pl-4 pr-3 py-3.5 overflow-hidden">
      <span className="absolute left-0 inset-y-0 w-[3px]" style={{ backgroundColor: accent }} aria-hidden />
      <Link to={paths.race(category.id, race.id)} className="flex items-start gap-4 flex-1 min-w-0">
        <div className="flex flex-col items-center w-11 shrink-0 rounded-lg bg-surface-container-low py-2">
          <span className="type-label-telemetry uppercase text-text-muted">{monthShort(date, lang)}</span>
          <span className="type-headline-md leading-none text-text-primary font-bold mt-0.5">{pad2(date.getDate())}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="type-label-telemetry uppercase font-bold tracking-wider" style={{ color: accent }}>{category.name}</span>
            <span className="text-text-muted text-[10px]">•</span>
            <span className="type-label-telemetry uppercase text-text-muted">{t('home.round', { n: roundNumber(category.calendar, race) })}</span>
          </div>
          <h3 className="type-headline-sm uppercase text-text-primary truncate">{raceTitle(race, lang)}</h3>
          <p className="type-body-sm text-text-secondary mt-0.5 truncate">{race.circuit || racePlace(race, lang)}</p>
        </div>
      </Link>
      <div className="flex flex-col items-end justify-between shrink-0">
        {hasStartTime(race) ? <span className="type-label-badge text-text-primary">{timeOf(date, lang)}</span> : <span />}
        <button type="button" onClick={() => onToggleAlerts(category)} aria-label={t('cal.alerts')} aria-pressed={alertsOn} className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface-container text-text-muted hover:text-racing-red active:scale-95 transition-all">
          {alertsOn ? <BellRing className="w-4 h-4 text-racing-red" /> : <Bell className="w-4 h-4" />}
        </button>
      </div>
    </article>
  );
}

// ─── Etapas concluidas ────────────────────────────────────────────────────────

function CompletedCard({ item, loadExtras }: { item: Item; loadExtras: boolean }) {
  const { t, lang } = useT();
  const { category, race } = item;
  const results = useRaceResults(loadExtras ? category : undefined, loadExtras ? race : undefined);
  const highlights = results.data ? raceHighlights(results.data) : null;
  const winnerDriver = findCategoryDriver(category, race.winner);
  const winnerTeam = winnerDriver ? teamOfDriver(category, winnerDriver) : findCategoryTeam(category, race.winner);
  const date = raceStartDate(race);

  return (
    <article className="rounded-xl bg-surface-raised border border-surface-border p-space-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-1 rounded bg-surface-container-high type-label-badge uppercase text-text-secondary shrink-0">{t('home.round', { n: roundNumber(category.calendar, race) })}</span>
          <span className="type-label-telemetry text-text-muted truncate">{longDate(date, lang)}</span>
        </div>
        <span className="inline-flex items-center gap-1 type-label-telemetry uppercase text-tertiary font-semibold shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" /> {t('cal.final')}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Avatar src={winnerDriver?.image ?? winnerDriver?.cutout ?? winnerTeam?.badge} name={race.winner ?? category.name} size={48} square />
        <div className="min-w-0 flex-1">
          <p className="type-label-telemetry uppercase text-text-muted truncate">
            {t('cal.winner')} • {raceTitle(race, lang)}
          </p>
          <p className="type-headline-md text-text-primary truncate">{race.winner ?? '—'}</p>
          {(winnerTeam || winnerDriver?.number) && (
            <p className="type-body-sm text-text-muted truncate">
              {[winnerTeam?.name, winnerDriver?.number ? `#${winnerDriver.number}` : null].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
        <Link to={paths.race(category.id, race.id)} className="shrink-0 px-3.5 py-2 rounded-lg bg-surface-container-high text-text-primary type-label-badge uppercase tracking-wider hover:bg-surface-bright transition-all">
          {t('cal.results')}
        </Link>
      </div>

      {highlights && (highlights.pole || highlights.fastestLap) && (
        <div className="mt-3 grid grid-cols-2 gap-px rounded-lg overflow-hidden bg-surface-border">
          <Stat label={t('cal.pole')} value={highlights.pole?.driverName ?? '—'} icon={<Trophy className="w-3 h-3" />} />
          <Stat label={t('cal.fastestLap')} value={highlights.fastestLap ? `${highlights.fastestLap.driverCode} ${highlights.fastestLap.fastestLapTime ?? ''}`.trim() : '—'} icon={<Clock className="w-3 h-3" />} accent />
        </div>
      )}
    </article>
  );
}

function Stat({ label, value, icon, accent = false }: { label: string; value: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className="bg-surface-container-lowest px-3 py-2">
      <p className="type-label-telemetry uppercase text-text-muted flex items-center gap-1">{icon}{label}</p>
      <p className={cn('type-label-badge mt-1 truncate', accent ? 'text-racing-red' : 'text-text-primary')}>{value}</p>
    </div>
  );
}
