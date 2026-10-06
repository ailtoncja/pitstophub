import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, Check, Plus, Search, SearchX, X } from 'lucide-react';
import { paths } from '../app/paths';
import { EmptyState, LiveDot, PillStrip } from '../components/ui';
import { useToast } from '../components/Toast';
import { useShell } from '../app/shell-context';
import { CATEGORY_GROUPS, categorySummary, type GroupId } from '../lib/categories-meta';
import { iconOfCategory } from '../lib/category-icons';
import { normalize } from '../lib/entities';
import { useT } from '../lib/i18n';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useLiveData } from '../state/live-data';
import { useSettings } from '../state/settings';
import type { Category } from '../types';

function isActiveToday(category: Category, now: number): boolean {
  const today = new Date(now).toISOString().slice(0, 10);
  return category.calendar.some((race) => {
    if (race.status !== 'upcoming' && race.status !== 'completed') return false;
    const start = raceStartDate(race).getTime();
    return race.date === today || (now >= start && now < start + 3 * 3600_000);
  });
}

export default function CategoriesPage() {
  const { t, lang } = useT();
  const toast = useToast();
  const shell = useShell();
  const { categories } = useLiveData();
  const settings = useSettings();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<GroupId | 'all'>('all');
  const now = Date.now();

  const q = normalize(query);
  const sections = useMemo(
    () =>
      CATEGORY_GROUPS.filter((g) => group === 'all' || g.id === group)
        .map((g) => ({
          group: g,
          items: g.ids
            .map((id) => categories.find((c) => c.id === id))
            .filter((c): c is Category => Boolean(c))
            .filter((c) => !q || normalize(`${c.name} ${c.fullName} ${c.enFullName ?? ''}`).includes(q)),
        }))
        .filter((s) => s.items.length > 0),
    [categories, group, q],
  );
  const total = sections.reduce((sum, s) => sum + s.items.length, 0);

  const options = [{ value: 'all' as const, label: t('home.all') }, ...CATEGORY_GROUPS.map((g) => ({ value: g.id, label: g.label[lang] }))];

  const follow = (category: Category) => {
    const was = settings.isFollowingCategory(category.id);
    if (settings.toggleCategory(category.id)) {
      toast.show(was ? t('toast.unfollowed', { name: category.name }) : t('toast.followed', { name: category.name }), { kind: 'ok' });
    }
  };

  return (
    <div className="flex flex-col gap-space-md px-margin pb-space-xl page-in">
      <div className="pt-4 pb-2 flex flex-col gap-1">
        <div className="flex items-center justify-between text-text-muted">
          <span className="type-label-telemetry uppercase tracking-wider">{t('cats.global')}</span>
          <span className="type-label-telemetry">{t('cats.count', { n: categories.length })}</span>
        </div>
        <h1 className="type-headline-lg uppercase text-text-primary tracking-tight">{t('cats.explore')}</h1>
        <p className="type-body-sm text-text-muted mt-0.5">{t('cats.lead')}</p>

        <label className="relative mt-3 block">
          <Search className="w-[18px] h-[18px] text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cats.filter')}
            aria-label={t('cats.filter')}
            className="w-full bg-surface-container-low pl-9 pr-8 py-2 rounded-lg type-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:bg-surface-raised transition-all"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('common.clear')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </label>
      </div>

      <PillStrip options={options} value={group} onChange={setGroup} tone="quiet" className="pt-0" />

      {total === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t('cats.none')}
          hint={t('cats.noneHint')}
          action={
            <button type="button" onClick={() => { setQuery(''); setGroup('all'); }} className="px-4 py-1.5 rounded-lg bg-surface-raised text-text-primary type-label-badge uppercase tracking-wider hover:bg-surface-container transition-all">
              {t('cats.seeAll')}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-space-md lg:grid-cols-2 lg:items-start">
          {sections.map(({ group: g, items }) => (
            <section key={g.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between pb-1 pt-2">
                <span className="type-label-badge uppercase text-text-muted tracking-wider">{g.label[lang]}</span>
                <span className="type-label-telemetry text-text-muted">{t('cats.count', { n: items.length })}</span>
              </div>
              <div className="flex flex-col bg-surface-container-low rounded-xl overflow-hidden shadow-sm divide-y divide-surface-container-high/50">
                {items.map((category) => {
                  const Icon = iconOfCategory(category.id);
                  const following = settings.isFollowingCategory(category.id);
                  return (
                    <div key={category.id} className="flex items-center justify-between gap-2 p-space-md hover:bg-surface-raised transition-colors">
                      <Link to={paths.category(category.id)} className="flex items-center gap-space-sm min-w-0 flex-1">
                        <Icon className={cn('w-5 h-5 shrink-0', following ? 'text-text-secondary' : 'text-text-muted')} />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="type-body-md font-semibold text-text-primary truncate">{lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}</span>
                            {isActiveToday(category, now) && <LiveDot />}
                          </div>
                          <span className="type-label-telemetry text-text-muted truncate">{categorySummary(category, lang)}</span>
                        </div>
                      </Link>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => follow(category)}
                          aria-pressed={following}
                          className={cn(
                            'px-2.5 py-1 rounded type-label-badge uppercase flex items-center gap-1 active:scale-95 transition-all',
                            following ? 'bg-surface-overlay text-racing-red' : 'bg-surface-container text-text-secondary hover:text-text-primary',
                          )}
                        >
                          {following ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          {following ? t('common.following') : t('common.follow')}
                        </button>
                        <button
                          type="button"
                          onClick={shell.openAlerts}
                          aria-label={t('app.notifications')}
                          className={cn('p-1.5 transition-colors', following ? 'text-racing-red' : 'text-text-muted hover:text-text-primary')}
                        >
                          {following ? <BellRing className="w-[18px] h-[18px]" /> : <Bell className="w-[18px] h-[18px]" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
