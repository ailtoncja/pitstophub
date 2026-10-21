import { useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarPlus, Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, MapPin, Share2, Sun, Timer } from 'lucide-react';
import { paths } from '../app/paths';
import { RaceChangeNote } from '../components/RaceChangeNote';
import { RaceSpotlight } from '../components/RaceSpotlight';
import { useToast } from '../components/Toast';
import { Button, EmptyState, FactList, ListGroup, SectionTitle, Skeleton } from '../components/ui';
import { getRaceCircuitInfo, type CircuitInfo } from '../circuit-info';
import { findCategoryDriver } from '../lib/entities';
import { useRaceResults } from '../lib/f1-hooks';
import { hasStartTime, raceTitle, timeOf, timeZoneLabel, weekdayShort } from '../lib/format';
import { useAsync, useScrollTopOn } from '../lib/hooks';
import { useT } from '../lib/i18n';
import { buildIcs, downloadIcs } from '../lib/ics';
import { raceChange } from '../lib/race-changes';
import { resolveRaceRoute, type RaceRoute } from '../lib/race-route';
import { raceHighlights, roundNumber } from '../lib/season';
import { useNow } from '../lib/useNow';
import { cn } from '../lib/utils';
import { fetchRaceWeather, weatherWindowOpen, type RaceWeather } from '../lib/weather';
import { raceStartDate } from '../race-time';
import { useCategory, useLiveData } from '../state/live-data';
import { MOTORSPORT_DATA, type RaceSession, type RaceSessionKind } from '../types';

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
  const now = useNow(30_000);
  const { ready } = useLiveData();
  const category = useCategory(categoryId);
  // O calendario ao vivo troca os ids do catalogo e nao lista etapas canceladas: o catalogo cobre esses links.
  const catalog = useMemo(() => MOTORSPORT_DATA.find((item) => item.id === categoryId)?.calendar ?? [], [categoryId]);
  const route = useMemo<RaceRoute>(() => {
    if (!category || !raceId) return { kind: 'missing' };
    return resolveRaceRoute(category.calendar, catalog, raceId);
  }, [category, catalog, raceId]);
  const race = route.kind === 'found' ? route.race : undefined;
  // Etapa cancelada -> substituta(s); substituta -> cancelada(s). Os pares ficam no catalogo.
  const change = useMemo(() => (race ? raceChange(catalog, race) : null), [catalog, race]);

  // Com a categoria: o tracado certo do lugar (oval x misto) e os dados do GP so na F1.
  const info = useMemo(() => (race ? getRaceCircuitInfo(race, category?.id) : null), [race, category?.id]);
  const results = useRaceResults(category, race);
  const highlights = useMemo(() => (results.data ? raceHighlights(results.data) : null), [results.data]);

  const hasCoords = race?.lat != null && race?.lng != null;
  const weatherEnabled = Boolean(race && hasCoords && race.status === 'upcoming' && weatherWindowOpen(race.date));
  const weather = useAsync(() => fetchRaceWeather(race!.lat!, race!.lng!, race!.date), [race?.id, race?.date], weatherEnabled);

  if (category && route.kind === 'redirect') {
    return <Navigate to={paths.race(category.id, route.raceId)} replace />;
  }

  if (!category || !race) {
    // Um id da fonte ao vivo (ex.: "r01-melbourne") so existe depois da sincronizacao: espera antes de dizer que nao existe.
    if (category && !ready) {
      return (
        <div className="px-margin lg:px-0 pt-6 space-y-4">
          <Skeleton className="h-72 lg:h-96" />
          <Skeleton className="h-40" />
        </div>
      );
    }
    return (
      <div className="px-margin lg:px-0 pt-6">
        <EmptyState title={t('cir.notFound')} action={<Button to={categoryId ? paths.calendarOf(categoryId) : paths.agenda}>{t('common.back')}</Button>} />
      </div>
    );
  }

  const start = raceStartDate(race);
  const timed = hasStartTime(race);
  const round = race.round ?? roundNumber(category.calendar, race);
  const sessions = race.sessions ?? [];
  const upcoming = race.status === 'upcoming';
  const cancelled = race.status === 'cancelled';
  // Etapa cancelada nao tem numero de rodada (o aviso "Etapa cancelada" ja esta no destaque acima).
  const stageLabel = !cancelled && round > 0 ? t('cir.stage', { n: round }) : null;
  const numberFormat = lang === 'pt' ? 'pt-BR' : 'en-US';
  const facts = info ? circuitFacts(info, t, numberFormat) : [];

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
    <div className="px-margin lg:px-0 pb-12 pt-3 lg:pt-8 page-in">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.calendarOf(category.id)))}
        className="inline-flex items-center gap-2 h-11 -ml-2 px-2 rounded-full text-silver hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="type-label-badge text-[0.875rem]">{category.name} · {t('cir.calendar', { year: race.date.slice(0, 4) })}</span>
      </button>

      <h1 className="sr-only">{raceTitle(race, lang)}</h1>
      <div className="mt-2 space-y-4">
        <RaceSpotlight
          race={race}
          categoryId={category.id}
          now={now}
          cancelNote={cancelled && change && change.kind !== 'replaces' ? <RaceChangeNote change={change} categoryId={category.id} /> : undefined}
        />

        {!cancelled && change?.kind === 'replaces' && (
          <p className="type-body-md text-silver">
            <RaceChangeNote change={change} categoryId={category.id} />
          </p>
        )}

        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap justify-between">
          <p className="type-body-md text-silver">
            {[stageLabel, info?.laps != null ? t('cir.laps', { n: info.laps }) : null, info?.direction ? (info.direction === 'clockwise' ? t('cir.clockwise') : t('cir.counterclockwise')) : null].filter(Boolean).join(' · ')}
          </p>
          <div className="flex items-center gap-2">
            {upcoming && (
              <Button variant="primary" onClick={saveToCalendar}>
                <CalendarPlus className="w-[18px] h-[18px]" /> {t('cir.saveCalendarShort')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => void share()}>
              <Share2 className="w-[18px] h-[18px]" /> {t('cir.share')}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-10 space-y-10 lg:space-y-0">
        <div className="lg:col-span-7 space-y-10 min-w-0">
          {(weather.data || weather.status === 'loading') && (
            <section className="space-y-3">
              <SectionTitle>{t('cir.forecast')}</SectionTitle>
              {weather.data ? <WeatherList weather={weather.data} /> : <Skeleton className="h-28" />}
            </section>
          )}

          {info && (
            <section className="space-y-3">
              <SectionTitle>{t('cir.layout')}</SectionTitle>
              {info.trackImage && (
                <figure className="space-y-2">
                  <div className="relative rounded-2xl bg-asphalt border border-hairline overflow-hidden aspect-[16/10] flex items-center justify-center">
                    <img src={info.trackImage} alt={race.circuit} className="w-full h-full object-contain p-4" loading="lazy" />
                  </div>
                  {info.osm && (
                    <figcaption className="type-label-telemetry text-silver-dim text-right">
                      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-white underline-offset-2 hover:underline">
                        {t('cir.osmCredit')}
                      </a>
                    </figcaption>
                  )}
                </figure>
              )}
              {facts.length > 0 && <FactList items={facts} />}
            </section>
          )}

          {info && (info.brakingZones?.length || info.tyreStrategyNote) && (
            <section className="space-y-4">
              {info.brakingZones && info.brakingZones.length > 0 && (
                <>
                  <SectionTitle>{t('cir.braking')}</SectionTitle>
                  <ListGroup>
                    {info.brakingZones.map((zone) => (
                      <div key={`${zone.turn}-${zone.name}`} className="p-4">
                        <p className="type-body-md font-bold text-white">
                          <span className="text-silver tabular mr-2">{zone.turn}</span>
                          {zone.name}
                        </p>
                        <p className="type-body-sm text-silver mt-1 max-w-[68ch]">{lang === 'en' ? zone.en : zone.pt}</p>
                      </div>
                    ))}
                  </ListGroup>
                </>
              )}
              {info.tyreStrategyNote && (
                <div className="space-y-2">
                  <h3 className="type-headline-sm text-white">{t('cir.tyres')}</h3>
                  <p className="type-body-md text-silver max-w-[68ch]">{lang === 'en' ? info.tyreStrategyNote.en : info.tyreStrategyNote.pt}</p>
                </div>
              )}
            </section>
          )}

          {!info && <EmptyState icon={MapPin} title={t('cir.noInfo')} hint={t('cir.noInfoHint')} />}
        </div>

        <div className="lg:col-span-5 space-y-10 min-w-0">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <SectionTitle>{t('cir.schedule')}</SectionTitle>
              <span className="type-body-sm text-silver text-right shrink-0">{t('cir.localTime', { tz: timeZoneLabel(start) })}</span>
            </div>
            {sessions.length > 0 ? (
              <ListGroup>
                {sessions.map((session) => <SessionRow key={session.kind} session={session} lang={lang} label={t(SESSION_LABEL[session.kind])} cancelled={cancelled} />)}
              </ListGroup>
            ) : (
              <ListGroup>
                <SessionRow
                  session={{ kind: 'race', startsAt: timed ? (race.startsAt as string) : `${race.date}T12:00:00` }}
                  lang={lang}
                  label={t('ses.race')}
                  dateOnly={!timed}
                  cancelled={cancelled}
                />
              </ListGroup>
            )}
          </section>

          {race.status === 'completed' && (
            <section className="space-y-3">
              <SectionTitle>{t('cir.result')}</SectionTitle>
              {results.status === 'loading' && <Skeleton className="h-48" />}
              {results.data && highlights && (
                <>
                  <FactList
                    items={[
                      { label: t('cir.pole'), value: [highlights.pole?.driverName, highlights.pole?.teamName].filter(Boolean).join(' · ') || '—' },
                      { label: t('cir.fastest'), value: [highlights.fastestLap?.driverName, highlights.fastestLap?.fastestLapTime].filter(Boolean).join(' · ') || '—' },
                    ]}
                  />
                  <ListGroup>
                    {results.data.slice(0, 10).map((row) => {
                      const driver = findCategoryDriver(category, row.driverName);
                      const body = (
                        <>
                          <span className={cn('w-7 type-headline-sm tabular', row.position === '1' ? 'text-white' : 'text-silver')}>{row.position}</span>
                          <div className="min-w-0 flex-1">
                            <p className="type-body-md font-semibold text-white truncate">{row.driverName}</p>
                            <p className="type-body-sm text-silver truncate">{row.teamName}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="type-label-badge text-silver tabular">{row.time || row.status}</p>
                            {row.points > 0 && <p className="type-label-telemetry text-tertiary tabular">+{row.points}</p>}
                          </div>
                        </>
                      );
                      return driver ? (
                        <Link key={row.position + row.driverCode} to={paths.driver(category.id, driver.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">{body}</Link>
                      ) : (
                        <div key={row.position + row.driverCode} className="flex items-center gap-3 px-4 py-3">{body}</div>
                      );
                    })}
                  </ListGroup>
                </>
              )}
              {results.status !== 'loading' && !results.data && (
                <FactList items={[{ label: t('cir.winner'), value: race.winner ?? t('cir.noResult') }]} />
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// So os dados que a ficha tem: fora da F1 (e nos circuitos desenhados) nao ha voltas, recorde etc.
function circuitFacts(info: CircuitInfo, t: ReturnType<typeof useT>['t'], numberFormat: string) {
  const items: { label: string; value: string }[] = [];
  if (info.lengthKm != null) items.push({ label: t('cir.length'), value: `${info.lengthKm.toLocaleString(numberFormat, { minimumFractionDigits: 3 })} km` });
  if (info.corners != null) items.push({ label: t('cir.corners'), value: String(info.corners) });
  if (info.raceDistanceKm != null) {
    items.push({ label: t('cir.distance'), value: `${info.raceDistanceKm.toLocaleString(numberFormat, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km` });
  }
  // A ficha do GP sempre diz o recorde (ou que a pista ainda nao tem um).
  if (info.laps != null) {
    items.push({ label: t('cir.record'), value: info.lapRecord ? `${info.lapRecord.time} · ${info.lapRecord.driver} (${info.lapRecord.year})` : t('cir.noRecord') });
  }
  if (info.firstGrandPrix != null) items.push({ label: t('cir.firstGp'), value: String(info.firstGrandPrix) });
  if (info.straightModeZones != null) items.push({ label: t('cir.straightMode'), value: String(info.straightModeZones) });
  return items;
}

function WeatherList({ weather }: { weather: RaceWeather }) {
  const { t } = useT();
  const Icon = WEATHER_ICON[weather.condition];
  const rainLabel = weather.rainChance >= 60 ? t('cir.rainHigh') : weather.rainChance >= 30 ? t('cir.rainMid') : t('cir.rainLow');
  return (
    <FactList
      items={[
        {
          label: t('cir.temp'),
          value: (
            <span className="inline-flex items-center gap-2">
              <Icon className="w-4 h-4 text-silver" aria-hidden />
              {Math.round(weather.temperatureMax)} °C <span className="text-silver font-medium">· {t(`cir.cond.${weather.condition}`)}</span>
            </span>
          ),
        },
        { label: t('cir.rain'), value: <>{Math.round(weather.rainChance)}% <span className="text-silver font-medium">· {rainLabel}</span></> },
        { label: t('cir.wind'), value: <>{Math.round(weather.windKmh)} km/h <span className="text-silver font-medium">· {Math.round(weather.temperatureMin)} °C {t('cir.min')}</span></> },
      ]}
    />
  );
}

function SessionRow({
  session,
  lang,
  label,
  dateOnly = false,
  cancelled = false,
}: {
  session: RaceSession;
  lang: 'pt' | 'en';
  label: string;
  dateOnly?: boolean;
  cancelled?: boolean;
}) {
  const date = new Date(session.startsAt);
  const isRace = session.kind === 'race';
  // Sessao de etapa cancelada nao vai acontecer: aparece apagada e sem o marcador de proxima largada.
  const past = cancelled || date.getTime() < Date.now();
  return (
    <div className={cn('flex items-center gap-4 px-4 py-3', past && 'opacity-60')}>
      <div className="w-12 shrink-0 text-center leading-none">
        <p className="type-label-telemetry text-silver">{weekdayShort(date, lang)}</p>
        <p className={cn('type-headline-md tabular mt-1', isRace ? 'text-white' : 'text-silver')}>{String(date.getDate()).padStart(2, '0')}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('type-body-md truncate', isRace ? 'font-bold text-white' : 'font-semibold text-silver')}>{label}</p>
      </div>
      {!dateOnly && <p className={cn('type-headline-sm tabular shrink-0', isRace ? 'text-white' : 'text-silver')}>{timeOf(date, lang)}</p>}
      {isRace && !past && <Timer className="w-4 h-4 text-racing-red shrink-0" aria-hidden />}
    </div>
  );
}
