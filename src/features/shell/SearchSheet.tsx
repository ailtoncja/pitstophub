import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Flag, Search, Shield, User } from 'lucide-react';
import { paths } from '../../app/paths';
import { Sheet } from '../../components/Sheet';
import { normalize } from '../../lib/entities';
import { raceTitle, raceWhen } from '../../lib/format';
import { useT } from '../../lib/i18n';
import { useLiveData } from '../../state/live-data';

type Hit = { key: string; to: string; title: string; sub: string; kind: 'category' | 'driver' | 'team' | 'race' };

const MAX_PER_KIND = 6;
const ICONS = { category: Flag, driver: User, team: Shield, race: CalendarDays } as const;

/** Busca em todas as categorias carregadas: categorias, pilotos, equipes e etapas. */
export function SearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useT();
  const navigate = useNavigate();
  const { categories } = useLiveData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const q = normalize(query);
    if (q.length < 2) return [];
    const out: Record<Hit['kind'], Hit[]> = { category: [], driver: [], team: [], race: [] };
    const push = (hit: Hit) => {
      if (out[hit.kind].length < MAX_PER_KIND) out[hit.kind].push(hit);
    };
    for (const category of categories) {
      if (normalize(`${category.name} ${category.fullName}`).includes(q)) {
        push({ key: `c-${category.id}`, kind: 'category', to: paths.category(category.id), title: category.name, sub: category.fullName });
      }
      for (const driver of category.drivers) {
        if (normalize(`${driver.name} ${driver.number}`).includes(q)) {
          const team = category.teams.find((x) => x.id === driver.teamId);
          push({ key: `d-${category.id}-${driver.id}`, kind: 'driver', to: paths.driver(category.id, driver.id), title: driver.name, sub: [category.name, team?.name].filter(Boolean).join(' • ') });
        }
      }
      for (const team of category.teams) {
        if (normalize(team.name).includes(q)) {
          push({ key: `t-${category.id}-${team.id}`, kind: 'team', to: paths.team(category.id, team.id), title: team.name, sub: category.name });
        }
      }
      for (const race of category.calendar) {
        if (normalize(`${race.name} ${race.enName ?? ''} ${race.circuit} ${race.location}`).includes(q)) {
          push({ key: `r-${category.id}-${race.id}`, kind: 'race', to: paths.race(category.id, race.id), title: raceTitle(race, lang), sub: `${category.name} • ${raceWhen(race, lang)}` });
        }
      }
    }
    return [...out.category, ...out.driver, ...out.team, ...out.race];
  }, [categories, query, lang]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('search.title')} closeLabel={t('common.close')}>
      <label className="flex items-center gap-2 rounded-xl bg-surface-container-lowest border border-surface-border px-3.5 focus-within:border-racing-red/60 transition-colors">
        <Search className="w-[18px] h-[18px] text-text-muted shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full bg-transparent py-3 type-body-md text-text-primary placeholder:text-text-muted outline-none"
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <div className="mt-4">
        {query.trim().length < 2 ? (
          <p className="type-body-sm text-text-muted text-center py-6">{t('search.hint')}</p>
        ) : hits.length === 0 ? (
          <p className="type-body-sm text-text-muted text-center py-6">{t('search.empty', { q: query.trim() })}</p>
        ) : (
          <ul className="divide-y divide-surface-container-high rounded-xl bg-surface-container-low overflow-hidden">
            {hits.map((hit) => {
              const Icon = ICONS[hit.kind];
              return (
                <li key={hit.key}>
                  <button type="button" onClick={() => go(hit.to)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-surface-container transition-colors">
                    <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-text-muted shrink-0"><Icon className="w-4 h-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block type-body-md font-bold text-text-primary truncate">{hit.title}</span>
                      <span className="block type-label-telemetry uppercase text-text-muted truncate">{hit.sub}</span>
                    </span>
                    <span className="type-label-telemetry uppercase text-text-muted shrink-0">{t(`search.kind.${hit.kind}`)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
