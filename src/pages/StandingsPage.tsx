import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ListOrdered, Minus } from 'lucide-react';
import { paths } from '../app/paths';
import { EmptyState, ProgressBar, PillStrip, Segmented, Skeleton } from '../components/ui';
import { findCategoryDriver, findCategoryTeam } from '../lib/entities';
import { useStandingsMovement } from '../lib/f1-hooks';
import { formatPoints, pad2, signed } from '../lib/format';
import { useT } from '../lib/i18n';
import { buildStandingRows, pointsByDriver, pointsByTeam, teamWins, winsOf, type StandingRow } from '../lib/season';
import { completedRounds, totalRounds } from '../lib/categories-meta';
import { cn } from '../lib/utils';
import { useLiveData } from '../state/live-data';
import { useSettings } from '../state/settings';
import type { Category, StandingItem } from '../types';

type TabKey = string;
type Tab = { key: TabKey; label: string; items: StandingItem[]; kind: 'driver' | 'team' };

const hasStandings = (category: Category) => buildTabs(category, (k) => k).length > 0;

function buildTabs(category: Category, t: (key: string) => string): Tab[] {
  const s = category.standings;
  if (!s) return [];
  const tabs: Tab[] = [];
  if (s.drivers?.length) tabs.push({ key: 'drivers', label: t('st.drivers'), items: s.drivers, kind: 'driver' });
  if (s.constructors?.length) tabs.push({ key: 'constructors', label: t('st.constructors'), items: s.constructors, kind: 'team' });
  if (s.teams?.length) tabs.push({ key: 'teams', label: t('st.teams'), items: s.teams, kind: 'team' });
  for (const group of s.driverClasses ?? []) {
    if (group.entries.length) tabs.push({ key: `class:${group.classLabel}`, label: group.classLabel, items: group.entries, kind: 'driver' });
  }
  return tabs;
}

const COLLAPSED = 15;

export default function StandingsPage() {
  const { t, lang } = useT();
  const { categories, ready } = useLiveData();
  const settings = useSettings();
  const [params, setParams] = useSearchParams();

  const available = useMemo(() => categories.filter(hasStandings), [categories]);
  const requested = params.get('c');
  const categoryId =
    available.find((c) => c.id === requested)?.id ??
    available.find((c) => c.id === settings.prefs.favoriteCategoryId)?.id ??
    available.find((c) => c.id === 'f1')?.id ??
    available[0]?.id;
  const category = categories.find((c) => c.id === categoryId);

  const [tabChoice, setTabChoice] = useState<TabKey | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setTabChoice(null);
    setExpanded(false);
  }, [categoryId]);

  const tabs = useMemo(() => (category ? buildTabs(category, t) : []), [category, t]);
  const tab = tabs.find((x) => x.key === tabChoice) ?? tabs[0];

  const movement = useStandingsMovement(category);
  const previousItems = tab
    ? tab.key === 'drivers'
      ? movement.previous.data?.drivers
      : tab.key === 'constructors'
        ? movement.previous.data?.constructors
        : null
    : null;
  const lastPoints = useMemo(() => {
    const rows = movement.lastRace.data;
    if (!rows || !tab) return null;
    if (tab.key === 'drivers') return pointsByDriver(rows);
    if (tab.key === 'constructors') return pointsByTeam(rows);
    return null;
  }, [movement.lastRace.data, tab]);

  const rows = useMemo(() => (tab ? buildStandingRows(tab.items, previousItems, lastPoints) : []), [tab, previousItems, lastPoints]);
  const visible = expanded ? rows : rows.slice(0, COLLAPSED);

  const options = available.map((c) => ({ value: c.id, label: c.name }));
  const selectCategory = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('c', id);
    setParams(next, { replace: true });
    settings.setFavoriteCategory(id);
  };

  return (
    <div className="flex flex-col w-full px-margin pb-6 gap-space-md page-in">
      <h1 className="sr-only">{t('nav.standings')}</h1>
      {options.length > 0 && <PillStrip options={options} value={categoryId ?? ''} onChange={selectCategory} className="pt-space-xs" />}

      {!category || !tab ? (
        !ready ? (
          <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>
        ) : (
          <EmptyState icon={ListOrdered} title={t('st.unavailable')} hint={t('st.unavailableHint')} />
        )
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg space-y-space-md lg:space-y-0">
          <div className="lg:col-span-5 space-y-space-md">
            {tabs.length > 1 && (
              <Segmented options={tabs.map((x) => ({ value: x.key, label: x.label }))} value={tab.key} onChange={setTabChoice} />
            )}
            {rows[0] && <LeaderCard category={category} tab={tab} row={rows[0]} second={rows[1]} />}
          </div>

          <div className="lg:col-span-7 space-y-space-md">
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <ListOrdered className="w-[18px] h-[18px] text-racing-red" />
                <h2 className="type-headline-sm uppercase text-text-primary tracking-wide">{t('st.official')}</h2>
              </div>
              <span className="type-label-telemetry text-text-muted uppercase tracking-wider">
                {t('st.stage', { done: completedRounds(category), total: totalRounds(category) })}
              </span>
            </div>

            <ol className="flex flex-col gap-2">
              {visible.map((row, index) => (
                <StandingRowItem key={`${row.name}-${index}`} category={category} tab={tab} row={row} lastRaceName={movement.lastRaceName} />
              ))}
            </ol>

            {rows.length > COLLAPSED && (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full py-2.5 rounded-lg text-text-muted hover:text-text-primary type-label-badge uppercase tracking-wider transition-all">
                {expanded ? t('common.showLess') : t('st.showAll', { n: rows.length })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function entityPath(category: Category, tab: Tab, name: string): string | null {
  if (tab.kind === 'driver') {
    const driver = findCategoryDriver(category, name);
    return driver ? paths.driver(category.id, driver.id) : null;
  }
  const team = findCategoryTeam(category, name);
  return team ? paths.team(category.id, team.id) : null;
}

function LeaderCard({ category, tab, row, second }: { category: Category; tab: Tab; row: StandingRow; second?: StandingRow }) {
  const { t } = useT();
  const driver = tab.kind === 'driver' ? findCategoryDriver(category, row.name) : undefined;
  const team = tab.kind === 'team' ? findCategoryTeam(category, row.name) : undefined;
  const wins = tab.kind === 'driver' ? winsOf(category, driver?.name ?? row.name).length : team ? teamWins(category, team.id).length : 0;
  const lead = second ? second.gap : 0;
  const remaining = Math.max(0, totalRounds(category) - completedRounds(category));
  const to = entityPath(category, tab, row.name);
  const badge = driver?.number ? `#${driver.number}` : `P${row.position}`;

  const body = (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-racing-red/15 via-surface-container-lowest to-surface-container-lowest border border-surface-border p-space-md">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#1a0a0a] border border-racing-red/60 type-label-telemetry uppercase text-racing-red font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-racing-red" />
          {t('st.leaderTag')}
        </span>
        <span className="type-telemetry-counter text-racing-red font-black leading-none italic">{badge}</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="type-headline-lg text-text-primary break-words leading-[1.05]">{row.name}</h3>
          <p className="type-body-sm text-text-muted truncate mt-0.5">{[row.team ?? team?.car, driver ? team?.name ?? '' : ''].filter(Boolean).join(' • ') || category.name}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="type-telemetry-counter text-white leading-none text-[32px]">{formatPoints(row.points)}</div>
          <div className="type-label-telemetry uppercase text-text-muted tracking-wider mt-1">{t('st.totalPoints')}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 rounded-lg bg-surface-container-lowest/80 py-2.5 text-center">
        <Mini value={pad2(wins)} label={t('st.wins')} />
        <Mini value={lead ? `+${formatPoints(lead)}` : '—'} label={t('st.lead')} tone="text-tertiary" />
        <Mini value={pad2(remaining)} label={t('st.remaining')} />
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

function Mini({ value, label, tone = 'text-text-primary' }: { value: string; label: string; tone?: string }) {
  return (
    <div>
      <div className={cn('type-telemetry-counter text-[18px] leading-none', tone)}>{value}</div>
      <div className="type-label-telemetry uppercase text-text-muted mt-1">{label}</div>
    </div>
  );
}

function StandingRowItem({ category, tab, row, lastRaceName }: { category: Category; tab: Tab; row: StandingRow; lastRaceName: string | null }) {
  const { t } = useT();
  const to = entityPath(category, tab, row.name);
  const podium = row.position <= 3;
  const driver = tab.kind === 'driver' ? findCategoryDriver(category, row.name) : undefined;
  const team = tab.kind === 'team' ? findCategoryTeam(category, row.name) : undefined;
  const sub = tab.kind === 'driver' ? row.team ?? row.extra : team?.car ?? team?.class;

  const content = (
    <div className={cn('relative overflow-hidden flex items-center justify-between gap-3 rounded-xl bg-surface-container-lowest/60 pl-0 pr-3 py-2.5 border-l-[3px] hover:bg-surface-raised/60 transition-colors', podium ? 'border-racing-red' : 'border-surface-border')}>
      <div className="flex items-center gap-3 min-w-0 pl-3">
        <span className={cn('w-7 text-center type-telemetry-counter text-[14px] font-bold', row.position === 1 ? 'text-racing-red' : 'text-text-muted')}>{pad2(row.position)}</span>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="type-headline-sm text-white truncate text-[15px]">{row.name}</span>
            <Delta delta={row.delta} />
          </div>
          <span className="text-[11px] text-text-muted truncate">{[sub, driver?.number ? `#${driver.number}` : null].filter(Boolean).join(' · ')}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="type-telemetry-counter text-[15px] font-bold text-white">
          {formatPoints(row.points)} <span className="text-[11px] font-normal text-text-muted">{t('st.pts')}</span>
        </div>
        {row.lastRacePoints != null && row.lastRacePoints > 0 ? (
          <span className="type-label-telemetry text-tertiary font-medium">
            +{formatPoints(row.lastRacePoints)} {t('st.pts')}{lastRaceName ? ` · ${shortRaceName(lastRaceName)}` : ''}
          </span>
        ) : (
          <span className="type-label-telemetry text-text-muted">{row.gap > 0 ? signed(-row.gap) : t('st.leaderShort')}</span>
        )}
      </div>
      <ProgressBar value={row.share * 100} className="absolute inset-x-0 bottom-0 h-[2px] rounded-none bg-transparent" barClassName={podium ? 'bg-racing-red/70' : 'bg-surface-bright'} />
    </div>
  );
  return <li>{to ? <Link to={to} className="block">{content}</Link> : content}</li>;
}

/** "Singapore Grand Prix" -> "Singapore" (cabe na linha de pontos). */
function shortRaceName(name: string): string {
  return name.replace(/\s*(Grand Prix|GP)$/i, '').replace(/^(GP (de|da|do|dos|das) )/i, '');
}

function Delta({ delta }: { delta: number | null }) {
  if (delta == null) return null;
  if (delta > 0) return <ArrowUp className="w-3.5 h-3.5 text-tertiary" aria-label={`+${delta}`} />;
  if (delta < 0) return <ArrowDown className="w-3.5 h-3.5 text-error" aria-label={`${delta}`} />;
  return <Minus className="w-3.5 h-3.5 text-text-muted" aria-hidden />;
}
