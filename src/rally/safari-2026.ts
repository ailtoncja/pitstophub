import { rallyMap, stage } from './build';
import { SAFARI_2026_MAP } from './safari-2026-map';
import type { RallyInfo } from './types';

const TZ = '+03:00';

export const SAFARI_2026: RallyInfo = {
  id: 'safari',
  dates: { start: '2026-03-12', end: '2026-03-15' },
  surface: 'gravel',
  official: { stages: 20, km: 338.34 },
  itineraryVersion: 'V1.4 · 03/03/2026 + desvio de Loldia (07/03/2026)',
  servicePark: 'WRTI, Naivasha',
  days: [
    {
      date: '2026-03-12',
      shakedown: { name: 'WRTI Nawisa', km: 6.31, startsAt: `2026-03-12T08:01:00${TZ}` },
      stages: [
        stage(1, 'Camp Moran 1', 24.35, '2026-03-12', '16:05', TZ, 'ss1-3'),
        stage(2, 'Mzabibu 1', 8.86, '2026-03-12', '17:43', TZ, 'ss2-10'),
      ],
    },
    {
      date: '2026-03-13',
      stages: [
        stage(3, 'Camp Moran 2', 24.35, '2026-03-13', '07:33', TZ, 'ss1-3'),
        stage(4, 'Loldia 1', 18.95, '2026-03-13', '09:11', TZ, 'ss4-9'),
        stage(5, 'Kengen Geothermal 1', 13.16, '2026-03-13', '10:29', TZ, 'ss5-8'),
        stage(6, 'Kedong 1', 13.79, '2026-03-13', '11:22', TZ, 'ss6-7'),
        stage(7, 'Kedong 2', 13.79, '2026-03-13', '14:05', TZ, 'ss6-7'),
        stage(8, 'Kengen Geothermal 2', 13.16, '2026-03-13', '15:03', TZ, 'ss5-8'),
        stage(9, 'Loldia 2', 18.95, '2026-03-13', '16:01', TZ, 'ss4-9'),
        stage(10, 'Mzabibu 2', 8.86, '2026-03-13', '17:04', TZ, 'ss2-10'),
      ],
    },
    {
      date: '2026-03-14',
      stages: [
        stage(11, 'Soysambu 1', 24.94, '2026-03-14', '08:35', TZ, 'ss11-14'),
        stage(12, 'Elmenteita 1', 18.01, '2026-03-14', '09:35', TZ, 'ss12-15'),
        stage(13, 'Sleeping Warrior 1', 18.41, '2026-03-14', '10:33', TZ, 'ss13-16'),
        stage(14, 'Soysambu 2', 24.94, '2026-03-14', '15:05', TZ, 'ss11-14'),
        stage(15, 'Elmenteita 2', 18.01, '2026-03-14', '16:05', TZ, 'ss12-15'),
        stage(16, 'Sleeping Warrior 2', 18.41, '2026-03-14', '17:03', TZ, 'ss13-16'),
      ],
    },
    {
      date: '2026-03-15',
      stages: [
        stage(17, 'Oserengoni 1', 18.22, '2026-03-15', '08:09', TZ, 'ss17-19'),
        stage(18, 'Hell\'s Gate 1', 10.48, '2026-03-15', '09:35', TZ, 'ss18-20'),
        stage(19, 'Oserengoni 2', 18.22, '2026-03-15', '10:38', TZ, 'ss17-19'),
        stage(20, 'Hell\'s Gate 2', 10.48, '2026-03-15', '13:15', TZ, 'ss18-20', true),
      ],
    },
  ],
  map: rallyMap(SAFARI_2026_MAP, {
    'ss1-3': { label: 'SS1/3', at: [509, 184], anchor: 'left' },
    'ss2-10': { label: 'SS2/10', at: [600, 272], anchor: 'left' },
    'ss4-9': { label: 'SS4/9', at: [459, 320], anchor: 'right' },
    'ss5-8': { label: 'SS5/8', at: [427, 400], anchor: 'right' },
    'ss6-7': { label: 'SS6/7', at: [726, 418], anchor: 'left' },
    'ss11-14': { label: 'SS11/14', at: [447, 101], anchor: 'left' },
    'ss12-15': { label: 'SS12/15', at: [388, 92], anchor: 'right' },
    'ss13-16': { label: 'SS13/16', at: [375, 217], anchor: 'right' },
    'ss17-19': { label: 'SS17/19', at: [427, 491], anchor: 'right' },
    'ss18-20': { label: 'SS18/20', at: [629, 523], anchor: 'left' },
  }),
  mapNote: { pt: 'O KMZ oficial é anterior às últimas mudanças de percurso (como o desvio de Loldia em 07/03); por isso só largada e chegada, do road book de 04/03.', en: 'The official KMZ predates the last route changes (such as the Loldia reroute on 7 March), so only start and finish are shown, from the 4 March road book.' },
  sources: [
    { label: 'Itinerário oficial V1.4 (Road Book 1 V.2) e GPS de largada/chegada', url: 'https://safarirally.ke/storage/documents/TmGLVqossFlYfMAcvcgwFt3AeoWc1e2YYryn7quO.pdf' },
    { label: 'Desvio de Loldia (SS4/SS9: 25,04 → 18,95 km)', url: 'https://safarirally.ke/storage/documents/kwCdxPDtSSoHsY84Xh2mCQ3l5FmxlixTSMHQXWqh.pdf' },
    { label: 'Regulamento particular: piso, parque de assistência e Power Stage', url: 'https://app-cdn.sportity.com/eeee376d-7983-4824-aa9e-238a8ec6fd7c/83774de2-660a-4478-871d-8b721659710c_Supplementary%20Regulations%20-%20Safari%20Rally%20Kenya%202026.pdf' },
    { label: 'Documentos dos competidores (safarirally.ke)', url: 'https://safarirally.ke/competitors' },
  ],
};
