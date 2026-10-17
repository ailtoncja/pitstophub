import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { useT } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { getExistingPushSubscription, isIosPwaRequired, isPushSupported, sendTestNotification, subscribeToPush, unsubscribeFromPush } from '../../push';
import { useAuth } from '../../state/auth-context';
import { useSettings, type NotifyPrefs } from '../../state/settings';

type Status = 'checking' | 'unsupported' | 'ios' | 'subscribed' | 'not-subscribed' | 'busy';

const PREF_ROWS: { key: keyof NotifyPrefs; label: string }[] = [
  { key: 'notifyRaceDay', label: 'notif.raceDay' },
  { key: 'notifyT60', label: 'notif.t60' },
  { key: 'notifyStart', label: 'notif.start' },
  { key: 'notifyResults', label: 'notif.results' },
];

/** Ativar/desativar push no aparelho e escolher quais avisos chegam. Exige conta (a inscricao fica no servidor). */
export function NotificationsPanel() {
  const { t, lang } = useT();
  const { user, requestLogin } = useAuth();
  const { prefs, setNotify } = useSettings();
  const [status, setStatus] = useState<Status>('checking');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [testKey, setTestKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (isIosPwaRequired()) {
      setStatus('ios');
      return;
    }
    if (!isPushSupported()) {
      setStatus('unsupported');
      return;
    }
    getExistingPushSubscription().then((sub) => {
      if (mounted) setStatus(sub ? 'subscribed' : 'not-subscribed');
    });
    return () => {
      mounted = false;
    };
  }, []);

  const enable = async () => {
    if (!user) {
      requestLogin();
      return;
    }
    setStatus('busy');
    setErrorKey(null);
    setTestKey(null);
    const result = await subscribeToPush(user.id);
    if (result.ok) {
      setStatus('subscribed');
      return;
    }
    setStatus(isIosPwaRequired() ? 'ios' : 'not-subscribed');
    setErrorKey(result.reason === 'denied' ? 'notif.denied' : result.reason === 'unsupported' ? 'notif.unsupported' : 'notif.error');
  };

  const disable = async () => {
    setStatus('busy');
    setTestKey(null);
    await unsubscribeFromPush();
    setStatus('not-subscribed');
  };

  const test = async () => {
    setTestKey((await sendTestNotification(lang)) ? 'notif.testSent' : 'notif.testFail');
  };

  const hint = errorKey ? t(errorKey) : status === 'ios' ? t('notif.ios') : status === 'unsupported' ? t('notif.unsupported') : user ? t('notif.desc') : t('notif.needLogin');
  const subscribed = status === 'subscribed';

  return (
    <div className="rounded-lg bg-asphalt p-space-md">
      <div className="flex items-center gap-3">
        <div className={cn('w-11 h-11 rounded-lg shrink-0 flex items-center justify-center', subscribed ? 'bg-racing-red/15 text-signal' : 'bg-surface-container-high text-text-muted')}>
          {subscribed ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="type-body-md font-bold text-text-primary">{t('notif.title')}</p>
          <p className="type-body-sm text-text-muted">{hint}</p>
        </div>
        {status === 'unsupported' || status === 'ios' ? null : subscribed ? (
          <button type="button" onClick={() => void disable()} className="shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-full border border-white/25 text-text-secondary hover:text-signal type-label-telemetry transition-colors">
            <BellOff className="w-3.5 h-3.5" />{t('notif.disable')}
          </button>
        ) : (
          <button type="button" onClick={() => void enable()} disabled={status === 'checking' || status === 'busy'} className="shrink-0 px-4 h-9 rounded-full bg-white text-black type-label-badge disabled:opacity-50 active:scale-95 transition-all">
            {status === 'checking' ? t('notif.checking') : t('notif.enable')}
          </button>
        )}
      </div>

      {subscribed && (
        <div className="mt-4 pt-4 border-t border-hairline space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {PREF_ROWS.map((row) => (
              <button
                key={row.key}
                type="button"
                aria-pressed={prefs[row.key]}
                onClick={() => setNotify(row.key, !prefs[row.key])}
                className={cn(
                  'px-3 py-2 rounded-lg border text-left type-label-telemetry transition-colors',
                  prefs[row.key] ? 'bg-racing-red/10 border-racing-red/40 text-signal' : 'bg-surface-container-high border-transparent text-text-muted hover:text-text-primary',
                )}
              >
                {t(row.label)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => void test()} className="type-label-telemetry text-text-muted hover:text-signal transition-colors">{t('notif.test')}</button>
            {testKey && <span className="type-body-sm text-text-muted text-right">{t(testKey)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
