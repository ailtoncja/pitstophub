import { stage } from './build';
import type { RallyInfo } from './types';

const TZ = '+09:00';

export const JAPAN_2026: RallyInfo = {
  id: 'japan',
  dates: { start: '2026-05-28', end: '2026-05-31' },
  surface: 'tarmac',
  official: { stages: 20, km: 302.82 },
  itineraryVersion: 'Bulletin 3, v3.0 · 26/05/2026',
  servicePark: 'Toyota Stadium, Toyota',
  days: [
    {
      date: '2026-05-28',
      shakedown: { name: 'Kuragaike Park', km: 2.53, startsAt: `2026-05-28T08:01:00${TZ}` },
      stages: [
      ],
    },
    {
      date: '2026-05-29',
      stages: [
        stage(1, 'Asuke 1', 12.9, '2026-05-29', '08:03', TZ),
        stage(2, 'Isegami\'s Tunnel 1', 24.29, '2026-05-29', '08:46', TZ),
        stage(3, 'Inabu/Shitara 1', 17.08, '2026-05-29', '10:09', TZ),
        stage(4, 'Asuke 2', 12.9, '2026-05-29', '13:57', TZ),
        stage(5, 'Isegami\'s Tunnel 2', 24.29, '2026-05-29', '14:40', TZ),
        stage(6, 'Inabu/Shitara 2', 17.08, '2026-05-29', '16:03', TZ),
      ],
    },
    {
      date: '2026-05-30',
      stages: [
        stage(7, 'Obara 1', 16.44, '2026-05-30', '07:41', TZ),
        stage(8, 'Ena 1', 21.16, '2026-05-30', '08:54', TZ),
        stage(9, 'Mt. Kasagi 1', 19.32, '2026-05-30', '10:35', TZ),
        stage(10, 'Mt. Kasagi 2', 19.32, '2026-05-30', '13:05', TZ),
        stage(11, 'Ena 2', 21.16, '2026-05-30', '14:38', TZ),
        stage(12, 'Obara 2', 16.44, '2026-05-30', '15:56', TZ),
        stage(13, 'Fujioka SSS 1', 3.19, '2026-05-30', '17:15', TZ),
        stage(14, 'Fujioka SSS 2', 3.19, '2026-05-30', '17:38', TZ),
      ],
    },
    {
      date: '2026-05-31',
      stages: [
        stage(15, 'Nukata 1', 20.49, '2026-05-31', '08:14', TZ),
        stage(16, 'Lake Mikawako 1', 13.98, '2026-05-31', '09:05', TZ),
        stage(17, 'Kuragaike SSS 1', 2.56, '2026-05-31', '10:13', TZ),
        stage(18, 'Kuragaike SSS 2', 2.56, '2026-05-31', '10:32', TZ),
        stage(19, 'Nukata 2', 20.49, '2026-05-31', '12:30', TZ),
        stage(20, 'Lake Mikawako 2', 13.98, '2026-05-31', '14:15', TZ, undefined, true),
      ],
    },
  ],
  sources: [
    { label: 'Itinerário oficial (Bulletin 3, v3.0 · 26/05/2026; cópia do documento do organizador hospedada por motorone.gr)', url: 'https://www.motorone.gr/wp-content/uploads/2026/05/WRC-%CE%A0%CF%81%CF%8C%CE%B3%CF%81%CE%B1%CE%BC%CE%BC%CE%B1-%CE%A1%CE%AC%CE%BB%CE%BB%CF%85-%CE%99%CE%B1%CF%80%CF%89%CE%BD%CE%AF%CE%B1%CF%82-2026.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://app-cdn.sportity.com/e56da215-9b60-4a17-9233-a4acb98a3441/8c06cab3-dac4-46e0-94f1-b3f828bdb0c0_Supplementary%20Regulations%20Forum8%20Rally%20Japan%20HR.pdf' },
    { label: 'Parque de assistência', url: 'https://app-cdn.sportity.com/e56da215-9b60-4a17-9233-a4acb98a3441/8c06cab3-dac4-46e0-94f1-b3f828bdb0c0_Supplementary%20Regulations%20Forum8%20Rally%20Japan%20HR.pdf' },
  ],
};
