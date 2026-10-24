import { rallyMap, stage } from './build';
import { PORTUGAL_2026_MAP } from './portugal-2026-map';
import type { RallyInfo } from './types';

const TZ = '+01:00';

export const PORTUGAL_2026: RallyInfo = {
  id: 'portugal',
  dates: { start: '2026-05-06', end: '2026-05-10' },
  surface: 'gravel',
  official: { stages: 23, km: 344.91 },
  itineraryVersion: 'Bulletin 1, V3 · 22/04/2026',
  servicePark: 'Exponor, Matosinhos',
  days: [
    {
      date: '2026-05-06',
      shakedown: { name: 'Baltar (Shakedown)', km: 5.72, startsAt: `2026-05-06T15:01:00${TZ}` },
      stages: [
      ],
    },
    {
      date: '2026-05-07',
      stages: [
        stage(1, 'Águeda / Sever', 15.08, '2026-05-07', '15:05', TZ, 'ss1'),
        stage(2, 'Sever / Albergaria', 20.24, '2026-05-07', '16:05', TZ, 'ss2'),
        stage(3, 'Figueira da Foz (SSS)', 1.93, '2026-05-07', '18:05', TZ),
      ],
    },
    {
      date: '2026-05-08',
      stages: [
        stage(4, 'Mortágua 1', 14.59, '2026-05-08', '07:35', TZ, 'ss4-10'),
        stage(5, 'Arganil 1', 18.62, '2026-05-08', '08:55', TZ, 'ss5-7'),
        stage(6, 'Lousã 1', 7.07, '2026-05-08', '10:13', TZ, 'ss6-9'),
        stage(7, 'Arganil 2', 18.62, '2026-05-08', '12:30', TZ, 'ss5-7'),
        stage(8, 'Góis', 15.66, '2026-05-08', '13:25', TZ, 'ss8'),
        stage(9, 'Lousã 2', 7.07, '2026-05-08', '14:08', TZ, 'ss6-9'),
        stage(10, 'Mortágua 2', 14.59, '2026-05-08', '15:45', TZ, 'ss4-10'),
      ],
    },
    {
      date: '2026-05-09',
      stages: [
        stage(11, 'Felgueiras 1', 8.81, '2026-05-09', '07:00', TZ, 'ss11-15'),
        stage(12, 'Cabeceiras de Basto 1', 19.91, '2026-05-09', '08:05', TZ, 'ss12-16'),
        stage(13, 'Amarante 1', 26.24, '2026-05-09', '09:35', TZ, 'ss13-17'),
        stage(14, 'Paredes 1', 16.09, '2026-05-09', '11:05', TZ, 'ss14-18'),
        stage(15, 'Felgueiras 2', 8.81, '2026-05-09', '14:00', TZ, 'ss11-15'),
        stage(16, 'Cabeceiras de Basto 2', 19.91, '2026-05-09', '15:05', TZ, 'ss12-16'),
        stage(17, 'Amarante 2', 26.24, '2026-05-09', '16:35', TZ, 'ss13-17'),
        stage(18, 'Paredes 2', 16.09, '2026-05-09', '18:05', TZ, 'ss14-18'),
        stage(19, 'Lousada (SSS)', 3.78, '2026-05-09', '19:05', TZ),
      ],
    },
    {
      date: '2026-05-10',
      stages: [
        stage(20, 'Vieira do Minho 1', 21.6, '2026-05-10', '08:05', TZ, 'ss20-22'),
        stage(21, 'Fafe 1', 11.18, '2026-05-10', '09:35', TZ, 'ss21-23'),
        stage(22, 'Vieira do Minho 2', 21.6, '2026-05-10', '10:35', TZ, 'ss20-22'),
        stage(23, 'Fafe 2', 11.18, '2026-05-10', '13:15', TZ, 'ss21-23', true),
      ],
    },
  ],
  map: rallyMap(PORTUGAL_2026_MAP, {
    'ss1': { label: 'SS1', at: [463, 376], anchor: 'right' },
    'ss2': { label: 'SS2', at: [512, 349], anchor: 'left' },
    'ss4-10': { label: 'SS4/10', at: [565, 411], anchor: 'left' },
    'ss5-7': { label: 'SS5/7', at: [716, 472], anchor: 'left' },
    'ss6-9': { label: 'SS6/9', at: [511, 525], anchor: 'right' },
    'ss8': { label: 'SS8', at: [596, 491], anchor: 'left' },
    'ss11-15': { label: 'SS11/15', at: [489, 122], anchor: 'right' },
    'ss12-16': { label: 'SS12/16', at: [624, 54], anchor: 'left' },
    'ss13-17': { label: 'SS13/17', at: [712, 162], anchor: 'left' },
    'ss14-18': { label: 'SS14/18', at: [542, 235], anchor: 'left' },
    'ss20-22': { label: 'SS20/22', at: [510, 52], anchor: 'right' },
    'ss21-23': { label: 'SS21/23', at: [584, 114], anchor: 'left' },
  }),
  mapNote: { pt: 'O organizador publica o traçado, mas os termos de uso do site não permitem reproduzi-lo sem autorização. SS3 (Figueira da Foz) e SS19 (Lousada) sem localização publicada.', en: 'The organiser publishes the routes, but its site terms do not allow reproducing them without permission. SS3 (Figueira da Foz) and SS19 (Lousada) have no published location.' },
  sources: [
    { label: 'Itinerário oficial (Bulletin 1, V3 · 22/04/2026)', url: 'https://app-cdn.sportity.com/f8373579-6712-4123-bcbd-f8d31918619e/a0611b84-e860-49d7-8d86-1c2fe4d40d91_Bulletin%201.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://www.rallydeportugal.pt/ResourcesUser/Documentos/2026/Supplementary-Regulations---VRP-2026.pdf' },
    { label: 'Parque de assistência', url: 'https://www.rallydeportugal.pt/ResourcesUser/Documentos/2026/Supplementary-Regulations---VRP-2026.pdf' },
    { label: 'Largada e chegada das especiais (mapas do organizador)', url: 'https://www.rallydeportugal.pt/content.aspx?menuid=5552' },
  ],
};
