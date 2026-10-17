import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Heart, X } from 'lucide-react';
import { Avatar } from '../../components/Avatar';
import { teamColor } from '../../components/cards';
import { accentOf } from '../../lib/categories-meta';
import { followKey } from '../../lib/entities';
import { useT } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { useLiveData } from '../../state/live-data';
import { useSettings } from '../../state/settings';

type Entry = { key: string; kind: 'team' | 'driver'; categoryId: string; categoryName: string; id: string; name: string; image?: string; color: string };

/** Ordem de prioridade (chaves `team::cat::id` / `driver::cat::id`) resolvida para nomes e fotos. */
function useEntries(): Entry[] {
  const { byId } = useLiveData();
  const { prefs } = useSettings();
  return useMemo(
    () =>
      prefs.priorityFollowIds
        .map((key): Entry | null => {
          const [kind, categoryId, id] = key.split('::') as ['team' | 'driver', string, string];
          const category = byId.get(categoryId);
          if (!category) return null;
          if (kind === 'team') {
            const team = category.teams.find((x) => x.id === id);
            return team ? { key, kind, categoryId, id, categoryName: category.name, name: team.name, image: team.badge, color: teamColor(team) } : null;
          }
          const driver = category.drivers.find((x) => x.id === id);
          if (!driver) return null;
          const team = category.teams.find((x) => x.id === driver.teamId);
          return { key, kind, categoryId, id, categoryName: category.name, name: driver.name, image: driver.cutout ?? driver.image, color: teamColor(team) };
        })
        .filter((entry): entry is Entry => entry !== null),
    [byId, prefs.priorityFollowIds],
  );
}

/** Ordem de prioridade dos avisos + lista de categorias, times e pilotos para seguir. */
export function FavoritesPicker() {
  const { t } = useT();
  const { categories } = useLiveData();
  const settings = useSettings();
  const entries = useEntries();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-space-lg">
      <section>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="type-headline-sm text-text-primary">{t('fav.priority')}</h3>
          {entries.length > 0 && <span className="px-2 py-0.5 rounded-full bg-racing-red/15 text-signal type-label-telemetry font-bold">{entries.length}</span>}
        </div>
        <p className="type-body-sm text-text-muted mb-3">{t('fav.priorityDesc')}</p>
        {entries.length === 0 ? (
          <div className="p-5 rounded-lg border border-dashed border-hairline type-body-sm text-text-muted text-center">{t('fav.none')}</div>
        ) : (
          <ol className="space-y-2">
            {entries.map((entry, index) => (
              <li key={entry.key} className="flex items-center gap-3 p-2.5 rounded-lg bg-asphalt">
                <span className="w-6 h-6 shrink-0 rounded-full bg-surface-container-high flex items-center justify-center type-label-telemetry font-bold text-text-muted">{index + 1}</span>
                <Avatar src={entry.image} name={entry.name} size={36} square={entry.kind === 'team'} fit={entry.kind === 'team' ? 'contain' : 'cover'} />
                <div className="min-w-0 flex-1">
                  <p className="type-body-md font-bold text-text-primary truncate">{entry.name}</p>
                  <p className="type-label-telemetry truncate" style={{ color: entry.color }}>
                    {entry.categoryName} <span className="text-text-muted">• {entry.kind === 'team' ? t('fav.team') : t('fav.driver')}</span>
                  </p>
                </div>
                <div className="flex items-center shrink-0">
                  <IconButton label={t('fav.moveUp')} disabled={index === 0} onClick={() => settings.movePriority(entry.key, -1)}><ChevronUp className="w-4 h-4" /></IconButton>
                  <IconButton label={t('fav.moveDown')} disabled={index === entries.length - 1} onClick={() => settings.movePriority(entry.key, 1)}><ChevronDown className="w-4 h-4" /></IconButton>
                  <IconButton label={t('fav.remove')} danger onClick={() => (entry.kind === 'team' ? settings.toggleTeam(entry.categoryId, entry.id) : settings.toggleDriver(entry.categoryId, entry.id))}><X className="w-4 h-4" /></IconButton>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="type-headline-sm text-text-primary mb-3">{t('fav.browse')}</h3>
        <div className="space-y-2">
          {categories.map((category) => {
            const open = openId === category.id;
            const followingCategory = settings.isFollowingCategory(category.id);
            const count =
              category.teams.filter((x) => settings.isFollowingTeam(category.id, x.id)).length +
              category.drivers.filter((x) => settings.isFollowingDriver(category.id, x.id)).length;
            return (
              <div key={category.id} className="rounded-lg bg-asphalt overflow-hidden">
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <button type="button" onClick={() => setOpenId(open ? null : category.id)} aria-expanded={open} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                    <span className="w-[3px] h-6 rounded-full shrink-0" style={{ backgroundColor: accentOf(category.id) }} aria-hidden />
                    <span className="type-body-md font-bold text-text-primary truncate flex-1">{category.name}</span>
                    {count > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-racing-red/15 type-label-telemetry font-bold text-signal">
                        <Heart className="w-3 h-3 fill-current" />{count}
                      </span>
                    )}
                    <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform', open && 'rotate-180')} />
                  </button>
                  <button
                    type="button"
                    aria-pressed={followingCategory}
                    title={followingCategory ? t('fav.followingCategory') : t('fav.followCategory')}
                    onClick={() => settings.toggleCategory(category.id)}
                    className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors', followingCategory ? 'text-signal bg-racing-red/15' : 'text-text-muted hover:text-signal hover:bg-surface-container-high')}
                  >
                    <Heart className={cn('w-4 h-4', followingCategory && 'fill-current')} />
                  </button>
                </div>
                {open && (
                  <div className="px-3.5 pb-4 pt-3 space-y-4 border-t border-hairline">
                    {category.teams.length > 0 && (
                      <div>
                        <p className="type-label-telemetry text-text-muted mb-2">{t('fav.teams')}</p>
                        <div className="flex flex-wrap gap-2">
                          {category.teams.map((team) => (
                            <Chip key={team.id} active={settings.isFollowingTeam(category.id, team.id)} onClick={() => settings.toggleTeam(category.id, team.id)}>
                              {team.badge && <img src={team.badge} alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" loading="lazy" decoding="async" />}
                              {team.name}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                    {category.drivers.length > 0 && (
                      <div>
                        <p className="type-label-telemetry text-text-muted mb-2">{t('fav.drivers')}</p>
                        <div className="flex flex-wrap gap-2">
                          {category.drivers.map((driver) => (
                            <Chip key={followKey(category.id, driver.id)} active={settings.isFollowingDriver(category.id, driver.id)} onClick={() => settings.toggleDriver(category.id, driver.id)}>
                              {(driver.cutout ?? driver.image) && <img src={driver.cutout ?? driver.image} alt="" className="w-5 h-5 object-cover object-top rounded-full" referrerPolicy="no-referrer" loading="lazy" decoding="async" />}
                              {driver.name}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function IconButton({ label, onClick, disabled, danger = false, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-text-muted disabled:opacity-20 transition-colors', danger ? 'hover:text-signal hover:bg-racing-red/10' : 'hover:text-text-primary hover:bg-surface-container-high')}
    >
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border type-body-sm font-semibold transition-colors',
        active ? 'bg-racing-red/10 border-racing-red/40 text-signal' : 'bg-surface-container-high border-transparent text-text-secondary hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
