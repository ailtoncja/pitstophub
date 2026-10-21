import { stage } from './build';
import type { RallyInfo } from './types';

const TZ = '-03:00';

export const CHILE_2026: RallyInfo = {
  id: 'chile',
  dates: { start: '2026-09-10', end: '2026-09-13' },
  surface: 'gravel',
  official: { stages: 16, km: 311.18 },
  itineraryVersion: 'v1.0.2 · 10/08/2026',
  servicePark: 'Concepción',
  days: [
    {
      date: '2026-09-10',
      shakedown: { name: 'El Manzano', km: 5.76, startsAt: `2026-09-10T11:00:00${TZ}` },
      stages: [
      ],
    },
    {
      date: '2026-09-11',
      stages: [
        stage(1, 'Turquia 1', 22.94, '2026-09-11', '08:53', TZ),
        stage(2, 'Nuevo Rere 1', 10.76, '2026-09-11', '09:48', TZ),
        stage(3, 'Hualqui 1', 16.69, '2026-09-11', '10:36', TZ),
        stage(4, 'Turquia 2', 22.94, '2026-09-11', '15:09', TZ),
        stage(5, 'Nuevo Rere 2', 10.76, '2026-09-11', '16:04', TZ),
        stage(6, 'Hualqui 2', 16.69, '2026-09-11', '16:52', TZ),
      ],
    },
    {
      date: '2026-09-12',
      stages: [
        stage(7, 'Pelún 1', 15.65, '2026-09-12', '09:08', TZ),
        stage(8, 'Lota 1', 25.64, '2026-09-12', '10:01', TZ),
        stage(9, 'María las Cruces 1', 28.31, '2026-09-12', '11:05', TZ),
        stage(10, 'Pelún 2', 15.65, '2026-09-12', '15:08', TZ),
        stage(11, 'Lota 2', 25.64, '2026-09-12', '16:01', TZ),
        stage(12, 'María las Cruces 2', 28.31, '2026-09-12', '17:05', TZ),
      ],
    },
    {
      date: '2026-09-13',
      stages: [
        stage(13, 'Carampangue 1', 26.82, '2026-09-13', '09:00', TZ),
        stage(14, 'BioBio 1', 8.78, '2026-09-13', '10:05', TZ),
        stage(15, 'Carampangue 2', 26.82, '2026-09-13', '11:13', TZ),
        stage(16, 'BioBio 2', 8.78, '2026-09-13', '13:15', TZ, undefined, true),
      ],
    },
  ],
  sources: [
    { label: 'Itinerário oficial (v1.0.2 · 10/08/2026)', url: 'https://webassets.redbull.com/media/r8TgPyrsRmdqyJWdNYQiE8/WRC/WRC%20events%202026/WRC_Chile-Itinrerary_v1.0.2.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://www.wrc.com/en/events/wrc-rally-chile-bio-bio-2026' },
    { label: 'Parque de assistência', url: 'https://www.wrc.com/en/events/wrc-rally-chile-bio-bio-2026' },
  ],
};
