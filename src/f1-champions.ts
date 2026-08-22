import type { Driver } from './types';

export type F1Champion = Driver & {
  championYears: number[];
  cardRating: number;
  careerWins: number;
  careerPodiums: number;
  careerPoles: number;
  careerStarts: number;
  careerFastestLaps: number;
  grayscalePhoto: boolean;
};

export const F1_CHAMPIONS: F1Champion[] = [
  {
    id: 'senna',
    name: 'Ayrton Senna',
    number: '1',
    nationality: 'Brasil',
    teamId: 'mclaren',
    image: 'https://r2.thesportsdb.com/images/media/player/thumb/ta00pl1749884913.jpg',
    cutout: 'https://r2.thesportsdb.com/images/media/player/cutout/sw5a8z1657203008.png',
    championYears: [1988, 1990, 1991],
    cardRating: 98,
    careerWins: 41,
    careerPodiums: 80,
    careerPoles: 65,
    careerStarts: 161,
    careerFastestLaps: 19,
    grayscalePhoto: true,
  },
];

export function findF1Champion(driverId: string | undefined): F1Champion | undefined {
  if (!driverId) return undefined;
  return F1_CHAMPIONS.find((champion) => champion.id === driverId);
}

export function isF1Champion(driverId: string | undefined): boolean {
  return Boolean(findF1Champion(driverId));
}
