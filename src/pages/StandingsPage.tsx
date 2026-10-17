import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, Info, ListOrdered, Minus } from 'lucide-react';
import { paths } from '../app/paths';
import { CategoryHeader } from '../components/CategoryHeader';
import { ReelBackdrop } from '../components/pit';
import { Button, CategoryDataState, EmptyState, Segmented, Skeleton } from '../components/ui';
import { findCategoryDriver, findCategoryTeam } from '../lib/entities';
import { useStandingsMovement } from '../lib/f1-hooks';
import { formatPoints, signed } from '../lib/format';
import { useT } from '../lib/i18n';
import { scoringRuleIndex } from '../lib/rules';
import { buildStandingRows, pointsByDriver, pointsByTeam, teamWins, winsOf, type StandingRow } from '../lib/season';
import { completedRounds, dataStateOf, totalRounds } from '../lib/categories-meta';
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

  if (!category) {
    return <div className="px-margin lg:px-0 pt-6 space-y-3"><Skeleton className="h-12" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="px-margin lg:px-0 pb-10 page-in">
      <CategoryHeader category={category} current="standings" />

      <div className="mt-6 space-y-5">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="type-headline-md text-white">{[t('st.title'), season].filter(Boolean).join(' · ')}</h2>
            <p className="type-body-md text-silver mt-1">{t('st.stage', { done: completedRounds(category), total: totalRounds(category) })}</p>
          </div>
          {pointsRule != null && (
            <Button variant="secondary" to={paths.rules(category.id, pointsRule)}>
              <Info className="w-[18px] h-[18px]" />
              {t('st.howPoints')}
            </Button>
          )}
        </div>

        {dataStateOf(category.id) !== 'live' && (
          <p className="type-body-sm text-silver flex flex-wrap items-center gap-x-3 gap-y-1 max-w-[68ch]">
            <CategoryDataState categoryId={category.id} />
            {dataStateOf(category.id) === 'catalog' && <span>{t('state.catalogNote')}</span>}
          </p>
        )}

        {!tab ? (
          !ready ? (
            <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-64" /></div>
          ) : (
            <EmptyState icon={ListOrdered} title={t('st.unavailable')} hint={t('st.unavailableHint')} />
          )
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 space-y-6 lg:space-y-0">
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-8 lg:self-start">
              {tabs.length > 1 && (
                <Segmented className="w-fit max-w-full" options={tabs.map((x) => ({ value: x.key, label: x.label }))} value={tab.key} onChange={setTabChoice} />
              )}
              {rows[0] && <LeaderCard category={category} tab={tab} row={rows[0]} />}
            </div>

            <div className="lg:col-span-7 space-y-4 min-w-0">
              <div className="rounded-2xl bg-asphalt border border-hairline overflow-hidden">
                <table className="w-full text-left">
                  <caption className="sr-only">{t('st.official')}</caption>
                  <thead>
                    <tr className="border-b border-hairline type-label-badge text-silver">
                      <th scope="col" className="w-12 pl-4 py-3 font-semibold">{t('st.pos')}</th>
                      <th scope="col" className="py-3 font-semibold">{tab.kind === 'driver' ? t('st.driverTeam') : t('st.team')}</th>
                      <th scope="col" className="pr-4 py-3 text-right font-semibold">{t('st.pts')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {visible.map((row, index) => (
                      <StandingRowItem key={`${row.name}-${index}`} category={category} tab={tab} row={row} lastRaceName={movement.lastRaceName} />
                    ))}
                  </tbody>
                </table>
              </div>

              {rows.length > COLLAPSED && (
                <Button variant="secondary" className="w-full" onClick={() => setExpanded((v) => !v)}>
                  {expanded ? t('common.showLess') : t('st.showAll', { n: rows.length })}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
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

/** Lider do campeonato: foto sobre o campo da categoria, nome embaixo e uma frase com pontos e vitorias. */
function LeaderCard({ category, tab, row }: { category: Category; tab: Tab; row: StandingRow }) {
  const { t } = useT();
  const driver = tab.kind === 'driver' ? findCategoryDriver(category, row.name) : undefined;
  const team = tab.kind === 'team' ? findCategoryTeam(category, row.name) : undefined;
  const wins = tab.kind === 'driver' ? winsOf(category, driver?.name ?? row.name).length : team ? teamWins(category, team.id).length : 0;
  const to = entityPath(category, tab, row.name);
  const photo = driver ? (driver.cutout ?? driver.image) : (team?.clearart ?? team?.badge);
  const flag = driver ? flagForNationality(driver.nationality) : '';
  const sub = [row.team ?? team?.car, driver?.number ? `#${driver.number}` : null].filter(Boolean).join(' · ');

  const body = (
    <div className="relative overflow-hidden rounded-3xl border border-hairline min-h-[19rem] lg:min-h-[24rem] flex flex-col justify-end">
      <ReelBackdrop categoryId={category.id} />
      {photo && (
        <img
          src={photo}
          alt=""
          className={cn('absolute top-0 right-0 w-[86%] h-[12.5rem] lg:h-[17rem]', driver?.cutout ? 'object-contain object-bottom' : tab.kind === 'team' ? 'object-contain' : 'object-cover object-top')}
        />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.9) 34%, transparent 66%)' }} aria-hidden />
      <div className="relative p-5 lg:p-6 space-y-1.5">
        <h3 className="type-headline-lg text-white break-words">
          {row.name} {flag && <span className="text-[1.5rem] align-middle ml-1">{flag}</span>}
        </h3>
        {sub && <p className="type-body-md text-silver">{sub}</p>}
        <p className="type-body-lg text-white font-semibold tabular">
          {formatPoints(row.points)} {t('st.pts').toLowerCase()}
          {wins > 0 && <span className="text-silver font-medium"> · {wins} {t('st.wins').toLowerCase()}</span>}
        </p>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block hover:opacity-95 transition-opacity">{body}</Link> : body;
}

function StandingRowItem({ category, tab, row, lastRaceName }: { category: Category; tab: Tab; row: StandingRow; lastRaceName: string | null }) {
  const { t } = useT();
  const to = entityPath(category, tab, row.name);
  const driver = tab.kind === 'driver' ? findCategoryDriver(category, row.name) : undefined;
  const team = tab.kind === 'team' ? findCategoryTeam(category, row.name) : undefined;
  const flag = driver ? flagForNationality(driver.nationality) : '';
  const sub = tab.kind === 'driver' ? row.team ?? row.extra : team?.car ?? team?.class;
  const leader = row.position === 1;

  const name = (
    <span className="flex items-center gap-2.5 min-w-0">
      {flag && <span className="text-[1.125rem] leading-none shrink-0">{flag}</span>}
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className={cn('type-body-md truncate', leader ? 'font-bold text-white' : 'font-semibold text-white')}>{row.name}</span>
          <Delta delta={row.delta} />
        </span>
        {sub && <span className="type-body-sm text-silver truncate block">{sub}</span>}
      </span>
    </span>
  );

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className={cn('pl-4 py-3 type-headline-sm tabular w-12', leader ? 'text-white' : 'text-silver')}>{row.position}</td>
      <td className="py-3 min-w-0">{to ? <Link to={to} className="block hover:underline underline-offset-4 decoration-white/40">{name}</Link> : name}</td>
      <td className="pr-4 py-3 text-right">
        <span className="type-headline-sm text-white tabular block">{formatPoints(row.points)}</span>
        {row.lastRacePoints != null && row.lastRacePoints > 0 ? (
          <span className="type-label-telemetry text-tertiary tabular">
            +{formatPoints(row.lastRacePoints)}{lastRaceName ? ` · ${shortRaceName(lastRaceName)}` : ''}
          </span>
        ) : (
          <span className="type-label-telemetry text-silver tabular">{row.gap > 0 ? signed(-row.gap) : t('st.leaderShort')}</span>
        )}
      </td>
    </tr>
  );
}

/** "Singapore Grand Prix" -> "Singapore" (cabe na linha de pontos). */
function shortRaceName(name: string): string {
  return name.replace(/\s*(Grand Prix|GP)$/i, '').replace(/^(GP (de|da|do|dos|das) )/i, '');
}

function Delta({ delta }: { delta: number | null }) {
  if (delta == null) return null;
  if (delta > 0) return <ArrowUp className="w-3.5 h-3.5 text-tertiary" aria-label={`+${delta}`} />;
  if (delta < 0) return <ArrowDown className="w-3.5 h-3.5 text-error" aria-label={`${delta}`} />;
  return <Minus className="w-3.5 h-3.5 text-silver" aria-hidden />;
}
