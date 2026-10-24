import { rallyMap, stage } from './build';
import { CROATIA_2026_MAP } from './croatia-2026-map';
import type { RallyInfo } from './types';

const TZ = '+02:00';

export const CROATIA_2026: RallyInfo = {
  id: 'croatia',
  dates: { start: '2026-04-09', end: '2026-04-12' },
  surface: 'tarmac',
  official: { stages: 20, km: 300.28 },
  itineraryVersion: 'v1.0 · 08/02/2026',
  servicePark: 'Automotodrom Grobnik, Rijeka',
  days: [
    {
      date: '2026-04-09',
      shakedown: { name: 'Shakedown', km: 3.44, startsAt: `2026-04-09T10:01:00${TZ}` },
      stages: [
      ],
    },
    {
      date: '2026-04-10',
      stages: [
        stage(1, 'Vodice – Brest 1', 14.12, '2026-04-10', '09:13', TZ, 'ss1-5'),
        stage(2, 'Lake Butoniga – Motovun 1', 13.78, '2026-04-10', '10:11', TZ, 'ss2-6'),
        stage(3, 'Beram – Cerovlje 1', 23.78, '2026-04-10', '11:14', TZ, 'ss3-7'),
        stage(4, 'Učka 1', 11.75, '2026-04-10', '12:02', TZ, 'ss4-8'),
        stage(5, 'Vodice – Brest 2', 14.12, '2026-04-10', '15:15', TZ, 'ss1-5'),
        stage(6, 'Lake Butoniga – Motovun 2', 13.78, '2026-04-10', '16:13', TZ, 'ss2-6'),
        stage(7, 'Beram – Cerovlje 2', 23.78, '2026-04-10', '17:16', TZ, 'ss3-7'),
        stage(8, 'Učka 2', 11.75, '2026-04-10', '18:04', TZ, 'ss4-8'),
      ],
    },
    {
      date: '2026-04-11',
      stages: [
        stage(9, 'Platak 1', 16.26, '2026-04-11', '08:43', TZ, 'ss9-16'),
        stage(10, 'Ravna Gora – Skrad 1', 10.13, '2026-04-11', '09:41', TZ, 'ss10-15'),
        stage(11, 'Generalski Stol – Zdihovo 1', 22.48, '2026-04-11', '11:05', TZ, 'ss11-14'),
        stage(12, 'Pećurkovo Brdo – Mrežnički Novaki 1', 9.11, '2026-04-11', '12:03', TZ, 'ss12-13'),
        stage(13, 'Pećurkovo Brdo – Mrežnički Novaki 2', 9.11, '2026-04-11', '14:12', TZ, 'ss12-13'),
        stage(14, 'Generalski Stol – Zdihovo 2', 22.48, '2026-04-11', '15:05', TZ, 'ss11-14'),
        stage(15, 'Ravna Gora – Skrad 2', 10.13, '2026-04-11', '16:23', TZ, 'ss10-15'),
        stage(16, 'Platak 2', 16.26, '2026-04-11', '17:22', TZ, 'ss9-16'),
      ],
    },
    {
      date: '2026-04-12',
      stages: [
        stage(17, 'Bribir – Novi Vinodolski 1', 14.17, '2026-04-12', '08:05', TZ, 'ss17-19'),
        stage(18, 'Alan – Senj 1', 14.56, '2026-04-12', '09:05', TZ, 'ss18-20'),
        stage(19, 'Bribir – Novi Vinodolski 2', 14.17, '2026-04-12', '10:38', TZ, 'ss17-19'),
        stage(20, 'Alan – Senj 2', 14.56, '2026-04-12', '13:15', TZ, 'ss18-20', true),
      ],
    },
  ],
  map: rallyMap(CROATIA_2026_MAP, {
    'ss1-5': { label: 'SS1/5', at: [170, 85], anchor: 'left' },
    'ss2-6': { label: 'SS2/6', at: [113, 293], anchor: 'left' },
    'ss3-7': { label: 'SS3/7', at: [171, 371], anchor: 'left' },
    'ss4-8': { label: 'SS4/8', at: [158, 162], anchor: 'right' },
    'ss9-16': { label: 'SS9/16', at: [530, 222], anchor: 'left' },
    'ss10-15': { label: 'SS10/15', at: [586, 91], anchor: 'right' },
    'ss11-14': { label: 'SS11/14', at: [822, 244], anchor: 'center' },
    'ss12-13': { label: 'SS12/13', at: [821, 73], anchor: 'right' },
    'ss17-19': { label: 'SS17/19', at: [597, 322], anchor: 'left' },
    'ss18-20': { label: 'SS18/20', at: [662, 436], anchor: 'left' },
  }),
  mapNote: { pt: 'O organizador publica o traçado, mas os termos de uso do site não permitem reproduzi-lo sem autorização.', en: 'The organiser publishes the routes, but its site terms do not allow reproducing them without permission.' },
  sources: [
    { label: 'Itinerário oficial (v1.0 · 08/02/2026)', url: 'https://rally-croatia.com/uploads/files/cr26-itinerary-v1_0-08-02-2026.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://rally-croatia.com/uploads/files/cr26-supplementary-regulations.pdf' },
    { label: 'Parque de assistência', url: 'https://rally-croatia.com/uploads/files/cr26-rally-guide-1.pdf' },
    { label: 'Largada e chegada das especiais (mapas do organizador)', url: 'https://rally-croatia.com/en/spectators/special-stages-maps' },
  ],
};
