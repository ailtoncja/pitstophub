import { rallyMap, stage } from './build';
import { SARDEGNA_2026_MAP } from './sardegna-2026-map';
import type { RallyInfo } from './types';

// Rally Italia Sardegna 2026 (1-4 out., Alghero), 13a e ultima etapa do WRC 2026.
// Especiais, km e horarios: "Tabella distanze e tempi / Itinerary" V. 5.1 de 14/09/2026 do organizador.
// Tracado: mapas "Accessi" (Google My Maps) ligados em cada pagina da Guida alle PS do site oficial.
const TZ = '+02:00';

export const SARDEGNA_2026: RallyInfo = {
  id: 'sardegna',
  dates: { start: '2026-10-01', end: '2026-10-04' },
  surface: 'gravel',
  official: { stages: 17, km: 307.15 },
  itineraryVersion: 'V5.1 · 14/09/2026',
  servicePark: 'Alghero · Banchina Millelire e Piazzale della Pace',
  days: [
    {
      date: '2026-10-01',
      shakedown: { name: 'Monte Baranta', km: 3.27, startsAt: `2026-10-01T09:01:00${TZ}` },
      stages: [stage(1, 'Ittiri Arena Show', 2.21, '2026-10-01', '16:05', TZ, 'ss1')],
    },
    {
      date: '2026-10-02',
      stages: [
        stage(2, 'Tula – Erula 1', 18.77, '2026-10-02', '08:01', TZ, 'ss2-5'),
        stage(3, 'Su Filigosu – Lerno 1', 17.83, '2026-10-02', '09:01', TZ, 'ss3-6'),
        stage(4, 'Monti di Alà – Sa Conchedda – Lerno 1', 23.23, '2026-10-02', '10:08', TZ, 'ss4-7'),
        stage(5, 'Tula – Erula 2', 18.77, '2026-10-02', '14:31', TZ, 'ss2-5'),
        stage(6, 'Su Filigosu – Lerno 2', 17.83, '2026-10-02', '15:31', TZ, 'ss3-6'),
        stage(7, 'Monti di Alà – Sa Conchedda – Lerno 2', 23.23, '2026-10-02', '16:38', TZ, 'ss4-7'),
      ],
    },
    {
      date: '2026-10-03',
      stages: [
        stage(8, 'Lerno – Sa Conchedda – Monti di Alà 1', 24.14, '2026-10-03', '08:01', TZ, 'ss8-11'),
        stage(9, 'Coiluna – Loelle 1', 24.83, '2026-10-03', '09:11', TZ, 'ss9-12'),
        stage(10, 'Solorchè 1', 12.86, '2026-10-03', '10:07', TZ, 'ss10-13'),
        stage(11, 'Lerno – Sa Conchedda – Monti di Alà 2', 24.14, '2026-10-03', '14:31', TZ, 'ss8-11'),
        stage(12, 'Coiluna – Loelle 2', 24.83, '2026-10-03', '15:41', TZ, 'ss9-12'),
        stage(13, 'Solorchè 2', 12.86, '2026-10-03', '16:37', TZ, 'ss10-13'),
      ],
    },
    {
      date: '2026-10-04',
      stages: [
        stage(14, 'Osilo – Tergu 1', 23.71, '2026-10-04', '08:31', TZ, 'ss14-16'),
        stage(15, 'Sassari – Argentiera 1', 7.1, '2026-10-04', '10:05', TZ, 'ss15-17'),
        stage(16, 'Osilo – Tergu 2', 23.71, '2026-10-04', '11:38', TZ, 'ss14-16'),
        stage(17, 'Sassari – Argentiera 2', 7.1, '2026-10-04', '14:15', TZ, 'ss15-17', true),
      ],
    },
  ],
  map: rallyMap(SARDEGNA_2026_MAP, {
    ss1: { label: 'SS1', at: [372, 352], anchor: 'left' },
    'ss2-5': { label: 'SS2/5', at: [680, 132], anchor: 'left' },
    'ss3-6': { label: 'SS3/6', at: [752, 262], anchor: 'right' },
    'ss4-7': { label: 'SS4/7', at: [874, 150], anchor: 'center', from: 'start' },
    'ss8-11': { label: 'SS8/11', at: [992, 215], anchor: 'right', from: 'finish' },
    'ss9-12': { label: 'SS9/12', at: [992, 422], anchor: 'right' },
    'ss10-13': { label: 'SS10/13', at: [770, 466], anchor: 'center' },
    'ss14-16': { label: 'SS14/16', at: [474, 120], anchor: 'left' },
    'ss15-17': { label: 'SS15/17', at: [86, 206], anchor: 'left' },
  }),
  sources: [
    { label: 'Itinerário oficial V5.1 (Rally Italia Sardegna)', url: 'https://rallyitaliasardegna.com/download/tabella-distanze-e-tempi-itinerary/?wpdmdl=2774' },
    { label: 'Guia das especiais e mapas oficiais (Google My Maps)', url: 'https://rallyitaliasardegna.com/guida-alle-ps-spettatori/' },
    { label: 'Rally Guide 2: parque de assistência', url: 'https://rallyitaliasardegna.com/download/rally-guide-2-eng/?wpdmdl=2959' },
    { label: 'Piso: "prove su sterrato" (site oficial)', url: 'https://rallyitaliasardegna.com/guida_alle_ps/sss1-ittiri-arena-show/' },
  ],
};
