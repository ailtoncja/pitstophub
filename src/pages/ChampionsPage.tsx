import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { paths } from '../app/paths';
import { Segmented } from '../components/ui';
import { F1ChampionCard } from '../F1ChampionCard';
import { F1_CHAMPIONS } from '../f1-champions';
import { useScrollTopOn } from '../lib/hooks';
import { useT } from '../lib/i18n';

type Order = 'titles' | 'recent' | 'wins';

export default function ChampionsPage() {
  useScrollTopOn('champions');
  const { t, lang } = useT();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order>('titles');

  const champions = useMemo(() => {
    const list = [...F1_CHAMPIONS];
    const latest = (c: (typeof list)[number]) => Math.max(...c.championYears);
    if (order === 'titles') list.sort((a, b) => b.championYears.length - a.championYears.length || latest(b) - latest(a));
    else if (order === 'recent') list.sort((a, b) => latest(b) - latest(a));
    else list.sort((a, b) => b.careerWins - a.careerWins);
    return list;
  }, [order]);

  const totalTitles = F1_CHAMPIONS.reduce((sum, c) => sum + c.championYears.length, 0);

  return (
    <div className="flex flex-col w-full px-margin pb-10 gap-space-md page-in">
      <div className="pt-space-sm flex items-center">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.categories))} aria-label={t('common.back')} className="w-10 h-10 -ml-2 rounded-sm flex items-center justify-center text-primary hover:text-white active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <header className="space-y-2">
        <span className="type-label-badge uppercase tracking-widest text-on-surface-variant">{t('champs.kicker')}</span>
        <h1 className="type-headline-lg text-[34px] leading-9 uppercase text-on-surface">
          {t('champs.title1')} {t('champs.title2')}
        </h1>
        <p className="type-body-md text-primary max-w-xl">{t('champs.lead')}</p>
        <p className="type-label-badge uppercase text-on-surface-variant tracking-wider">
          {t('champs.count', { drivers: F1_CHAMPIONS.length, titles: totalTitles })}
        </p>
      </header>

      <Segmented
        className="w-fit"
        value={order}
        onChange={setOrder}
        options={[
          { value: 'titles', label: t('champs.byTitles') },
          { value: 'recent', label: t('champs.byRecent') },
          { value: 'wins', label: t('champs.byWins') },
        ]}
      />

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 justify-items-center">
        {champions.map((champion) => (
          <li key={champion.id} className="w-full flex flex-col items-center gap-2">
            <F1ChampionCard champion={champion} language={lang} onOpen={() => navigate(paths.driver('f1', champion.id))} />
            <Link to={paths.driver('f1', champion.id)} className="type-label-telemetry uppercase text-text-muted tracking-wider text-center hover:text-text-primary transition-colors">
              {champion.name}{champion.championYears.length > 0 ? ` • ${champion.championYears.length}x` : ''}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
