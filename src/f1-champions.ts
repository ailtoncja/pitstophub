import type { Driver } from './types';

// Arte das cartas em public/champions/<id>.png

export type ChampionTeamStint = {
  name: string;
  years: string;
  championYears?: number[];
  series?: { pt: string; en: string };
  teamId?: string;
};

export type F1Champion = Driver & {
  championYears: number[];
  cardRating: number;
  careerWins: number;
  careerPodiums: number;
  careerPoles: number;
  careerStarts: number;
  careerFastestLaps: number;
  grayscalePhoto: boolean;
  teams: ChampionTeamStint[];
};

export const F1_CHAMPIONS: F1Champion[] = [
  {
    id: 'fittipaldi',
    name: 'Emerson Fittipaldi',
    number: '1',
    nationality: 'Brasil',
    teamId: 'mclaren',
    image: '/champions/fittipaldi.png',
    championYears: [1972, 1974],
    cardRating: 99,
    careerWins: 14,
    careerPodiums: 35,
    careerPoles: 6,
    careerStarts: 144,
    careerFastestLaps: 6,
    grayscalePhoto: false,
    teams: [
      { name: 'Lotus', years: '1970–1973', championYears: [1972] },
      { name: 'McLaren', years: '1974–1975', championYears: [1974], teamId: 'mclaren' },
      { name: 'Fittipaldi', years: '1976–1980' },
      { name: 'Patrick Racing', years: '1984–1990', championYears: [1989], series: { pt: 'CART / Indy 500', en: 'CART / Indy 500' } },
      { name: 'Penske', years: '1990–1996', championYears: [1993], series: { pt: 'CART / Indy 500', en: 'CART / Indy 500' } },
    ],
  },
  {
    id: 'piquet',
    name: 'Nelson Piquet',
    number: '5',
    nationality: 'Brasil',
    teamId: 'williams',
    image: '/champions/piquet.png',
    championYears: [1981, 1983, 1987],
    cardRating: 99,
    careerWins: 23,
    careerPodiums: 60,
    careerPoles: 24,
    careerStarts: 204,
    careerFastestLaps: 23,
    grayscalePhoto: false,
    teams: [
      { name: 'Ensign', years: '1978' },
      { name: 'McLaren', years: '1978', teamId: 'mclaren' },
      { name: 'Brabham', years: '1978–1985', championYears: [1981, 1983] },
      { name: 'Williams', years: '1986–1987', championYears: [1987], teamId: 'williams' },
      { name: 'Lotus', years: '1988–1989' },
      { name: 'Benetton', years: '1990–1991' },
    ],
  },
  {
    id: 'senna',
    name: 'Ayrton Senna',
    number: '1',
    nationality: 'Brasil',
    teamId: 'mclaren',
    image: '/champions/senna.png',
    championYears: [1988, 1990, 1991],
    cardRating: 99,
    careerWins: 41,
    careerPodiums: 80,
    careerPoles: 65,
    careerStarts: 161,
    careerFastestLaps: 19,
    grayscalePhoto: false,
    teams: [
      { name: 'Toleman', years: '1984' },
      { name: 'Lotus', years: '1985–1987' },
      { name: 'McLaren', years: '1988–1993', championYears: [1988, 1990, 1991], teamId: 'mclaren' },
      { name: 'Williams', years: '1994', teamId: 'williams' },
    ],
  },
];

export function findF1Champion(driverId: string | undefined): F1Champion | undefined {
  if (!driverId) return undefined;
  return F1_CHAMPIONS.find((champion) => champion.id === driverId);
}

export function isF1Champion(driverId: string | undefined): boolean {
  return Boolean(findF1Champion(driverId));
}
