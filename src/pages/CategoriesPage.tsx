import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, Search, SearchX, X } from 'lucide-react';
import { paths } from '../app/paths';
import { ReelBackdrop } from '../components/pit';
import { useToast } from '../components/Toast';
import { Button, EmptyState, GlyphButton, PillStrip, StateLegend, StateMark } from '../components/ui';
import { CATEGORY_GROUPS, dataStateOf, type GroupId } from '../lib/categories-meta';
import { normalize } from '../lib/entities';
import { dayMonth, raceTitle } from '../lib/format';
import { useT } from '../lib/i18n';
import { nextRace } from '../lib/season';
import { raceStartDate } from '../race-time';
import { useLiveData } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import { useSettings } from '../state/settings';
import type { Category } from '../types';

/** As 14 categorias como iguais: cada uma com o proprio campo de cor, a proxima largada e o estado do dado. */
export default function CategoriesPage() {
  const { t, lang } = useT();
  const toast = useToast();
  const { categories } = useLiveData();
  const settings = useSettings();
  const { select } = useSelectedCategory();
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
    <div className="px-margin lg:px-0 pt-5 lg:pt-10 pb-10 space-y-6 page-in">
      <header className="space-y-2">
        <h1 className="type-headline-lg lg:text-[2.25rem] text-white">{t('cats.explore')}</h1>
        <p className="type-body-lg text-silver max-w-[60ch]">{t('cats.lead')}</p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block lg:w-[22rem]">
          <Search className="w-[18px] h-[18px] text-silver absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cats.filter')}
            aria-label={t('cats.filter')}
            className="w-full h-11 bg-asphalt border border-white/20 pl-11 pr-10 rounded-full type-body-md text-white placeholder:text-silver focus:outline-none focus:border-white transition-colors"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t('common.clear')} className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-silver hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </label>
        <PillStrip options={options} value={group} onChange={setGroup} />
      </div>

      {total === 0 ? (
        <EmptyState
          icon={SearchX}
          title={t('cats.none')}
          hint={t('cats.noneHint')}
          action={<Button variant="secondary" onClick={() => { setQuery(''); setGroup('all'); }}>{t('cats.seeAll')}</Button>}
        />
      ) : (
        <div className="space-y-10">
          {sections.map(({ group: g, items }) => (
            <section key={g.id} className="space-y-4">
              <h2 className="type-headline-md text-white">{g.label[lang]}</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((category) => {
                  const following = settings.isFollowingCategory(category.id);
                  const next = nextRace(category.calendar, now);
                  return (
                    <li key={category.id} className="relative h-[11.5rem] rounded-2xl overflow-hidden border border-hairline hover:border-white/40 transition-colors">
                      <ReelBackdrop categoryId={category.id} />
                      <Link to={paths.categoryEntry(category)} onClick={() => select(category.id)} className="absolute inset-0 flex flex-col justify-end p-5 gap-1" aria-label={category.fullName}>
                        <span className="type-headline-md text-white line-clamp-2 pr-14">{lang === 'en' ? category.enFullName ?? category.fullName : category.fullName}</span>
                        <span className="type-body-sm text-silver line-clamp-1 tabular">
                          {next ? `${dayMonth(raceStartDate(next), lang)} · ${raceTitle(next, lang)}` : t('cats.noNext')}
                        </span>
                        <span className="inline-flex items-center gap-2 type-label-telemetry text-silver">
                          <StateMark state={dataStateOf(category.id)} className="text-white/80" />
                          {t(`state.${dataStateOf(category.id)}`)}
                        </span>
                      </Link>
                      <div className="absolute top-3 right-3">
                        <GlyphButton label={following ? t('common.following') : t('common.follow')} active={following} tone="red" onClick={() => follow(category)}>
                          {following ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                        </GlyphButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <StateLegend className="max-w-xs" />
        </div>
      )}
    </div>
  );
}
