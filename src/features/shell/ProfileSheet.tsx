import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Download, LogIn, LogOut, Trophy } from 'lucide-react';
import { paths } from '../../app/paths';
import { Sheet } from '../../components/Sheet';
import { Segmented } from '../../components/ui';
import { initials } from '../../lib/format';
import { useT } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { isIntroDisabled, setIntroDisabled } from '../../IntroGate';
import { useAuth } from '../../state/auth-context';
import { useInstall } from '../../state/install';
import { useSettings } from '../../state/settings';
import { FavoritesPicker } from '../favorites/FavoritesPicker';

/** Perfil: conta, idioma, instalacao do app, abertura animada e gerenciamento de favoritos. */
export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const { user, requestLogin, logout } = useAuth();
  const { language, setLanguage } = useSettings();
  const install = useInstall();
  const [introOff, setIntroOff] = useState(isIntroDisabled);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const toggleIntro = () => {
    setIntroDisabled(!introOff);
    setIntroOff(!introOff);
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('profile.title')} closeLabel={t('common.close')}>
      <div className="space-y-space-md">
        {/* CONTA */}
        <section className="rounded-xl bg-surface-container-low p-space-md">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center type-headline-sm font-black shrink-0">{initials(user.name || user.email)}</span>
              <div className="min-w-0 flex-1">
                <p className="type-body-md font-bold text-text-primary truncate">{user.name || t('profile.driver')}</p>
                <p className="type-body-sm text-text-muted truncate">{user.email}</p>
              </div>
              <button type="button" onClick={() => { onClose(); logout(); }} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-border text-text-secondary hover:text-racing-red type-label-telemetry uppercase tracking-wider transition-colors">
                <LogOut className="w-3.5 h-3.5" />{t('profile.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="type-body-md font-bold text-text-primary">{t('profile.guest')}</p>
                <p className="type-body-sm text-text-muted">{t('profile.guestHint')}</p>
              </div>
              <button type="button" onClick={() => { onClose(); requestLogin(); }} className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-racing-red text-white type-label-telemetry uppercase tracking-wider active:scale-95 transition-transform">
                <LogIn className="w-3.5 h-3.5" />{t('profile.login')}
              </button>
            </div>
          )}
        </section>

        {/* IDIOMA */}
        <section>
          <p className="type-label-telemetry uppercase tracking-widest text-text-muted mb-2">{t('profile.language')}</p>
          <Segmented
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'pt', label: 'Português' },
              { value: 'en', label: 'English' },
            ]}
          />
        </section>

        {/* INSTALAR */}
        {(install.canInstall || install.iosHint) && (
          <section className="rounded-xl bg-surface-container-low p-space-md">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-text-muted shrink-0"><Download className="w-5 h-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="type-body-md font-bold text-text-primary">{t('profile.install')}</p>
                <p className="type-body-sm text-text-muted">{install.canInstall ? t('profile.installHint') : t('profile.installIos')}</p>
              </div>
              {install.canInstall ? (
                <button type="button" onClick={() => void install.install()} disabled={install.installing} className="shrink-0 px-3.5 py-2 rounded-lg bg-racing-red text-white type-label-telemetry uppercase tracking-wider disabled:opacity-50 active:scale-95 transition-transform">{t('profile.installAction')}</button>
              ) : (
                <button type="button" onClick={install.dismissIosHint} className="shrink-0 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary type-label-telemetry uppercase tracking-wider">{t('common.dismiss')}</button>
              )}
            </div>
          </section>
        )}

        {/* ATALHOS */}
        <Link to={paths.champions} onClick={onClose} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-space-md hover:bg-surface-container transition-colors">
          <span className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-racing-red shrink-0"><Trophy className="w-5 h-5" /></span>
          <span className="min-w-0 flex-1">
            <span className="block type-body-md font-bold text-text-primary">{t('profile.champions')}</span>
            <span className="block type-body-sm text-text-muted">{t('profile.championsHint')}</span>
          </span>
          <ChevronRight className="w-4 h-4 text-text-muted" />
        </Link>

        {/* ABERTURA */}
        <button type="button" role="switch" aria-checked={!introOff} onClick={toggleIntro} className="w-full flex items-center gap-3 rounded-xl bg-surface-container-low p-space-md text-left">
          <span className="min-w-0 flex-1">
            <span className="block type-body-md font-bold text-text-primary">{t('profile.intro')}</span>
            <span className="block type-body-sm text-text-muted">{t('profile.introHint')}</span>
          </span>
          <span className={cn('relative w-11 h-6 rounded-full transition-colors shrink-0', introOff ? 'bg-surface-bright' : 'bg-racing-red')} aria-hidden>
            <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all', introOff ? 'left-0.5' : 'left-[22px]')} />
          </span>
        </button>

        {/* FAVORITOS */}
        <section>
          <button type="button" onClick={() => setFavoritesOpen((v) => !v)} aria-expanded={favoritesOpen} className="w-full flex items-center justify-between gap-3 py-1">
            <span className="type-headline-sm uppercase text-text-primary">{t('profile.favorites')}</span>
            <ChevronRight className={cn('w-4 h-4 text-text-muted transition-transform', favoritesOpen && 'rotate-90')} />
          </button>
          {favoritesOpen && (
            <div className="mt-3">
              {user ? (
                <FavoritesPicker />
              ) : (
                <div className="rounded-xl border border-dashed border-surface-border p-5 text-center">
                  <p className="type-body-sm text-text-muted">{t('profile.favoritesLogin')}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </Sheet>
  );
}
