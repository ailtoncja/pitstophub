import { rallyMap, stage } from './build';
import { MONTECARLO_2026_MAP } from './montecarlo-2026-map';
import type { RallyInfo } from './types';

const TZ = '+01:00';

export const MONTECARLO_2026: RallyInfo = {
  id: 'montecarlo',
  dates: { start: '2026-01-21', end: '2026-01-25' },
  surface: 'tarmac',
  official: { stages: 17, km: 339.15 },
  itineraryVersion: 'Versão 1 · 19/11/2025',
  servicePark: 'COSEC, Gap',
  days: [
    {
      date: '2026-01-21',
      shakedown: { name: 'Shakedown (Gap – Route de la Garde / Rabou)', km: 4.25, startsAt: `2026-01-21T14:01:00${TZ}` },
      stages: [
      ],
    },
    {
      date: '2026-01-22',
      stages: [
        stage(1, 'Toudon / Saint-Antonin', 21.9, '2026-01-22', '16:05', TZ, 'ss1'),
        stage(2, 'Esclangon / Seyne-les-Alpes', 23.8, '2026-01-22', '18:35', TZ, 'ss2'),
        stage(3, 'Vaumeilh / Claret 1', 15.06, '2026-01-22', '20:35', TZ, 'ss3-11'),
      ],
    },
    {
      date: '2026-01-23',
      stages: [
        stage(4, 'Laborel / Chauvac-Laux-Montaux 1', 17.95, '2026-01-23', '09:04', TZ, 'ss4-7'),
        stage(5, 'St-Nazaire-le-Désert / La Motte-Chalancon 1', 28.7, '2026-01-23', '10:32', TZ, 'ss5-8'),
        stage(6, 'La-Bâtie-des-Fonts / Aspremont 1', 17.79, '2026-01-23', '11:50', TZ, 'ss6-9'),
        stage(7, 'Laborel / Chauvac-Laux-Montaux 2', 17.95, '2026-01-23', '15:16', TZ, 'ss4-7'),
        stage(8, 'St-Nazaire-le-Désert / La Motte-Chalancon 2', 28.7, '2026-01-23', '16:44', TZ, 'ss5-8'),
        stage(9, 'La-Bâtie-des-Fonts / Aspremont 2', 17.79, '2026-01-23', '18:05', TZ, 'ss6-9'),
      ],
    },
    {
      date: '2026-01-24',
      stages: [
        stage(10, 'La Bréole / Bellaffaire 1', 29.93, '2026-01-24', '08:31', TZ, 'ss10-12'),
        stage(11, 'Vaumeilh / Claret 2', 15.06, '2026-01-24', '09:55', TZ, 'ss3-11'),
        stage(12, 'La Bréole / Bellaffaire 2', 29.93, '2026-01-24', '12:31', TZ, 'ss10-12'),
        stage(13, 'Monaco Circuit (SSS)', 2.69, '2026-01-24', '18:35', TZ, 'ss13'),
      ],
    },
    {
      date: '2026-01-25',
      stages: [
        stage(14, 'Col de Braus / La Cabanette 1', 12.5, '2026-01-25', '08:05', TZ, 'ss14-16'),
        stage(15, 'La Bollène-Vésubie / Moulinet 1', 23.45, '2026-01-25', '09:35', TZ, 'ss15-17'),
        stage(16, 'Col de Braus / La Cabanette 2', 12.5, '2026-01-25', '11:09', TZ, 'ss14-16'),
        stage(17, 'La Bollène-Vésubie / Moulinet 2', 23.45, '2026-01-25', '13:15', TZ, 'ss15-17', true),
      ],
    },
  ],
  map: rallyMap(MONTECARLO_2026_MAP, {
    'ss1': { label: 'SS1', at: [712, 421], anchor: 'right' },
    'ss2': { label: 'SS2', at: [479, 322], anchor: 'center' },
    'ss3-11': { label: 'SS3/11', at: [484, 256], anchor: 'left' },
    'ss4-7': { label: 'SS4/7', at: [196, 234], anchor: 'right' },
    'ss5-8': { label: 'SS5/8', at: [130, 144], anchor: 'center' },
    'ss6-9': { label: 'SS6/9', at: [318, 238], anchor: 'left' },
    'ss10-12': { label: 'SS10/12', at: [537, 159], anchor: 'left' },
    'ss13': { label: 'SS13', at: [855, 515], anchor: 'right' },
    'ss14-16': { label: 'SS14/16', at: [833, 350], anchor: 'right' },
    'ss15-17': { label: 'SS15/17', at: [878, 271], anchor: 'center' },
  }),
  sources: [
    { label: 'Itinerário oficial (Versão 1 · 19/11/2025)', url: 'https://www.rallye-infos.site/wp-content/uploads/2025/11/RAMC-2026-REGLEMENT-PARTICULIER.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://www.rallye-infos.site/wp-content/uploads/2025/11/RAMC-2026-REGLEMENT-PARTICULIER.pdf' },
    { label: 'Parque de assistência', url: 'https://www.rallye-infos.site/wp-content/uploads/2026/01/Guide-Rallye-Monte-Carlo-2026.pdf' },
    { label: 'Traçado das especiais (mapas do organizador)', url: 'https://acm.mc/epreuves/rallye-automobile-monte-carlo/espace-spectateurs/cartes/' },
  ],
};
