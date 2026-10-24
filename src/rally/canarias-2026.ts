import { rallyMap, stage } from './build';
import { CANARIAS_2026_MAP } from './canarias-2026-map';
import type { RallyInfo } from './types';

const TZ = '+01:00';

export const CANARIAS_2026: RallyInfo = {
  id: 'canarias',
  dates: { start: '2026-04-23', end: '2026-04-26' },
  surface: 'tarmac',
  official: { stages: 18, km: 301.3 },
  itineraryVersion: 'v2.2 · 16/04/2026',
  servicePark: 'Estadio de Gran Canaria, Las Palmas',
  days: [
    {
      date: '2026-04-23',
      shakedown: { name: 'Shakedown "Santa Brígida"', km: 6.26, startsAt: `2026-04-23T11:01:00${TZ}` },
      stages: [
        stage(1, 'BP Ultimate – Las Palmas de Gran Canaria 1 (SSS)', 1.89, '2026-04-23', '18:05', TZ, 'ss1-8'),
      ],
    },
    {
      date: '2026-04-24',
      stages: [
        stage(2, 'Valleseco – Artenara 1', 13.13, '2026-04-24', '08:25', TZ, 'ss2-5'),
        stage(3, 'Tejeda – San Mateo 1', 18.62, '2026-04-24', '09:23', TZ, 'ss3-6'),
        stage(4, 'Mogán – La Aldea 1', 21.7, '2026-04-24', '11:16', TZ, 'ss4-7'),
        stage(5, 'Valleseco – Artenara 2', 13.13, '2026-04-24', '15:01', TZ, 'ss2-5'),
        stage(6, 'Tejeda – San Mateo 2', 18.62, '2026-04-24', '15:59', TZ, 'ss3-6'),
        stage(7, 'Mogán – La Aldea 2', 21.7, '2026-04-24', '17:52', TZ, 'ss4-7'),
        stage(8, 'BP Ultimate – Las Palmas de Gran Canaria 2 (SSS)', 1.89, '2026-04-24', '20:25', TZ, 'ss1-8'),
      ],
    },
    {
      date: '2026-04-25',
      stages: [
        stage(9, 'Maspalomas 1', 13.47, '2026-04-25', '08:20', TZ, 'ss9-12'),
        stage(10, 'Arucas – Firgas – Teror 1', 13.74, '2026-04-25', '09:35', TZ, 'ss10-13'),
        stage(11, 'Moya – Gáldar 1', 28.9, '2026-04-25', '10:51', TZ, 'ss11-14'),
        stage(12, 'Maspalomas 2', 13.47, '2026-04-25', '14:50', TZ, 'ss9-12'),
        stage(13, 'Arucas – Firgas – Teror 2', 13.74, '2026-04-25', '16:05', TZ, 'ss10-13'),
        stage(14, 'Moya – Gáldar 2', 28.9, '2026-04-25', '17:21', TZ, 'ss11-14'),
      ],
    },
    {
      date: '2026-04-26',
      stages: [
        stage(15, 'Ingenio – Telde – Valsequillo 1', 25.93, '2026-04-26', '07:35', TZ, 'ss15-17'),
        stage(16, 'Santa Lucía – Agüimes 1', 13.27, '2026-04-26', '09:05', TZ, 'ss16-18'),
        stage(17, 'Ingenio – Telde – Valsequillo 2', 25.93, '2026-04-26', '10:50', TZ, 'ss15-17'),
        stage(18, 'Santa Lucía – Agüimes 2', 13.27, '2026-04-26', '13:15', TZ, 'ss16-18', true),
      ],
    },
  ],
  map: rallyMap(CANARIAS_2026_MAP, {
    'ss1-8': { label: 'SS1/8', at: [809, 150], anchor: 'left' },
    'ss2-5': { label: 'SS2/5', at: [466, 244], anchor: 'right' },
    'ss3-6': { label: 'SS3/6', at: [552, 301], anchor: 'center' },
    'ss4-7': { label: 'SS4/7', at: [329, 325], anchor: 'right' },
    'ss9-12': { label: 'SS9/12', at: [587, 450], anchor: 'left' },
    'ss10-13': { label: 'SS10/13', at: [651, 236], anchor: 'left' },
    'ss11-14': { label: 'SS11/14', at: [472, 128], anchor: 'right' },
    'ss15-17': { label: 'SS15/17', at: [745, 311], anchor: 'left' },
    'ss16-18': { label: 'SS16/18', at: [717, 373], anchor: 'left' },
  }),
  mapNote: { pt: 'O organizador publica o traçado, mas os termos de uso do site não permitem reproduzi-lo sem autorização.', en: 'The organiser publishes the routes, but its site terms do not allow reproducing them without permission.' },
  sources: [
    { label: 'Itinerário oficial (v2.2 · 16/04/2026)', url: 'https://rallyislascanarias.com/es/pdf2026/ITINERARY.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://rallyislascanarias.com/pdf2026/REGLAMENTO_PARTICULAR-RIC-2026-ESP.pdf' },
    { label: 'Parque de assistência', url: 'https://rallyislascanarias.com/es/wp-content/uploads/2026/01/RALLY-GUIDE-1-1.pdf' },
    { label: 'Largada e chegada das especiais (mapas do organizador)', url: 'https://rallyislascanarias.com/es/participantes/' },
  ],
};
