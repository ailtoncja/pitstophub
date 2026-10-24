import { stage } from './build';
import type { RallyInfo } from './types';

const TZ = '+01:00';

export const SWEDEN_2026: RallyInfo = {
  id: 'sweden',
  dates: { start: '2026-02-12', end: '2026-02-15' },
  surface: 'snow',
  official: { stages: 18, km: 300.66 },
  itineraryVersion: 'Vers 1.0 · 09/12/2025',
  servicePark: 'Nolia, Umeå',
  days: [
    {
      date: '2026-02-12',
      shakedown: { name: 'Shakedown Umeå City', km: 3.44, startsAt: `2026-02-12T10:01:00${TZ}` },
      stages: [
        stage(1, 'Umeå 1', 10.23, '2026-02-12', '19:05', TZ),
      ],
    },
    {
      date: '2026-02-13',
      stages: [
        stage(2, 'Bygdsiljum 1', 27.55, '2026-02-13', '10:07', TZ),
        stage(3, 'Andersvattnet 1', 20.51, '2026-02-13', '11:08', TZ),
        stage(4, 'Bäck 1', 11.53, '2026-02-13', '12:16', TZ),
        stage(5, 'Bygdsiljum 2', 27.55, '2026-02-13', '15:40', TZ),
        stage(6, 'Andersvattnet 2', 20.51, '2026-02-13', '16:41', TZ),
        stage(7, 'Bäck 2', 11.53, '2026-02-13', '17:49', TZ),
        stage(8, 'Umeå Sprint 1', 5.7, '2026-02-13', '19:05', TZ),
      ],
    },
    {
      date: '2026-02-14',
      stages: [
        stage(9, 'Vännäs 1', 15.7, '2026-02-14', '10:10', TZ),
        stage(10, 'Sarsjöliden 1', 16.72, '2026-02-14', '11:05', TZ),
        stage(11, 'Kolksele 1', 16.94, '2026-02-14', '11:59', TZ),
        stage(12, 'Vännäs 2', 15.7, '2026-02-14', '15:10', TZ),
        stage(13, 'Sarsjöliden 2', 16.72, '2026-02-14', '16:05', TZ),
        stage(14, 'Kolksele 2', 16.94, '2026-02-14', '16:59', TZ),
        stage(15, 'Umeå Sprint 2', 5.7, '2026-02-14', '18:05', TZ),
      ],
    },
    {
      date: '2026-02-15',
      stages: [
        stage(16, 'Västervik 1', 25.45, '2026-02-15', '07:33', TZ),
        stage(17, 'Västervik 2', 25.45, '2026-02-15', '10:11', TZ),
        stage(18, 'Umeå 2', 10.23, '2026-02-15', '12:15', TZ, undefined, true),
      ],
    },
  ],
  sources: [
    { label: 'Itinerário oficial (Vers 1.0 · 09/12/2025)', url: 'https://rallysweden.com/wp-content/uploads/2026/01/rally-guide-2-2026-appendix-1-itineraries.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://app-cdn.sportity.com/3b4955bc-7370-43db-a870-7c95fc5208df/ac2eaa08-df32-4be5-b4b4-4202b53496ea_Supplementary%20Regulations.pdf' },
    { label: 'Parque de assistência', url: 'https://rallysweden.com/wp-content/uploads/2026/01/rally-guide-2-2026-1.pdf' },
  ],
};
