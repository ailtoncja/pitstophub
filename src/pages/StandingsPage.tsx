import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Info, ListOrdered, Minus } from 'lucide-react';
import { paths } from '../app/paths';
import { EmptyState, Segmented, Skeleton } from '../components/ui';
import { findCategoryDriver, findCategoryTeam } from '../lib/entities';
import { useStandingsMovement } from '../lib/f1-hooks';
import { formatPoints, pad2, signed } from '../lib/format';
import { useT } from '../lib/i18n';
import { scoringRuleIndex } from '../lib/rules';
import { buildStandingRows, pointsByDriver, pointsByTeam, teamWins, winsOf, type StandingRow } from '../lib/season';
import { completedRounds, totalRounds } from '../lib/categories-meta';
import { cn } from '../lib/utils';
import { flagForNationality } from '../nationality-flags';
import { useCategory, useLiveData } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import type { Category, StandingItem } from '../types';

type TabKey = string;
type Tab = { key: TabKey; label: string; items: StandingItem[]; kind: 'driver' | 'team' };

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

const COLLAPSED = 10;

export default function StandingsPage() {
  const { t } = useT();
  const { ready } = useLiveData();
  const { selectedId } = useSelectedCategory();
  const category = useCategory(selectedId);

  const [tabChoice, setTabChoice] = useState<TabKey | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setTabChoice(null);
    setExpanded(false);
  }, [selectedId]);

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
  const season = category?.calendar[0]?.date.slice(0, 4);
  const pointsRule = category ? scoringRuleIndex(category.rulesFormat ?? []) : null;

  return (
    <div className="flex flex-col w-full px-margin pt-6 pb-6 gap-space-lg page-in">
      <header className="space-y-2">
        <h1 className="type-headline-lg text-[34px] leading-9 uppercase text-on-surface">{t('st.title')}</h1>
        <p className="type-label-badge uppercase tracking-widest text-on-surface-variant">{[category?.name, season && t('home.season', { year: season })].filter(Boolean).join(' • ')}</p>
        {category && pointsRule != null && (
          <Link
            to={paths.rules(category.id, pointsRule)}
            className="mt-1 inline-flex items-center gap-2 rounded-sm bg-surface-container-high border border-hairline px-3.5 py-2.5 type-label-badge uppercase text-on-surface hover:bg-surface-container-highest"
          >
            <Info className="w-[18px] h-[18px] text-primary" />
            {t('st.howPoints')}
          </Link>
        )}
      </header>

      {!category || !tab ? (
        !ready || !category ? (
          <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>
        ) : (
          <EmptyState icon={ListOrdered} title={t('st.unavailable')} hint={t('st.unavailableHint')} />
        )
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-space-lg space-y-space-lg lg:space-y-0">
          <div className="lg:col-span-5 space-y-space-lg">
            {tabs.length > 1 && (
              <Segmented className="w-fit" options={tabs.map((x) => ({ value: x.key, label: x.label }))} value={tab.key} onChange={setTabChoice} />
            )}
            {rows[0] && <LeaderCard category={category} tab={tab} row={rows[0]} />}
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="type-label-badge uppercase tracking-widest text-on-surface-variant">{t('st.official')}</h2>
              <span className="type-label-badge text-on-surface-variant uppercase">{t('st.stage', { done: completedRounds(category), total: totalRounds(category) })}</span>
            </div>

            <div className="rounded-lg border border-hairline overflow-hidden">
              <div className="grid grid-cols-[2.25rem_1fr_auto] items-center bg-asphalt pl-2 pr-3 py-3 type-label-badge uppercase tracking-widest text-on-surface-variant border-b border-hairline">
                <span>{t('st.pos')}</span>
                <span>{tab.kind === 'driver' ? t('st.driverTeam') : t('st.team')}</span>
                <span>{t('st.pts')}</span>
              </div>
              <ol>
                {visible.map((row, index) => (
                  <StandingRowItem key={`${row.name}-${index}`} category={category} tab={tab} row={row} alt={index % 2 === 1} lastRaceName={movement.lastRaceName} />
                ))}
              </ol>
            </div>

            {rows.length > COLLAPSED && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="w-full py-3 rounded-sm border border-outline-variant text-on-surface-variant hover:text-white type-label-badge uppercase tracking-wider transition-colors"
              >
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

/** Cartao do lider: foto do piloto (ou carro da equipe) ao fundo, canto cortado e sombra vermelha dura, como no app. */
function LeaderCard({ category, tab, row }: { category: Category; tab: Tab; row: StandingRow }) {
  const { t } = useT();
  const driver = tab.kind === 'driver' ? findCategoryDriver(category, row.name) : undefined;
  const team = tab.kind === 'team' ? findCategoryTeam(category, row.name) : undefined;
  const wins = tab.kind === 'driver' ? winsOf(category, driver?.name ?? row.name).length : team ? teamWins(category, team.id).length : 0;
  const to = entityPath(category, tab, row.name);
  const photo = driver ? (driver.cutout ?? driver.image) : (team?.clearart ?? team?.badge);
  const flag = driver ? flagForNationality(driver.nationality) : '';
  const sub = [row.team ?? team?.car, driver?.number ? `#${driver.number}` : null].filter(Boolean).join(' • ');

  const body = (
    <div style={{ filter: 'drop-shadow(5px 5px 0 #e10600)' }} className="block">
      <div className="cut-corner [--cut:28px] relative overflow-hidden bg-asphalt border border-hairline min-h-[420px] flex flex-col justify-end">
        {photo && (
          <img
            src={photo}
            alt=""
            className={cn('absolute top-0 right-0 w-[82%] h-[300px] opacity-90', driver?.cutout ? 'object-contain object-bottom' : tab.kind === 'team' ? 'object-contain' : 'object-cover object-top')}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(21,21,30,0.9) 62%, #15151e 82%)' }} aria-hidden />
        <div className="relative p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="type-label-badge uppercase tracking-widest text-primary">{t('st.leaderTag')}</p>
              <h3 className="type-headline-lg text-[30px] leading-[34px] uppercase text-white break-words mt-1">{row.name}</h3>
              {sub && <p className="type-body-md text-on-surface-variant mt-0.5">{sub}</p>}
            </div>
            {flag && <span className="text-[30px] leading-none shrink-0">{flag}</span>}
          </div>
          <div className="h-px bg-hairline" />
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="type-label-badge uppercase tracking-widest text-on-surface-variant">{t('st.totalPoints')}</p>
              {wins > 0 && <p className="type-label-badge text-on-surface-variant mt-1 uppercase">{pad2(wins)} {t('st.wins')}</p>}
            </div>
            <span className="type-display-hero text-[64px] leading-[64px] text-primary not-italic font-black">{formatPoints(row.points)}</span>
          </div>
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{body}</Link> : body;
}

function StandingRowItem({ category, tab, row, alt, lastRaceName }: { category: Category; tab: Tab; row: StandingRow; alt: boolean; lastRaceName: string | null }) {
  const { t } = useT();
  const to = entityPath(category, tab, row.name);
  const driver = tab.kind === 'driver' ? findCategoryDriver(category, row.name) : undefined;
  const team = tab.kind === 'team' ? findCategoryTeam(category, row.name) : undefined;
  const flag = driver ? flagForNationality(driver.nationality) : '';
  const sub = tab.kind === 'driver' ? row.team ?? row.extra : team?.car ?? team?.class;
  const leader = row.position === 1;

  const content = (
    <div className={cn('grid grid-cols-[2.25rem_1fr_auto] items-center pl-2 pr-3 py-3 border-l-[3px] hover:bg-surface-container transition-colors', alt ? 'bg-asphalt-alt' : 'bg-asphalt', leader ? 'border-primary-container' : 'border-transparent')}>
      <span className={cn('type-telemetry-counter text-[16px]', leader ? 'text-primary-container' : 'text-on-surface-variant')}>{row.position}</span>
      <div className="flex items-center gap-2.5 min-w-0">
        {flag && <span className="text-[18px] leading-none shrink-0">{flag}</span>}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="type-headline-sm text-[15px] uppercase text-white truncate">{row.name}</span>
            <Delta delta={row.delta} />
          </div>
          {sub && <span className="type-label-telemetry uppercase text-on-surface-variant truncate block">{sub}</span>}
        </div>
      </div>
      <div className="text-right pl-2">
        <div className="type-telemetry-counter text-[16px] text-white">{formatPoints(row.points)}</div>
        {row.lastRacePoints != null && row.lastRacePoints > 0 ? (
          <span className="type-label-telemetry text-[#4ae176]">
            +{formatPoints(row.lastRacePoints)}{lastRaceName ? ` · ${shortRaceName(lastRaceName)}` : ''}
          </span>
        ) : (
          <span className="type-label-telemetry text-on-surface-variant">{row.gap > 0 ? signed(-row.gap) : t('st.leaderShort')}</span>
        )}
      </div>
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
  if (delta > 0) return <ArrowUp className="w-3.5 h-3.5 text-[#4ae176]" aria-label={`+${delta}`} />;
  if (delta < 0) return <ArrowDown className="w-3.5 h-3.5 text-error" aria-label={`${delta}`} />;
  return <Minus className="w-3.5 h-3.5 text-on-surface-variant" aria-hidden />;
}
