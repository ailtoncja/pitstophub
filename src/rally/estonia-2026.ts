import { stage } from './build';
import type { RallyInfo } from './types';

const TZ = '+03:00';

export const ESTONIA_2026: RallyInfo = {
  id: 'estonia',
  dates: { start: '2026-07-16', end: '2026-07-19' },
  surface: 'gravel',
  official: { stages: 18, km: 301.8 },
  itineraryVersion: 'v1.0 · 13/04/2026',
  servicePark: 'Raadi (Eesti Rahva Muuseum), Tartu',
  days: [
    {
      date: '2026-07-17',
      shakedown: { name: 'Kastre', km: 4.08, startsAt: `2026-07-17T08:01:00${TZ}` },
      stages: [
        stage(1, 'Raanitsa 1', 21.45, '2026-07-17', '13:03', TZ),
        stage(2, 'Karaski 1', 11.97, '2026-07-17', '13:56', TZ),
        stage(3, 'Kanepi 1', 17.43, '2026-07-17', '14:49', TZ),
        stage(4, 'Raanitsa 2', 21.45, '2026-07-17', '16:46', TZ),
        stage(5, 'Karaski 2', 11.97, '2026-07-17', '17:39', TZ),
        stage(6, 'Kanepi 2', 17.43, '2026-07-17', '18:32', TZ),
        stage(7, 'Elva linn (SSS)', 1.72, '2026-07-17', '19:35', TZ),
      ],
    },
    {
      date: '2026-07-18',
      stages: [
        stage(8, 'Peipsiääre 1', 24.35, '2026-07-18', '09:56', TZ),
        stage(9, 'Mustvee 1', 10.67, '2026-07-18', '10:49', TZ),
        stage(10, 'Peipsiääre 2', 24.35, '2026-07-18', '12:10', TZ),
        stage(11, 'Mustvee 2', 10.67, '2026-07-18', '13:03', TZ),
        stage(12, 'Kambja 1', 23.74, '2026-07-18', '15:48', TZ),
        stage(13, 'Otepää 1', 15.16, '2026-07-18', '17:05', TZ),
        stage(14, 'Kambja 2', 23.74, '2026-07-18', '17:58', TZ),
        stage(15, 'Otepää 2', 15.16, '2026-07-18', '19:05', TZ),
        stage(16, 'Tartu vald (SSS)', 1.76, '2026-07-18', '20:35', TZ),
      ],
    },
    {
      date: '2026-07-19',
      stages: [
        stage(17, 'Kääriku 1', 24.39, '2026-07-19', '11:05', TZ),
        stage(18, 'Kääriku 2', 24.39, '2026-07-19', '13:15', TZ, undefined, true),
      ],
    },
  ],
  sources: [
    { label: 'Itinerário oficial (v1.0 · 13/04/2026)', url: 'https://www.rallyestonia.ee/userfiles/Itinerary_v_1_0_-_13_4_2026.pdf' },
    { label: 'Total de especiais e km', url: 'https://www.rallyestonia.ee/userfiles/WRCRE2026_SR_v3_0_1505.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://www.rallyestonia.ee/userfiles/WRCRE2026_SR_v3_0_1505.pdf' },
    { label: 'Parque de assistência', url: 'https://www.rallyestonia.ee/userfiles/WRCRE2026_SR_v3_0_1505.pdf' },
  ],
};
