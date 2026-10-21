import { stage } from './build';
import type { RallyInfo } from './types';

const TZ = '+03:00';

export const FINLAND_2026: RallyInfo = {
  id: 'finland',
  dates: { start: '2026-07-30', end: '2026-08-02' },
  surface: 'gravel',
  official: { stages: 20, km: 316.04 },
  itineraryVersion: 'v1.1 · 16/04/2026',
  servicePark: 'Paviljonki, Jyväskylä',
  days: [
    {
      date: '2026-07-30',
      shakedown: { name: 'Ruuhimäki', km: 4.12, startsAt: `2026-07-30T09:01:00${TZ}` },
      stages: [
        stage(1, 'SSS Harju 1', 2.58, '2026-07-30', '19:05', TZ),
      ],
    },
    {
      date: '2026-07-31',
      stages: [
        stage(2, 'Laukaa 1', 18.16, '2026-07-31', '08:44', TZ),
        stage(3, 'Saarikas 1', 15.82, '2026-07-31', '09:45', TZ),
        stage(4, 'Sydänmaa 1', 19.04, '2026-07-31', '10:50', TZ),
        stage(5, 'Hoho 1', 9.55, '2026-07-31', '11:58', TZ),
        stage(6, 'Laukaa 2', 18.16, '2026-07-31', '14:48', TZ),
        stage(7, 'Saarikas 2', 15.82, '2026-07-31', '15:49', TZ),
        stage(8, 'Sydänmaa 2', 19.04, '2026-07-31', '16:54', TZ),
        stage(9, 'Hoho 2', 9.55, '2026-07-31', '18:05', TZ),
        stage(10, 'SSS Harju 2', 2.58, '2026-07-31', '19:05', TZ),
      ],
    },
    {
      date: '2026-08-01',
      stages: [
        stage(11, 'Parkkola 1', 16.76, '2026-08-01', '08:01', TZ),
        stage(12, 'Päijälä 1', 10.55, '2026-08-01', '09:42', TZ),
        stage(13, 'Västilä 1', 19.1, '2026-08-01', '10:36', TZ),
        stage(14, 'Leustu 1', 16.44, '2026-08-01', '12:05', TZ),
        stage(15, 'Parkkola 2', 16.76, '2026-08-01', '15:01', TZ),
        stage(16, 'Päijälä 2', 10.55, '2026-08-01', '16:42', TZ),
        stage(17, 'Västilä 2', 19.1, '2026-08-01', '17:36', TZ),
        stage(18, 'Leustu 2', 16.44, '2026-08-01', '19:05', TZ),
      ],
    },
    {
      date: '2026-08-02',
      stages: [
        stage(19, 'Himos-Jämsä 1', 30.02, '2026-08-02', '10:35', TZ),
        stage(20, 'Himos-Jämsä 2', 30.02, '2026-08-02', '13:15', TZ, undefined, true),
      ],
    },
  ],
  sources: [
    { label: 'Itinerário oficial (v1.1 · 16/04/2026)', url: 'https://sectorallyfinland.fi/wp-content/uploads/2026/05/SRF2026-SupRegs_A4_FINAL_20260521_web_v.3.0.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://sectorallyfinland.fi/wp-content/uploads/2026/05/SRF2026-SupRegs_A4_FINAL_20260521_web_v.3.0.pdf' },
    { label: 'Parque de assistência', url: 'https://sectorallyfinland.fi/en/service-park/' },
  ],
};
