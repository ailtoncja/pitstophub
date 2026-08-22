import { Crown } from 'lucide-react';
import { flagForNationality } from './nationality-flags';
import type { F1Champion } from './f1-champions';

type F1ChampionCardProps = {
  champion: F1Champion;
  language: 'pt' | 'en';
  onOpen: () => void;
};

export function F1ChampionCard({ champion, language, onOpen }: F1ChampionCardProps) {
  const lastName = champion.name.split(' ').slice(-1)[0]?.toUpperCase() ?? champion.name.toUpperCase();
  const photo = champion.image || champion.cutout;
  const stats = [
    { value: champion.championYears.length, label: language === 'pt' ? 'TÍT' : 'TIT' },
    { value: champion.careerPoles, label: language === 'pt' ? 'POL' : 'POL' },
    { value: champion.careerWins, label: language === 'pt' ? 'VIT' : 'WIN' },
    { value: champion.careerPodiums, label: language === 'pt' ? 'PÓD' : 'POD' },
    { value: champion.careerStarts, label: 'GP' },
    { value: champion.careerFastestLaps, label: language === 'pt' ? 'VMR' : 'FL' },
  ];

  return (
    <button type="button" onClick={onOpen} className="f1-icon-card cursor-pointer text-left">
      <div className="f1-icon-card-inner">
        {photo && (
          <img
            src={photo}
            alt={champion.name}
            className={champion.grayscalePhoto ? 'f1-icon-card-photo grayscale contrast-125' : 'f1-icon-card-photo'}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        )}
        <div className="f1-icon-card-fade" />
        <div className="f1-icon-card-meta">
          <div className="font-apex text-[2.75rem] font-extrabold leading-none text-[#2b2416]">
            {champion.cardRating}
          </div>
          <div className="font-apex-mono text-[11px] font-bold tracking-[0.2em] text-[#2b2416] mt-0.5">
            F1
          </div>
          <div className="text-lg leading-none mt-1.5">{flagForNationality(champion.nationality)}</div>
          <div className="f1-icon-card-badge mt-1.5">
            <Crown className="w-3 h-3" />
          </div>
        </div>
        <div className="f1-icon-card-footer">
          <div className="font-apex text-[1.35rem] font-extrabold italic tracking-[0.18em] text-[#2b2416]">
            {lastName}
          </div>
          <div className="f1-icon-card-rule" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-baseline justify-center gap-1.5">
                <span className="font-apex text-sm font-extrabold text-[#2b2416]">{stat.value}</span>
                <span className="font-apex-mono text-[9px] font-semibold tracking-widest text-[#5a4d32]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
