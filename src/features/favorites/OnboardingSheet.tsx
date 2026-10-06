import { Sheet } from '../../components/Sheet';
import { useT } from '../../lib/i18n';
import { useSettings } from '../../state/settings';
import { FavoritesPicker } from './FavoritesPicker';

/** Primeira vez de uma conta nova: escolher quem acompanhar. Pular tambem encerra o onboarding. */
export function OnboardingSheet() {
  const { t } = useT();
  const { showOnboarding, finishOnboarding } = useSettings();

  return (
    <Sheet open={showOnboarding} onClose={finishOnboarding} title={t('onboarding.title')} closeLabel={t('onboarding.skip')} className="md:max-w-xl">
      <p className="type-body-sm text-text-muted mb-4">{t('onboarding.desc')}</p>
      <FavoritesPicker />
      <div className="sticky bottom-0 -mx-margin mt-6 px-margin py-3 flex items-center justify-end gap-3 bg-surface-raised/95 backdrop-blur border-t border-surface-border">
        <button type="button" onClick={finishOnboarding} className="px-4 py-2.5 type-label-badge uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">{t('onboarding.skip')}</button>
        <button type="button" onClick={finishOnboarding} className="px-5 py-2.5 rounded-lg bg-racing-red text-white type-label-badge uppercase tracking-wider active:scale-95 transition-transform">{t('onboarding.finish')}</button>
      </div>
    </Sheet>
  );
}
