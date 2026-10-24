import { useMemo, useState } from 'react';
import { MapPinOff, Wrench } from 'lucide-react';
import { timeZoneLabel } from '../lib/format';
import { useT } from '../lib/i18n';
import { cn } from '../lib/utils';
import { dayKm, rallyKeyNumbers, rallyStages, stageBaseName, stageClock, type RallyDay, type RallyInfo, type RallyMap, type RallyRoute, type RallySurface } from '../rally-info';
import { FactList, ListGroup, Segmented, SectionTitle } from './ui';

// Cor do piso: so a bolinha (marca de dado), nunca cor de texto ou de interface.
const SURFACE_COLOR: Record<RallySurface, string> = {
  gravel: '#c58b4c',
  tarmac: '#8a94a6',
  snow: '#bfe3ff',
  mixed: 'linear-gradient(90deg, #c58b4c 50%, #8a94a6 50%)',
};

const SURFACE_LABEL: Record<RallySurface, string> = {
  gravel: 'rally.surface.gravel',
  tarmac: 'rally.surface.tarmac',
  snow: 'rally.surface.snow',
  mixed: 'rally.surface.mixed',
};

type DayFilter = 'all' | string;

// Escala no canto superior direito (o inferior esquerdo costuma ser do parque de assistencia).
const SCALE_Y = 72;
const LAND = '#17171a';
const SEA = '#060607';

function weekday(date: string, lang: 'pt' | 'en', style: 'short' | 'long' = 'short'): string {
  // Meio-dia UTC: o dia da semana nao muda com o fuso de quem abre.
  const text = new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-GB', { weekday: style, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
  const clean = text.replace('.', '');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function dayOfMonth(date: string): string {
  return String(Number(date.slice(8, 10)));
}

function monthShortOf(date: string, lang: 'pt' | 'en'): string {
  return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-GB', { month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)).replace('.', '');
}

const linkClass = 'text-silver underline decoration-white/30 hover:decoration-white hover:text-white';

export function SurfaceTag({ surface }: { surface: RallySurface }) {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-2 h-8 px-3 rounded-full border border-hairline bg-asphalt type-label-badge text-white">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SURFACE_COLOR[surface] }} aria-hidden />
      <span className="sr-only">{t('rally.surfaceLabel')}:</span>
      {t(SURFACE_LABEL[surface])}
    </span>
  );
}

export function RallyCard({ info }: { info: RallyInfo }) {
  const { t, lang } = useT();
  const [day, setDay] = useState<DayFilter>('all');
  const numberFormat = lang === 'pt' ? 'pt-BR' : 'en-US';
  const km = (value: number) => `${value.toLocaleString(numberFormat, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
  const key = useMemo(() => rallyKeyNumbers(info), [info]);

  const activeRoutes = useMemo(() => {
    if (day === 'all') return null;
    const selected = info.days.find((d) => d.date === day);
    return new Set(selected?.stages.flatMap((stage) => (stage.routeId ? [stage.routeId] : [])) ?? []);
  }, [day, info.days]);

  const firstTimed = rallyStages(info).find((stage) => stage.startsAt)?.startsAt;
  const longest = key.longest[0];
  const map = info.map;

  const facts = (
    <FactList
      items={[
        { label: t('rally.stages'), value: String(key.count) },
        { label: t('rally.competitiveKm'), value: km(key.km) },
        {
          label: t('rally.longest'),
          value: longest ? (
            <>
              {km(key.longestKm)}
              <span className="block type-body-sm text-silver font-normal">
                {stageBaseName(longest.name)} · {key.longest.map((stage) => `SS${stage.number}`).join(` ${t('rally.and')} `)}
              </span>
            </>
          ) : t('rally.notPublished'),
        },
        {
          label: t('rally.powerStage'),
          value: key.powerStage ? (
            <>
              SS{key.powerStage.number} · {km(key.powerStage.km)}
              <span className="block type-body-sm text-silver font-normal">{stageBaseName(key.powerStage.name)}</span>
            </>
          ) : t('rally.notPublished'),
        },
        {
          label: t('rally.service'),
          value: info.servicePark ? <span className="type-body-sm font-semibold">{info.servicePark}</span> : <span className="text-silver font-medium">{t('rally.notPublished')}</span>,
        },
      ]}
    />
  );

  return (
    <section className="space-y-4" aria-labelledby="rally-map-title" data-rally={info.id}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 id="rally-map-title" className="type-headline-md text-white">{t(map ? 'rally.title' : 'rally.titleNoMap')}</h2>
        <SurfaceTag surface={info.surface} />
      </div>

      {map ? (
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 space-y-4 lg:space-y-0">
          <div className="lg:col-span-8 min-w-0 space-y-3">
            <Segmented<DayFilter>
              value={day}
              onChange={setDay}
              options={[
                { value: 'all', label: t('rally.allDays') },
                ...info.days.map((d) => ({ value: d.date, label: `${weekday(d.date, lang)} ${dayOfMonth(d.date)}` })),
              ]}
            />
            <RallyMapView info={info} map={map} active={activeRoutes} />
          </div>
          <div className="lg:col-span-4 min-w-0 space-y-3">{facts}</div>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 space-y-4 lg:space-y-0">
          <div className="lg:col-span-7 min-w-0">{facts}</div>
          <div className="lg:col-span-5 min-w-0 flex flex-col items-center justify-center text-center gap-2 px-6 py-8 rounded-2xl bg-asphalt border border-hairline" data-rally-nomap>
            <MapPinOff className="w-8 h-8 text-silver-dim" aria-hidden />
            <p className="type-headline-sm text-white">{t('rally.noMap')}</p>
            <p className="type-body-sm text-silver max-w-xs">{info.mapNote ? info.mapNote[lang] : t('rally.noMapHint')}</p>
          </div>
        </div>
      )}

      <div className="space-y-3 pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <SectionTitle>{t('rally.itinerary')}</SectionTitle>
          {firstTimed && <span className="type-body-sm text-silver text-right shrink-0">{t('cir.localTime', { tz: timeZoneLabel(new Date(firstTimed)) })}</span>}
        </div>
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4 md:items-start">
          {info.days.map((d) => (
            <DayColumn key={d.date} day={d} km={km} lang={lang} selected={day === d.date} />
          ))}
        </div>
        <p className="type-body-sm text-silver-dim max-w-[68ch]">
          {info.itinerarySecondary
            ? t('rally.itinerarySecondary')
            : info.itineraryVersion
              ? t('rally.itineraryNote', { v: info.itineraryVersion })
              : t('rally.itineraryNoteNoVersion')}
          {!firstTimed && ` ${t('rally.noTimes')}`}
        </p>
        <details className="group">
          <summary className="inline-flex items-center h-11 type-label-badge text-silver hover:text-white cursor-pointer select-none">{t('rally.sources')}</summary>
          <ul className="space-y-1.5 pb-2">
            {info.sources.map((source) => (
              <li key={source.url + source.label} className="type-body-sm">
                <a href={source.url} target="_blank" rel="noreferrer noopener" className={linkClass}>
                  {source.label}
                </a>
                {source.secondary && <span className="text-silver-dim"> · {t('rally.secondary')}</span>}
              </li>
            ))}
            {map?.usesOsm && (
              <li className="type-body-sm">
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener" className={linkClass}>
                  {t('rally.osmSource')}
                </a>
              </li>
            )}
          </ul>
        </details>
      </div>
    </section>
  );
}

function DayColumn({ day, km, lang, selected }: { day: RallyDay; km: (value: number) => string; lang: 'pt' | 'en'; selected: boolean }) {
  const { t } = useT();
  return (
    <ListGroup className={cn('transition-colors duration-200', selected && 'border-white/40')}>
      <div className="px-4 py-3">
        <p className="type-headline-sm text-white">
          {weekday(day.date, lang, 'long')}, {dayOfMonth(day.date)} {monthShortOf(day.date, lang)}
        </p>
        <p className="type-body-sm text-silver tabular">
          {day.stages.length === 0
            ? t('rally.dayNoStages')
            : t(day.stages.length === 1 ? 'rally.dayTotalsOne' : 'rally.dayTotals', { n: day.stages.length, km: km(dayKm(day)) })}
        </p>
      </div>
      {day.shakedown && (
        <div className="flex items-baseline gap-3 px-4 py-2.5">
          <span className="w-9 shrink-0 type-label-badge text-silver-dim tabular">SD</span>
          <div className="min-w-0 flex-1">
            <p className="type-body-sm text-silver truncate">{day.shakedown.name}</p>
            <p className="type-label-telemetry text-silver-dim">
              {t('rally.shakedown')}
              {day.shakedown.km != null && ` · ${km(day.shakedown.km)}`}
            </p>
          </div>
          {day.shakedown.startsAt && <StageTime iso={day.shakedown.startsAt} rallyDate={day.date} lang={lang} className="text-silver-dim" />}
        </div>
      )}
      {day.stages.map((stage) => (
        <div key={stage.number} className="flex items-baseline gap-3 px-4 py-2.5">
          <span className="w-9 shrink-0 type-label-badge text-silver tabular">SS{stage.number}</span>
          <div className="min-w-0 flex-1">
            <p className="type-body-sm text-white font-semibold">{stage.name}</p>
            <p className="type-label-telemetry text-silver tabular">
              {km(stage.km)}
              {stage.powerStage && (
                <span className="ml-2 inline-flex items-center h-5 px-2 rounded-full bg-white text-black type-label-badge">{t('rally.powerStage')}</span>
              )}
            </p>
          </div>
          {stage.startsAt && <StageTime iso={stage.startsAt} rallyDate={day.date} lang={lang} className="text-white" />}
        </div>
      ))}
    </ListGroup>
  );
}

/** Horario no fuso do visitante; se cair em outro dia que o do itinerario, mostra o dia da semana antes. */
function StageTime({ iso, rallyDate, lang, className }: { iso: string; rallyDate: string; lang: 'pt' | 'en'; className: string }) {
  const { time, day } = stageClock(iso, rallyDate, lang);
  return (
    <span className={cn('type-label-badge tabular shrink-0 text-right', className)}>
      {day && <span className="text-silver font-normal mr-1">{day}</span>}
      {time}
    </span>
  );
}

function RallyMapView({ info, map, active }: { info: RallyInfo; map: RallyMap; active: Set<string> | null }) {
  const { t, lang } = useT();
  const pct = (x: number, y: number) => ({ left: `${(x / map.width) * 100}%`, top: `${(y / map.height) * 100}%` });
  const isOn = (route: RallyRoute) => !active || active.has(route.id);
  const powerRoutes = new Set(info.days.flatMap((d) => d.stages.filter((s) => s.powerStage && s.routeId).map((s) => s.routeId as string)));
  const scaleX = map.width - 28 - map.scaleBar.px;
  const hasCoast = map.land.length > 0;

  return (
    <figure className="rounded-2xl bg-asphalt border border-hairline overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: `${map.width} / ${map.height}` }}>
        <svg viewBox={`0 0 ${map.width} ${map.height}`} className="absolute inset-0 w-full h-full" role="img" aria-label={t('rally.mapAlt')}>
          <rect width={map.width} height={map.height} fill={hasCoast ? SEA : LAND} />
          {hasCoast && <path d={map.land} fill={LAND} fillRule="evenodd" stroke="rgba(255,255,255,0.16)" strokeWidth={1} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}

          {/* Linhas-guia dos rotulos */}
          {map.routes.map((route) => (
            <line
              key={`lead-${route.id}`}
              x1={route.leaderFrom[0]}
              y1={route.leaderFrom[1]}
              x2={route.labelAt[0]}
              y2={route.labelAt[1]}
              stroke="white"
              strokeOpacity={isOn(route) ? 0.35 : 0}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Escala */}
          <g transform={`translate(${scaleX} ${SCALE_Y})`}>
            <line x1={0} y1={0} x2={map.scaleBar.px} y2={0} stroke="#b9b9c0" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={-5} x2={0} y2={5} stroke="#b9b9c0" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            <line x1={map.scaleBar.px} y1={-5} x2={map.scaleBar.px} y2={5} stroke="#b9b9c0" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          </g>

          {/* Especiais */}
          {map.routes.map((route) => (
            <g key={route.id} opacity={isOn(route) ? 1 : 0.22} className="transition-opacity duration-200">
              {route.path && (
                <>
                  <path d={route.path} fill="none" stroke="#000" strokeOpacity={0.6} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  <path d={route.path} fill="none" stroke="#fff" strokeWidth={powerRoutes.has(route.id) ? 3.5 : 2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                </>
              )}
              <circle cx={route.start[0]} cy={route.start[1]} r={7} fill="#fff" stroke="#000" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
              <circle cx={route.finish[0]} cy={route.finish[1]} r={6} fill="#000" stroke="#fff" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </g>
          ))}
        </svg>

        {/* Rotulos em HTML: tamanho de texto fixo (12 px) em qualquer largura de tela */}
        {map.towns.map((town) => (
          <span key={town.name} className="absolute -translate-x-1/2 -translate-y-1/2 type-label-telemetry text-silver-dim whitespace-nowrap pointer-events-none" style={pct(town.x, town.y)}>
            {town.name}
          </span>
        ))}

        {map.routes.map((route) => (
          <span
            key={`label-${route.id}`}
            className={cn(
              'absolute -translate-y-1/2 inline-flex items-center h-5 px-1.5 rounded-full type-label-badge tabular whitespace-nowrap pointer-events-none transition-opacity duration-200',
              route.anchor === 'left' && 'translate-x-0',
              route.anchor === 'right' && '-translate-x-full',
              route.anchor === 'center' && '-translate-x-1/2',
              powerRoutes.has(route.id) ? 'bg-white text-black' : 'bg-black/80 text-white border border-white/25',
              isOn(route) ? 'opacity-100' : 'opacity-0',
            )}
            style={pct(route.labelAt[0], route.labelAt[1])}
          >
            {route.label}
          </span>
        ))}

        {map.servicePark && (
          <>
            <span
              className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-white text-black flex items-center justify-center pointer-events-none"
              style={pct(map.servicePark.x, map.servicePark.y)}
              aria-hidden
            >
              <Wrench className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
            <span
              className={cn(
                'absolute -translate-x-1/2 type-label-telemetry text-white whitespace-nowrap pointer-events-none [text-shadow:0_1px_4px_rgba(0,0,0,.9)]',
                map.serviceLabel === 'above' ? 'translate-y-[calc(-100%-16px)]' : 'translate-y-4',
              )}
              data-service-label={map.serviceLabel}
              style={pct(map.servicePark.x, map.servicePark.y)}
            >
              {t('rally.serviceShort')}
            </span>
          </>
        )}

        <span
          className="absolute type-label-telemetry text-silver tabular pointer-events-none"
          style={{ left: `${(scaleX / map.width) * 100}%`, top: `calc(${(SCALE_Y / map.height) * 100}% - 22px)` }}
        >
          {map.scaleBar.km} km
        </span>
      </div>

      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 border-t border-hairline-soft type-label-telemetry text-silver">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-black" aria-hidden /> {t('rally.start')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-black border-2 border-white" aria-hidden /> {t('rally.finish')}
        </span>
        {map.servicePark && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-[3px] bg-white" aria-hidden /> {t('rally.service')}
          </span>
        )}
        <span className="text-silver-dim">
          {map.geometry === 'route' ? t('rally.routeNote') : t('rally.pointsNote')}
          {info.mapNote && ` ${info.mapNote[lang]}`}
        </span>
        {map.usesOsm && (
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener" className="ml-auto text-silver-dim hover:text-white">
            © OpenStreetMap
          </a>
        )}
      </figcaption>
    </figure>
  );
}
