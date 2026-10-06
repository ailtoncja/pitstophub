import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { paths } from '../app/paths';
import { Segmented, SectionTitle } from '../components/ui';
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
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(paths.categories))} aria-label={t('common.back')} className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <header>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-[18px] h-[18px] text-racing-red" />
          <span className="type-label-telemetry uppercase tracking-widest text-text-muted">{t('champs.kicker')}</span>
        </div>
        <h1 className="type-display-hero uppercase italic font-black tracking-tighter text-text-primary leading-[0.95]">
          {t('champs.title1')} <span className="text-racing-red">{t('champs.title2')}</span>
        </h1>
        <p className="type-body-md text-text-secondary mt-2 max-w-xl">{t('champs.lead')}</p>
        <p className="type-label-telemetry uppercase text-text-muted mt-3 tracking-wider">
          {t('champs.count', { drivers: F1_CHAMPIONS.length, titles: totalTitles })}
        </p>
      </header>

      <div>
        <SectionTitle bar>{t('champs.gallery')}</SectionTitle>
        <Segmented
          className="mt-2"
          value={order}
          onChange={setOrder}
          options={[
            { value: 'titles', label: t('champs.byTitles') },
            { value: 'recent', label: t('champs.byRecent') },
            { value: 'wins', label: t('champs.byWins') },
          ]}
        />
      </div>

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
