import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '../app/paths';
import { CATEGORY_GROUPS, dataStateOf } from '../lib/categories-meta';
import { dayMonth } from '../lib/format';
import { useT } from '../lib/i18n';
import { nextRace } from '../lib/season';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import { useLiveData } from '../state/live-data';
import { useSelectedCategory } from '../state/selected-category';
import { useSettings } from '../state/settings';
import type { Category } from '../types';
import { StateLegend, StateMark } from './ui';

/**
 * As 14 categorias, em grupos. Cada linha mostra a forma do estado do dado, o nome, um ponto vermelho quando a pessoa
 * segue e a data da proxima etapa. Usada no trilho lateral (computador) e na gaveta de categorias (celular).
 */
export function CategoryList({ activeId, onNavigate, legend = true, className }: { activeId?: string | null; onNavigate?: () => void; legend?: boolean; className?: string }) {
  const { lang, t } = useT();
  const { categories } = useLiveData();
  const { select } = useSelectedCategory();
  const settings = useSettings();

  const byId = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const now = Date.now();

  return (
    <div className={cn('space-y-5', className)}>
      {CATEGORY_GROUPS.map((group) => {
        const items = group.ids.map((id) => byId.get(id)).filter((category): category is Category => Boolean(category));
        if (items.length === 0) return null;
        return (
          <section key={group.id} aria-label={group.label[lang]}>
            <h3 className="px-3 pb-1 type-label-badge text-silver-dim">{group.label[lang]}</h3>
            <ul>
              {items.map((category) => {
                const active = category.id === activeId;
                const following = settings.isFollowingCategory(category.id);
                const next = nextRace(category.calendar, now);
                return (
                  <li key={category.id}>
                    <Link
                      to={paths.category(category.id)}
                      onClick={() => {
                        select(category.id);
                        onNavigate?.();
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 h-11 px-3 rounded-xl type-body-md transition-colors duration-200',
                        active ? 'bg-white text-black font-bold' : 'text-silver hover:text-white hover:bg-white/10',
                      )}
                    >
                      <StateMark state={dataStateOf(category.id)} className={active ? 'text-black' : 'text-white/80'} />
                      <span className="truncate">{category.name}</span>
                      {following && (
                        <span className="w-1.5 h-1.5 rounded-full bg-racing-red shrink-0" role="img" aria-label={t('common.following')} />
                      )}
                      <span className={cn('ml-auto type-label-telemetry tabular shrink-0', active ? 'text-black/70' : 'text-silver-dim')}>
                        {next ? dayMonth(raceStartDate(next), lang) : ''}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {legend && <StateLegend className="px-3 pt-1" />}
    </div>
  );
}
