import type { F1Champion } from './f1-champions';

type F1ChampionCardProps = {
  champion: F1Champion;
  language: 'pt' | 'en';
  onOpen: () => void;
};

export function F1ChampionCard({ champion, onOpen }: F1ChampionCardProps) {
  const photo = champion.image || champion.cutout;

  return (
    <button type="button" onClick={onOpen} className="f1-icon-card cursor-pointer">
      {photo && (
        <img
          src={photo}
          alt={champion.name}
          className="f1-icon-card-art"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />
      )}
    </button>
  );
}
