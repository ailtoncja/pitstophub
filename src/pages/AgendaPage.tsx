import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import { paths } from '../app/paths';
import { useToast } from '../components/Toast';
import { Button, EmptyState, PillStrip, Skeleton, StateMark } from '../components/ui';
import { CATEGORY_GROUPS, dataStateOf, groupOf, type GroupId } from '../lib/categories-meta';
import { hasStartTime, racePlace, raceTitle, timeOf, timeZoneLabel, weekdayDayMonth } from '../lib/format';
import { allUpcoming, followedCategorySet } from '../lib/hero';
import { useT } from '../lib/i18n';
import { buildIcs, downloadIcs } from '../lib/ics';
import { useNow } from '../lib/useNow';
import { raceStartDate } from '../race-time';
import { useLiveData } from '../state/live-data';
import { useSettings } from '../state/settings';

type Scope = 'all' | 'following' | GroupId;

const PAGE = 40;
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/** Todas as proximas largadas de todas as categorias, agrupadas por dia, com filtro por grupo e por quem a pessoa segue. */
export default function AgendaPage() {
  const { t, lang } = useT();
  const toast = useToast();
  const { categories, ready } = useLiveData();
  const { prefs } = useSettings();
  const now = useNow(60_000);
  const [scope, setScope] = useState<Scope>('all');
  const [limit, setLimit] = useState(PAGE);

  const followed = useMemo(() => followedCategorySet(prefs), [prefs]);
  const entries = useMemo(() => {
    const pool = categories.filter((category) => {
      if (scope === 'all') return true;
      if (scope === 'following') return followed.has(category.id);
      return groupOf(category.id)?.id === scope;
    });
    return allUpcoming(pool, now);
  }, [categories, followed, now, scope]);

  const visible = entries.slice(0, limit);
  const days = useMemo(() => {
    const map = new Map<string, { date: Date; items: typeof visible }>();
    for (const entry of visible) {
      const date = raceStartDate(entry.race);
      const key = dayKey(date);
      const bucket = map.get(key) ?? { date, items: [] };
      bucket.items.push(entry);
      map.set(key, bucket);
    }
    return [...map.values()];
  }, [visible]);

  const todayKey = dayKey(new Date(now));
  const tomorrowKey = dayKey(new Date(now + 86_400_000));

  const options = [
    { value: 'all' as Scope, label: t('home.all') },
    ...(followed.size > 0 ? [{ value: 'following' as Scope, label: t('agenda.following') }] : []),
    ...CATEGORY_GROUPS.map((group) => ({ value: group.id as Scope, label: group.label[lang] })),
  ];

  const exportAll = () => {
    if (entries.length === 0) return;
    downloadIcs('pitstophub-agenda.ics', buildIcs(entries, lang));
    toast.show(t('cal.exported'), { kind: 'ok' });
  };

  return (
    <div className="px-margin lg:px-0 pt-5 lg:pt-10 pb-10 space-y-6 page-in">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="type-headline-lg lg:text-[2.25rem] text-white">{t('nav.agenda')}</h1>
          <p className="type-body-md text-silver mt-1.5">{t('agenda.subtitle', { zone: timeZoneLabel(new Date(now)) || 'UTC' })}</p>
        </div>
        <Button variant="secondary" onClick={exportAll} disabled={entries.length === 0}>
          <CalendarPlus className="w-[18px] h-[18px]" />
          {t('agenda.exportAll')}
        </Button>
      </header>

      <PillStrip options={options} value={scope} onChange={(value) => { setScope(value); setLimit(PAGE); }} />

      {!ready && entries.length === 0 ? (
        <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : entries.length === 0 ? (
        <EmptyState icon={CalendarPlus} title={scope === 'following' ? t('agenda.emptyFollowing') : t('home.noUpcoming')} hint={scope === 'following' ? t('agenda.emptyFollowingHint') : t('home.noUpcomingHint')} />
      ) : (
        <div className="space-y-8">
          {days.map(({ date, items }) => {
            const key = dayKey(date);
            return (
              <section key={key} className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-6">
                <h2 className="type-headline-sm text-white lg:pt-3.5 mb-2 lg:mb-0">
                  {weekdayDayMonth(date, lang)}
                  {(key === todayKey || key === tomorrowKey) && <span className="ml-2 type-label-badge text-silver font-medium">{key === todayKey ? t('agenda.today') : t('agenda.tomorrow')}</span>}
                </h2>
                <ul className="rounded-2xl bg-asphalt border border-hairline divide-y divide-hairline-soft overflow-hidden">
                  {items.map(({ category, race }) => (
                    <li key={`${category.id}-${race.id}`} className="flex items-center">
                      <Link to={paths.race(category.id, race.id)} className="flex-1 min-w-0 flex items-center gap-4 pl-4 pr-2 py-3.5 hover:bg-white/5 transition-colors">
                        <span className="w-[4.25rem] sm:w-32 shrink-0 flex items-center gap-2.5 type-label-badge text-silver">
                          <StateMark state={dataStateOf(category.id)} className="text-white/80 hidden sm:inline-block" />
                          <span className="truncate">{category.name}</span>
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="type-body-md font-semibold text-white block truncate">{raceTitle(race, lang)}</span>
                          <span className="type-body-sm text-silver block truncate">{race.circuit && race.circuit !== racePlace(race, lang) ? `${race.circuit} · ${racePlace(race, lang)}` : racePlace(race, lang)}</span>
                        </span>
                        <span className="type-headline-sm text-white tabular shrink-0 w-14 text-right">
                          {hasStartTime(race) ? timeOf(raceStartDate(race), lang) : <span className="text-silver-dim font-medium">—</span>}
                        </span>
                      </Link>
                      <button
                        type="button"
                        aria-label={`${t('cal.saveAgenda')}: ${raceTitle(race, lang)}`}
                        onClick={() => {
                          downloadIcs(`pitstophub-${category.id}-${race.id}.ics`, buildIcs([{ category, race }], lang));
                          toast.show(t('cal.exported'), { kind: 'ok' });
                        }}
                        className="w-11 h-11 mr-2 shrink-0 rounded-full flex items-center justify-center text-silver hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <CalendarPlus className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {entries.length > limit && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((n) => n + PAGE)}>{t('agenda.showMore', { n: entries.length - limit })}</Button>
            </div>
          )}
          <p className="type-body-sm text-silver-dim">{t('agenda.tbcNote')}</p>
        </div>
      )}
    </div>
  );
}
