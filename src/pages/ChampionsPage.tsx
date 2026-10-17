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
    <div className="px-margin lg:px-0 pb-12 pt-3 lg:pt-8 space-y-6 page-in">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.category('f1')))}
        className="inline-flex items-center gap-2 h-11 -ml-2 px-2 rounded-full text-silver hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="type-label-badge text-[0.875rem]">{t('common.back')}</span>
      </button>

      <header className="space-y-2">
        <h1 className="type-headline-lg lg:text-[2.25rem] text-white">
          {t('champs.title1')} {t('champs.title2')}
        </h1>
        <p className="type-body-lg text-silver max-w-[60ch]">{t('champs.lead')}</p>
        <p className="type-body-sm text-silver-dim">{t('champs.count', { drivers: F1_CHAMPIONS.length, titles: totalTitles })}</p>
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

      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8 justify-items-center">
        {champions.map((champion) => (
          <li key={champion.id} className="w-full flex flex-col items-center gap-2.5">
            <F1ChampionCard champion={champion} language={lang} onOpen={() => navigate(paths.driver('f1', champion.id))} />
            <Link to={paths.driver('f1', champion.id)} className="type-body-sm text-silver text-center hover:text-white transition-colors">
              {champion.name}{champion.championYears.length > 0 ? ` · ${champion.championYears.length}x` : ''}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
