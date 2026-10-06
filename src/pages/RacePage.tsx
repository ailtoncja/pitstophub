import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Droplets, MapPin, Share2, Sun, Timer, Wind } from 'lucide-react';
import { paths } from '../app/paths';
import { useToast } from '../components/Toast';
import { CountdownInline, EmptyState, ListGroup, Skeleton } from '../components/ui';
import { getRaceCircuitInfo } from '../circuit-info';
import { findCategoryDriver, raceKey } from '../lib/entities';
import { useRaceResults } from '../lib/f1-hooks';
import { dayMonth, hasStartTime, racePlace, raceTitle, timeOf, timeZoneLabel, weekdayShort } from '../lib/format';
import { useAsync, useScrollTopOn } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { buildIcs, downloadIcs } from '../lib/ics';
import { raceHighlights, roundNumber } from '../lib/season';
import { cn } from '../lib/utils';
import { fetchRaceWeather, weatherWindowOpen, type RaceWeather } from '../lib/weather';
import { raceStartDate } from '../race-time';
import { useCategory } from '../state/live-data';
import type { RaceSession, RaceSessionKind } from '../types';

const SESSION_LABEL: Record<RaceSessionKind, string> = {
  fp1: 'ses.fp1',
  fp2: 'ses.fp2',
  fp3: 'ses.fp3',
  'sprint-qualifying': 'ses.sprintQualifying',
  sprint: 'ses.sprint',
  qualifying: 'ses.qualifying',
  race: 'ses.race',
};

const WEATHER_ICON: Record<RaceWeather['condition'], typeof Sun> = {
  clear: Sun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudRain,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export default function RacePage() {
  const { categoryId, raceId } = useParams();
  useScrollTopOn(`${categoryId}/${raceId}`);
  const { t, lang } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const category = useCategory(categoryId);
  const race = category?.calendar.find((r) => raceKey(r) === raceId);

  const info = useMemo(() => (race ? getRaceCircuitInfo(race) : null), [race]);
  const results = useRaceResults(category, race);
  const highlights = useMemo(() => (results.data ? raceHighlights(results.data) : null), [results.data]);

  const hasCoords = race?.lat != null && race?.lng != null;
  const weatherEnabled = Boolean(race && hasCoords && race.status === 'upcoming' && weatherWindowOpen(race.date));
  const weather = useAsync(() => fetchRaceWeather(race!.lat!, race!.lng!, race!.date), [race?.id, race?.date], weatherEnabled);

  if (!category || !race) {
    return (
      <div className="px-margin pt-6">
        <EmptyState title={t('cir.notFound')} action={<Link to={categoryId ? paths.calendarOf(categoryId) : paths.calendar} className="px-4 py-1.5 rounded-lg bg-surface-raised text-text-primary type-label-badge uppercase tracking-wider">{t('common.back')}</Link>} />
      </div>
    );
  }

  const start = raceStartDate(race);
  const timed = hasStartTime(race);
  const round = race.round ?? roundNumber(category.calendar, race);
  const sessions = race.sessions ?? [];
  const upcoming = race.status === 'upcoming';

  const saveToCalendar = () => {
    downloadIcs(`pitstophub-${category.id}-${race.id}.ics`, buildIcs([{ category, race }], lang));
    toast.show(t('toast.icsSaved'), { kind: 'ok' });
  };

  const share = async () => {
    const url = window.location.href;
    const title = `${category.name} — ${raceTitle(race, lang)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.show(t('toast.linkCopied'), { kind: 'ok' });
    } catch {
      // Cancelar o painel de compartilhamento nao e erro.
    }
  };

  return (
    <div className="flex flex-col w-full pb-10 page-in">
      <div className="px-margin pt-space-sm pb-space-xs flex items-center justify-between">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.calendarOf(category.id)))} className="flex items-center gap-1.5 -ml-1 px-1 h-10 rounded-xl text-text-secondary hover:text-text-primary active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
          <span className="type-label-telemetry uppercase tracking-wider">{t('cir.calendar', { year: race.date.slice(0, 4) })}</span>
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={saveToCalendar} aria-label={t('cir.saveCalendar')} className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-all">
            <CalendarPlus className="w-[18px] h-[18px]" />
          </button>
          <button type="button" onClick={share} aria-label={t('cir.share')} className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-all">
            <Share2 className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* CABECALHO */}
      <section className="px-margin pt-space-xs pb-space-md">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="type-label-telemetry uppercase px-2 py-1 rounded bg-racing-red/15 text-racing-red tracking-wider">
            {t('cir.stage', { n: round })}{info ? ` • ${t('cir.laps', { n: info.laps })}` : ''}
          </span>
          <span className="type-label-telemetry uppercase px-2 py-1 rounded bg-surface-container-high text-text-secondary tracking-wider">{category.name}</span>
          {info && <span className="type-label-telemetry uppercase text-text-muted tracking-wider">{info.direction === 'clockwise' ? t('cir.clockwise') : t('cir.counterclockwise')}</span>}
        </div>
        <h1 className="type-display-hero uppercase italic font-black tracking-tighter text-text-primary leading-[0.95]">{race.circuit}</h1>
        <p className="flex items-center gap-1.5 type-body-md text-text-secondary mt-2">
          <MapPin className="w-4 h-4 text-racing-red shrink-0" />
          <span>{racePlace(race, lang)} • {raceTitle(race, lang)}</span>
        </p>
        <p className="type-label-telemetry uppercase text-text-muted mt-2 tracking-wider">
          {weekdayShort(start, lang)} {dayMonth(start, lang)}{timed ? ` • ${timeOf(start, lang)} ${timeZoneLabel(start)}` : ''}
        </p>
        {upcoming && timed && start.getTime() > Date.now() && <CountdownInline target={start.getTime()} className="mt-1" />}
      </section>

      <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg">
        <div className="lg:col-span-7 space-y-space-lg">
          {/* PREVISAO */}
          {(weather.data || weather.status === 'loading') && (
            <section className="px-margin">
              {weather.data ? <WeatherTiles weather={weather.data} /> : <Skeleton className="h-20" />}
            </section>
          )}

          {/* TRACADO */}
          {info && (
            <section className="px-margin">
              <BarTitle>{t('cir.layout')}</BarTitle>
              {info.trackImage && (
                <div className="relative mt-2 rounded-xl bg-surface-container-lowest overflow-hidden aspect-[16/10] flex items-center justify-center">
                  <img src={info.trackImage} alt={race.circuit} className="w-full h-full object-contain p-3" loading="lazy" />
                  {info.drsZones.length > 0 && (
                    <span className="absolute bottom-3 right-3 flex items-center gap-1.5 type-label-telemetry uppercase bg-surface-container-high/90 backdrop-blur px-2 py-1 rounded text-text-secondary">
                      <span className="w-1.5 h-1.5 rounded-full bg-racing-red" aria-hidden />{t('cir.drsZones', { n: info.drsZones.length })}
                    </span>
                  )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Spec label={t('cir.length')} value={info.lengthKm.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 3 })} unit="km" />
                <Spec label={t('cir.corners')} value={String(info.corners)} />
                <Spec label={t('cir.distance')} value={info.raceDistanceKm.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} unit="km" />
              </div>
              <div className="flex items-center justify-between gap-3 mt-3 rounded-xl bg-surface-container-low p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Timer className="w-6 h-6 text-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="type-label-telemetry uppercase text-text-muted tracking-wider">{t('cir.record')}</p>
                    {info.lapRecord ? (
                      <p className="type-body-md font-semibold text-text-primary truncate">
                        <span className="font-black">{info.lapRecord.time}</span> • {info.lapRecord.driver} ({info.lapRecord.year})
                      </p>
                    ) : (
                      <p className="type-body-md text-text-secondary">{t('cir.noRecord')}</p>
                    )}
                  </div>
                </div>
                <span className="type-label-telemetry uppercase text-racing-red shrink-0">{t('cir.since', { year: info.firstGrandPrix })}</span>
              </div>
            </section>
          )}

          {/* FRENAGEM, DRS E PNEUS */}
          {info && (
            <section className="px-margin space-y-3">
              {info.brakingZones.length > 0 && (
                <>
                  <BarTitle>{t('cir.braking')}</BarTitle>
                  <ListGroup>
                    {info.brakingZones.map((zone) => (
                      <div key={`${zone.turn}-${zone.name}`} className="p-3">
                        <div className="flex items-baseline gap-2">
                          <span className="type-label-badge text-racing-red font-bold">{zone.turn}</span>
                          <span className="type-body-md font-bold text-text-primary">{zone.name}</span>
                        </div>
                        <p className="type-body-sm text-text-secondary mt-1">{lang === 'en' ? zone.en : zone.pt}</p>
                      </div>
                    ))}
                  </ListGroup>
                </>
              )}
              {info.drsZones.length > 0 && (
                <div className="rounded-xl bg-surface-container-low p-3">
                  <p className="type-label-telemetry uppercase text-text-muted tracking-wider mb-1.5">{t('cir.drs')}</p>
                  <ul className="space-y-1">
                    {info.drsZones.map((zone, i) => (
                      <li key={i} className="type-body-sm text-text-secondary flex gap-2"><span className="text-racing-red">▸</span>{lang === 'en' ? zone.en : zone.pt}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-xl bg-surface-container-low p-3">
                <p className="type-label-telemetry uppercase text-text-muted tracking-wider mb-1.5">{t('cir.tyres')}</p>
                <p className="type-body-sm text-text-secondary">{lang === 'en' ? info.tyreStrategyNote.en : info.tyreStrategyNote.pt}</p>
              </div>
            </section>
          )}

          {!info && (
            <section className="px-margin">
              <EmptyState icon={MapPin} title={t('cir.noInfo')} hint={t('cir.noInfoHint')} />
            </section>
          )}
        </div>

        <div className="lg:col-span-5 space-y-space-lg mt-space-lg lg:mt-0">
          {/* CRONOGRAMA */}
          <section className="px-margin">
            <div className="flex items-end justify-between gap-2">
              <BarTitle>{t('cir.schedule')}</BarTitle>
              <span className="type-label-telemetry uppercase text-text-muted text-right shrink-0">{t('cir.localTime', { tz: timeZoneLabel(start) })}</span>
            </div>
            {sessions.length > 0 ? (
              <ListGroup className="mt-2">
                {sessions.map((session) => <SessionRow key={session.kind} session={session} lang={lang} label={t(SESSION_LABEL[session.kind])} />)}
              </ListGroup>
            ) : (
              <ListGroup className="mt-2">
                <SessionRow
                  session={{ kind: 'race', startsAt: timed ? (race.startsAt as string) : `${race.date}T12:00:00` }}
                  lang={lang}
                  label={t('ses.race')}
                  dateOnly={!timed}
                />
              </ListGroup>
            )}
          </section>

          {/* RESULTADO */}
          {race.status === 'completed' && (
            <section className="px-margin">
              <BarTitle>{t('cir.result')}</BarTitle>
              {results.status === 'loading' && <Skeleton className="h-48 mt-2" />}
              {results.data && highlights && (
                <>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Highlight label={t('cir.pole')} name={highlights.pole?.driverName} sub={highlights.pole?.teamName} />
                    <Highlight label={t('cir.fastest')} name={highlights.fastestLap?.driverName} sub={highlights.fastestLap?.fastestLapTime ?? undefined} />
                  </div>
                  <ListGroup className="mt-3">
                    {results.data.slice(0, 10).map((row) => {
                      const driver = findCategoryDriver(category, row.driverName);
                      const body = (
                        <>
                          <span className={cn('w-7 text-center type-body-md font-black', row.position === '1' ? 'text-racing-red' : 'text-text-secondary')}>{row.position}</span>
                          <div className="min-w-0 flex-1">
                            <p className="type-body-md font-bold text-text-primary truncate">{row.driverName}</p>
                            <p className="type-label-telemetry uppercase text-text-muted truncate">{row.teamName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="type-label-badge text-text-secondary">{row.time || row.status}</p>
                            {row.points > 0 && <p className="type-label-telemetry text-racing-red">+{row.points}</p>}
                          </div>
                        </>
                      );
                      return driver ? (
                        <Link key={row.position + row.driverCode} to={paths.driver(category.id, driver.id)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container/40 transition-colors">{body}</Link>
                      ) : (
                        <div key={row.position + row.driverCode} className="flex items-center gap-3 px-3 py-2.5">{body}</div>
                      );
                    })}
                  </ListGroup>
                </>
              )}
              {results.status !== 'loading' && !results.data && (
                <div className="mt-2 rounded-xl bg-surface-container-low p-4">
                  <p className="type-label-telemetry uppercase text-text-muted tracking-wider">{t('cir.winner')}</p>
                  <p className="type-headline-sm uppercase text-text-primary mt-1">{race.winner ?? t('cir.noResult')}</p>
                </div>
              )}
            </section>
          )}

          {upcoming && (
            <section className="px-margin">
              <button type="button" onClick={saveToCalendar} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-racing-red text-white type-label-badge uppercase tracking-wider glow-red active:scale-[0.98] transition-transform">
                <CalendarPlus className="w-[18px] h-[18px]" />{t('cir.saveCalendar')}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function BarTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1 h-5 rounded-full bg-racing-red" aria-hidden />
      <h2 className="type-headline-md italic uppercase font-black text-text-primary tracking-tight">{children}</h2>
    </div>
  );
}

function Spec({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="min-w-0">
      <p className="type-label-telemetry uppercase text-text-muted tracking-wider">{label}</p>
      <p className="mt-1 leading-none">
        <span className="type-headline-md font-black text-text-primary">{value}</span>
        {unit && <span className="type-body-sm text-text-muted ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function Highlight({ label, name, sub }: { label: string; name?: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-3 min-w-0">
      <p className="type-label-telemetry uppercase text-text-muted tracking-wider">{label}</p>
      <p className="type-body-md font-bold text-text-primary truncate mt-1">{name ?? '—'}</p>
      {sub && <p className="type-label-telemetry text-text-muted truncate">{sub}</p>}
    </div>
  );
}

function WeatherTiles({ weather }: { weather: RaceWeather }) {
  const { t } = useT();
  const Icon = WEATHER_ICON[weather.condition];
  const rainTone = weather.rainChance >= 60 ? 'text-racing-red' : weather.rainChance >= 30 ? 'text-secondary' : 'text-tertiary';
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center justify-between text-text-muted">
          <span className="type-label-telemetry uppercase tracking-wider">{t('cir.temp')}</span>
          <Icon className="w-4 h-4" />
        </div>
        <p className="mt-1.5 leading-none"><span className="type-headline-lg font-black text-text-primary">{Math.round(weather.temperatureMax)}</span><span className="type-body-sm text-text-muted">°C</span></p>
        <p className="type-label-telemetry uppercase text-text-muted mt-1">{t(`cir.cond.${weather.condition}`)}</p>
      </div>
      <div className="rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center justify-between text-text-muted">
          <span className="type-label-telemetry uppercase tracking-wider">{t('cir.rain')}</span>
          <Droplets className="w-4 h-4" />
        </div>
        <p className="mt-1.5 leading-none"><span className="type-headline-lg font-black text-text-primary">{Math.round(weather.rainChance)}</span><span className="type-body-sm text-text-muted">%</span></p>
        <p className={cn('type-label-telemetry uppercase mt-1', rainTone)}>{weather.rainChance >= 60 ? t('cir.rainHigh') : weather.rainChance >= 30 ? t('cir.rainMid') : t('cir.rainLow')}</p>
      </div>
      <div className="rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center justify-between text-text-muted">
          <span className="type-label-telemetry uppercase tracking-wider">{t('cir.wind')}</span>
          <Wind className="w-4 h-4" />
        </div>
        <p className="mt-1.5 leading-none"><span className="type-headline-lg font-black text-text-primary">{Math.round(weather.windKmh)}</span><span className="type-body-sm text-text-muted">km/h</span></p>
        <p className="type-label-telemetry uppercase text-text-muted mt-1">{Math.round(weather.temperatureMin)}°C {t('cir.min')}</p>
      </div>
    </div>
  );
}

function SessionRow({ session, lang, label, dateOnly = false }: { session: RaceSession; lang: 'pt' | 'en'; label: string; dateOnly?: boolean }) {
  const date = new Date(session.startsAt);
  const isRace = session.kind === 'race';
  const past = date.getTime() < Date.now();
  return (
    <div className={cn('flex items-center gap-3 p-3', past && 'opacity-60')}>
      <div className={cn('w-11 shrink-0 rounded-lg py-1.5 text-center', isRace ? 'bg-racing-red text-white' : 'bg-surface-container-high text-text-primary')}>
        <p className="type-label-telemetry uppercase leading-none opacity-80">{weekdayShort(date, lang)}</p>
        <p className="type-headline-sm font-black leading-tight">{String(date.getDate()).padStart(2, '0')}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('type-body-md font-bold truncate', isRace ? 'text-text-primary' : 'text-text-secondary')}>{label}</p>
        {!dateOnly && <p className="type-label-telemetry text-text-muted">{timeOf(date, lang)}</p>}
      </div>
      {isRace && <span className="w-2 h-2 rounded-full bg-racing-red animate-pulse shrink-0" aria-hidden />}
    </div>
  );
}
