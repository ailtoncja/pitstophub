import { Link } from 'react-router-dom';
import { BellRing, CalendarDays } from 'lucide-react';
import { paths } from '../../app/paths';
import { Sheet } from '../../components/Sheet';
import { allUpcoming, followedCategorySet } from '../../lib/hero';
import { raceTitle, raceWhen } from '../../lib/format';
import { useT } from '../../lib/i18n';
import { useAuth } from '../../state/auth-context';
import { useLiveData } from '../../state/live-data';
import { useSettings } from '../../state/settings';
import { NotificationsPanel } from '../favorites/NotificationsPanel';

const MAX_UPCOMING = 5;

/** Alertas: push do aparelho, tipos de aviso e as proximas etapas das categorias que a pessoa acompanha. */
export function AlertsSheet({ open, onClose, onOpenProfile }: { open: boolean; onClose: () => void; onOpenProfile: () => void }) {
  const { t, lang } = useT();
  const { user, requestLogin } = useAuth();
  const { categories } = useLiveData();
  const { prefs } = useSettings();

  const followed = followedCategorySet(prefs);
  const upcoming = followed.size > 0 ? allUpcoming(categories.filter((c) => followed.has(c.id))).slice(0, MAX_UPCOMING) : [];

  return (
    <Sheet open={open} onClose={onClose} title={t('alerts.title')} closeLabel={t('common.close')}>
      <div className="space-y-space-md">
        <NotificationsPanel />

        <section>
          <h3 className="type-headline-sm uppercase text-text-primary mb-2">{t('alerts.next')}</h3>
          {!user ? (
            <div className="rounded-xl border border-dashed border-surface-border p-5 text-center">
              <p className="type-body-sm text-text-muted">{t('alerts.needLogin')}</p>
              <button type="button" onClick={() => { onClose(); requestLogin(); }} className="mt-3 px-4 py-2 rounded-lg bg-racing-red text-white type-label-badge uppercase tracking-wider active:scale-95 transition-transform">{t('profile.login')}</button>
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-border p-5 text-center">
              <BellRing className="w-6 h-6 text-text-muted mx-auto mb-2" />
              <p className="type-body-sm text-text-muted">{t('alerts.empty')}</p>
              <button type="button" onClick={() => { onClose(); onOpenProfile(); }} className="mt-3 px-4 py-2 rounded-lg bg-surface-container-high text-text-primary type-label-badge uppercase tracking-wider active:scale-95 transition-transform">{t('alerts.choose')}</button>
            </div>
          ) : (
            <ul className="divide-y divide-surface-container-high rounded-xl bg-surface-container-low overflow-hidden">
              {upcoming.map(({ category, race }) => (
                <li key={`${category.id}-${race.id}`}>
                  <Link to={paths.race(category.id, race.id)} onClick={onClose} className="flex items-center gap-3 px-3.5 py-3 hover:bg-surface-container transition-colors">
                    <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-text-muted shrink-0"><CalendarDays className="w-4 h-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block type-body-md font-bold text-text-primary truncate">{raceTitle(race, lang)}</span>
                      <span className="block type-label-telemetry uppercase text-text-muted truncate">{category.name} • {raceWhen(race, lang)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Sheet>
  );
}
