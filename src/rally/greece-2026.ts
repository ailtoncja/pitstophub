import { rallyMap, stage } from './build';
import { GREECE_2026_MAP } from './greece-2026-map';
import type { RallyInfo } from './types';

const TZ = '+03:00';

export const GREECE_2026: RallyInfo = {
  id: 'greece',
  dates: { start: '2026-06-25', end: '2026-06-28' },
  surface: 'gravel',
  official: { stages: 17, km: 323.31 },
  itineraryVersion: 'V2-1 · 25/04/2026',
  servicePark: 'EKO Service Park, Loutraki',
  days: [
    {
      date: '2026-06-25',
      shakedown: { name: 'Shakedown (near Loutraki)', km: 3.34, startsAt: `2026-06-25T09:01:00${TZ}` },
      stages: [
        stage(1, 'EKO SSS', 1.86, '2026-06-25', '19:05', TZ),
      ],
    },
    {
      date: '2026-06-26',
      stages: [
        stage(2, 'Bauxites', 22.97, '2026-06-26', '08:48', TZ, 'ss2'),
        stage(3, 'Parnassos Mt', 22.28, '2026-06-26', '09:51', TZ, 'ss3'),
        stage(4, 'Stiri 1', 24.18, '2026-06-26', '11:14', TZ, 'ss4-6'),
        stage(5, 'Elikon Mt', 17.8, '2026-06-26', '13:35', TZ, 'ss5'),
        stage(6, 'Stiri 2', 24.18, '2026-06-26', '14:46', TZ, 'ss4-6'),
        stage(7, 'Thiva', 17.81, '2026-06-26', '16:56', TZ, 'ss7'),
      ],
    },
    {
      date: '2026-06-27',
      stages: [
        stage(8, 'Ghymno 1', 19.6, '2026-06-27', '07:54', TZ, 'ss8-12'),
        stage(9, 'Kolines', 21.3, '2026-06-27', '09:19', TZ, 'ss9'),
        stage(10, 'Menalo Mt 1', 14.78, '2026-06-27', '11:05', TZ, 'ss10-13'),
        stage(11, 'Kefalari', 18.17, '2026-06-27', '12:58', TZ, 'ss11'),
        stage(12, 'Ghymno 2', 19.6, '2026-06-27', '16:39', TZ, 'ss8-12'),
        stage(13, 'Menalo Mt 2', 14.78, '2026-06-27', '19:05', TZ, 'ss10-13'),
      ],
    },
    {
      date: '2026-06-28',
      stages: [
        stage(14, 'Aghii Theodori 1', 25.39, '2026-06-28', '08:28', TZ, 'ss14-16'),
        stage(15, 'Loutraki 1', 16.61, '2026-06-28', '09:35', TZ, 'ss15-17'),
        stage(16, 'Aghii Theodori 2', 25.39, '2026-06-28', '12:10', TZ, 'ss14-16'),
        stage(17, 'Loutraki 2', 16.61, '2026-06-28', '14:15', TZ, 'ss15-17', true),
      ],
    },
  ],
  map: rallyMap(GREECE_2026_MAP, {
    'ss2': { label: 'SS2', at: [361, 121], anchor: 'right' },
    'ss3': { label: 'SS3', at: [445, 66], anchor: 'left' },
    'ss4-6': { label: 'SS4/6', at: [486, 192], anchor: 'center' },
    'ss5': { label: 'SS5', at: [561, 83], anchor: 'left' },
    'ss7': { label: 'SS7', at: [683, 126], anchor: 'left' },
    'ss8-12': { label: 'SS8/12', at: [375, 255], anchor: 'right' },
    'ss9': { label: 'SS9', at: [410, 492], anchor: 'left' },
    'ss10-13': { label: 'SS10/13', at: [316, 416], anchor: 'right' },
    'ss11': { label: 'SS11', at: [405, 322], anchor: 'right' },
    'ss14-16': { label: 'SS14/16', at: [685, 278], anchor: 'left' },
    'ss15-17': { label: 'SS15/17', at: [592, 208], anchor: 'left' },
  }),
  mapNote: { pt: 'Os termos do site do organizador proíbem qualquer uso do material sem autorização escrita, por isso o traçado não é reproduzido. SS1 (EKO SSS, Atenas) sem localização publicada.', en: 'The organiser\'s site terms forbid any use of its material without written permission, so the routes are not reproduced. SS1 (EKO SSS, Athens) has no published location.' },
  sources: [
    { label: 'Itinerário oficial (V2-1 · 25/04/2026)', url: 'https://app-cdn.sportity.com/2283ac67-c0b8-47bf-a309-e64159463299/2f6ae796-6389-4623-ad95-3e696122ac8a_Supplementary%20Regulations%20-%20EKO%20Acropolis%20Rally%202026.pdf' },
    { label: 'Piso (documento oficial)', url: 'https://app-cdn.sportity.com/2283ac67-c0b8-47bf-a309-e64159463299/2f6ae796-6389-4623-ad95-3e696122ac8a_Supplementary%20Regulations%20-%20EKO%20Acropolis%20Rally%202026.pdf' },
    { label: 'Parque de assistência', url: 'https://app-cdn.sportity.com/2283ac67-c0b8-47bf-a309-e64159463299/2f6ae796-6389-4623-ad95-3e696122ac8a_Supplementary%20Regulations%20-%20EKO%20Acropolis%20Rally%202026.pdf' },
    { label: 'Largada e chegada das especiais (mapas do organizador)', url: 'https://www.acropolisrally.gr/2026/en/spectators/maps-sp' },
  ],
};
