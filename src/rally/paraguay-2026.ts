import { rallyMap, stage } from './build';
import { PARAGUAY_2026_MAP } from './paraguay-2026-map';
import type { RallyInfo } from './types';

const TZ = '-03:00';

export const PARAGUAY_2026: RallyInfo = {
  id: 'paraguay',
  dates: { start: '2026-08-27', end: '2026-08-30' },
  surface: 'gravel',
  official: { stages: 22, km: 358.88 },
  itineraryVersion: 'v1',
  servicePark: 'Sambódromo de Encarnación',
  days: [
    {
      date: '2026-08-27',
      shakedown: { name: 'Carmen del Paraná', km: 5.6, startsAt: `2026-08-27T11:01:00${TZ}` },
      stages: [
      ],
    },
    {
      date: '2026-08-28',
      stages: [
        stage(1, 'Cambyreta 1', 24.65, '2026-08-28', '09:03', TZ, 'ss1-5'),
        stage(2, 'Nueva Alborada 1', 15.66, '2026-08-28', '09:56', TZ, 'ss2-6'),
        stage(3, 'Yerbateras 1', 33.88, '2026-08-28', '10:49', TZ, 'ss3-7'),
        stage(4, 'SSS Autodromo 1', 2.5, '2026-08-28', '11:50', TZ, 'ss4-8'),
        stage(5, 'Cambyreta 2', 24.65, '2026-08-28', '14:19', TZ, 'ss1-5'),
        stage(6, 'Nueva Alborada 2', 15.66, '2026-08-28', '15:12', TZ, 'ss2-6'),
        stage(7, 'Yerbateras 2', 33.88, '2026-08-28', '16:05', TZ, 'ss3-7'),
        stage(8, 'SSS Autodromo 2', 2.5, '2026-08-28', '17:18', TZ, 'ss4-8'),
      ],
    },
    {
      date: '2026-08-29',
      stages: [
        stage(9, 'Bella Vista 1', 21.15, '2026-08-29', '08:19', TZ, 'ss9-13'),
        stage(10, 'Bella Vista Sur 1', 11.57, '2026-08-29', '09:12', TZ, 'ss10-14'),
        stage(11, 'Hohenau 1', 19.4, '2026-08-29', '10:05', TZ, 'ss11-15'),
        stage(12, 'Trinidad 1', 15.0, '2026-08-29', '11:02', TZ, 'ss12-16'),
        stage(13, 'Bella Vista 2', 21.15, '2026-08-29', '14:16', TZ, 'ss9-13'),
        stage(14, 'Bella Vista Sur 2', 11.57, '2026-08-29', '15:09', TZ, 'ss10-14'),
        stage(15, 'Hohenau 2', 19.4, '2026-08-29', '16:05', TZ, 'ss11-15'),
        stage(16, 'Trinidad 2', 15.0, '2026-08-29', '17:02', TZ, 'ss12-16'),
        stage(17, 'SSS Encarnacion Costanera', 3.1, '2026-08-29', '18:05', TZ, 'ss17'),
      ],
    },
    {
      date: '2026-08-30',
      stages: [
        stage(18, 'Encarnacion 1', 10.26, '2026-08-30', '07:05', TZ, 'ss18-22'),
        stage(19, 'Artigas 1', 19.6, '2026-08-30', '08:38', TZ, 'ss19-21'),
        stage(20, 'Artigas Oeste', 8.44, '2026-08-30', '10:51', TZ, 'ss20'),
        stage(21, 'Artigas 2', 19.6, '2026-08-30', '11:43', TZ, 'ss19-21'),
        stage(22, 'Encarnacion 2', 10.26, '2026-08-30', '14:15', TZ, 'ss18-22', true),
      ],
    },
  ],
  map: rallyMap(PARAGUAY_2026_MAP, {
    'ss1-5': { label: 'SS1/5', at: [650, 496], anchor: 'left' },
    'ss2-6': { label: 'SS2/6', at: [731, 421], anchor: 'left' },
    'ss3-7': { label: 'SS3/7', at: [732, 360], anchor: 'left' },
    'ss4-8': { label: 'SS4/8', at: [496, 283], anchor: 'right' },
    'ss9-13': { label: 'SS9/13', at: [791, 56], anchor: 'right' },
    'ss10-14': { label: 'SS10/14', at: [793, 136], anchor: 'right' },
    'ss11-15': { label: 'SS11/15', at: [612, 204], anchor: 'right' },
    'ss12-16': { label: 'SS12/16', at: [702, 279], anchor: 'left' },
    'ss17': { label: 'SS17', at: [346, 440], anchor: 'right' },
    'ss18-22': { label: 'SS18/22', at: [422, 348], anchor: 'right' },
    'ss19-21': { label: 'SS19/21', at: [290, 90], anchor: 'left' },
    'ss20': { label: 'SS20', at: [181, 154], anchor: 'left' },
  }),
  sources: [
    { label: 'Itinerário oficial (v1)', url: 'https://webassets.redbull.com/media/r8TgPyrsRmdqyJWdNYQiE8/WRC/WRC%20events%202026/itinerary-paraguay-2026_1.pdf' },
    { label: 'Total de especiais e km', url: 'https://rallydelparaguay.com/wp-content/uploads/SUPPLEMENTARY-REGULATIONS-2026-10.6.2026.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://rallydelparaguay.com/wp-content/uploads/SUPPLEMENTARY-REGULATIONS-2026-10.6.2026.pdf' },
    { label: 'Parque de assistência', url: 'https://rallydelparaguay.com/wp-content/uploads/rally-Guide-2_WRCpy2026-copy.pdf' },
    { label: 'Traçado das especiais (mapas do organizador)', url: 'https://rallydelparaguay.com/tramos-de-carrera/' },
  ],
};
