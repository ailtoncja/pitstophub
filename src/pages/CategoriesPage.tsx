import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, SearchX, X } from 'lucide-react';
import { paths } from '../app/paths';
import { EmptyState, LiveDot, PillStrip } from '../components/ui';
import { useToast } from '../components/Toast';
import { CATEGORY_GROUPS, accentOf, type GroupId } from '../lib/categories-meta';
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
      <div className="pt-6 flex flex-col gap-2">
        <div className="flex items-center justify-between text-on-surface-variant">
          <span className="type-label-badge uppercase tracking-widest">{t('cats.global')}</span>
          <span className="type-label-badge">{t('cats.count', { n: categories.length })}</span>
        </div>
        <h1 className="type-headline-lg text-[34px] leading-9 uppercase text-on-surface">{t('cats.explore')}</h1>
        <p className="type-body-md text-primary">{t('cats.lead')}</p>

        <label className="relative mt-3 block">
          <Search className="w-[18px] h-[18px] text-on-surface-variant absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cats.filter')}
            aria-label={t('cats.filter')}
            className="w-full bg-surface-container-lowest border border-outline-variant pl-10 pr-9 py-3 rounded-lg type-label-badge uppercase tracking-wider text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('common.clear')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-white">
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
            <button type="button" onClick={() => { setQuery(''); setGroup('all'); }} className="px-4 py-2 rounded-sm bg-surface-container-high border border-hairline text-on-surface type-label-badge uppercase tracking-wider hover:bg-surface-container-highest transition-all">
              {t('cats.seeAll')}
            </button>
          }
        />
      ) : (
        <div className="space-y-space-lg">
          {sections.map(({ group: g, items }) => (
            <section key={g.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="type-label-badge uppercase text-on-surface tracking-widest">{g.label[lang]}</span>
                <span className="type-label-badge text-on-surface-variant">{t('cats.count', { n: items.length })}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 items-start">
                {items.map((category) => {
                  const Icon = iconOfCategory(category.id);
                  const following = settings.isFollowingCategory(category.id);
                  const accent = accentOf(category.id);
                  return (
                    <div key={category.id} className="flex items-stretch gap-3 rounded-lg bg-asphalt border border-hairline p-4 hover:bg-asphalt-alt transition-colors">
                      <Link to={paths.category(category.id)} className="flex items-start gap-3.5 min-w-0 flex-1">
                        <span className="w-14 h-14 rounded-sm flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${accent}29`, borderColor: `${accent}73` }}>
                          <Icon className="w-[30px] h-[30px]" style={{ color: accent }} />
                        </span>
                        <span className="flex flex-col min-w-0 gap-1">
                          <span className="flex items-center gap-2">
                            <span className="type-headline-md text-[18px] leading-[22px] uppercase text-white line-clamp-2">{lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}</span>
                            {isActiveToday(category, now) && <LiveDot />}
                          </span>
                          <span className="type-body-sm text-on-surface-variant line-clamp-2">{lang === 'en' ? category.enDescription ?? category.description : category.description}</span>
                          <span className="type-label-badge uppercase" style={{ color: accent }}>
                            {[category.teams.length > 0 ? t('summary.teams', { n: category.teams.length }) : null, category.calendar.length > 0 ? t('summary.rounds', { n: category.calendar.filter((r) => r.status !== 'cancelled').length }) : null].filter(Boolean).join(' • ') || category.name}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => follow(category)}
                        aria-pressed={following}
                        aria-label={following ? t('common.following') : t('common.follow')}
                        className={cn('w-10 h-10 shrink-0 self-center rounded-sm flex items-center justify-center border active:scale-95 transition-all', following ? 'bg-primary-container/20 border-primary-container/60 text-primary' : 'bg-surface-container-high border-hairline text-on-surface-variant hover:text-white')}
                      >
                        <Heart className={cn('w-5 h-5', following && 'fill-current')} />
                      </button>
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
