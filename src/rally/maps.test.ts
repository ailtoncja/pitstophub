import { describe, expect, it } from 'vitest';
import { RALLIES_2026 } from './rallies-2026';
import { stageClock } from '../rally-info';
import type { GeneratedMap } from './build';
import type { RallyInfo, RallyMap } from './types';
import { CANARIAS_2026_MAP } from './canarias-2026-map';
import { CROATIA_2026_MAP } from './croatia-2026-map';
import { GREECE_2026_MAP } from './greece-2026-map';
import { MONTECARLO_2026_MAP } from './montecarlo-2026-map';
import { PARAGUAY_2026_MAP } from './paraguay-2026-map';
import { PORTUGAL_2026_MAP } from './portugal-2026-map';
import { SAFARI_2026_MAP } from './safari-2026-map';
import { SARDEGNA_2026_MAP } from './sardegna-2026-map';

// Confere os mapas dos ralis contra o mundo real, medindo o que a tela desenha (nao o que o gerador
// diz que desenhou): cada tracado volta para lat/lon pela projecao do mapa e e medido no elipsoide WGS84.
// Regras (as mesmas do scripts/rally/build_map.py):
// - tracado: comprimento dentro de 2% da distancia oficial de cada especial e pontas a ate 120 m da
//   largada/chegada oficiais; se nao conferir, a especial fica so com largada e chegada;
// - pontos: dentro da regiao do rali e com a reta largada-chegada menor que a especial;
// - parque de assistencia perto do local oficial; escala do mapa certa.

const GENERATED: Record<string, GeneratedMap> = {
  canarias: CANARIAS_2026_MAP,
  croatia: CROATIA_2026_MAP,
  greece: GREECE_2026_MAP,
  montecarlo: MONTECARLO_2026_MAP,
  paraguay: PARAGUAY_2026_MAP,
  portugal: PORTUGAL_2026_MAP,
  safari: SAFARI_2026_MAP,
  sardegna: SARDEGNA_2026_MAP,
};

/** Regiao de cada rali [latMin, latMax, lonMin, lonMax], tirada da geografia (nao dos dados). */
const REGION: Record<string, readonly [number, number, number, number]> = {
  montecarlo: [43.6, 44.7, 5.1, 7.6], // Alpes-Maritimes, Alpes-de-Haute-Provence, Hautes-Alpes, Drome, Monaco
  safari: [-1.2, -0.2, 36.0, 36.7], // Naivasha, Nakuru
  croatia: [44.9, 45.6, 13.6, 15.6], // Istria, Primorje-Gorski Kotar, Karlovac
  canarias: [27.7, 28.2, -15.9, -15.3], // Gran Canaria
  portugal: [40.0, 41.9, -8.9, -7.7], // Centro e Norte
  greece: [37.2, 38.7, 22.0, 23.8], // Fokida, Viotia, Peloponeso (Arcadia, Argolida, Corintia), Attica
  paraguay: [-27.5, -26.8, -56.4, -55.3], // Itapua
  sardegna: [40.4, 41.0, 8.1, 9.5], // norte da Sardenha
};

/** Parque de assistencia: coordenada do documento oficial (ou do local nomeado nele, via OSM) e tolerancia em km. */
const SERVICE_PARK: Record<string, { at: readonly [number, number]; km: number; source: string }> = {
  montecarlo: { at: [44 + 32 / 60 + 24.8 / 3600, 6 + 3 / 60 + 39.7 / 3600], km: 0.2, source: 'RP art. 2.8: COSEC, Gap 44°32\'24.8"N 6°03\'39.7"E' },
  safari: { at: [-(0 + 44.7 / 60), 36 + 27.1 / 60], km: 0.2, source: 'Road Book 1: S0°44.700\' E36°27.100\' (WRTI, Naivasha)' },
  croatia: { at: [45.3827, 14.5083], km: 1, source: 'RG1: Automotodrom Grobnik (posicao no OpenStreetMap)' },
  canarias: { at: [28 + 5.88 / 60, -(15 + 27.47 / 60)], km: 0.2, source: 'RG1 §5: N28°05.88\' W15°27.47\' (Estadio de Gran Canaria)' },
  portugal: { at: [41 + 11 / 60 + 58.3 / 3600, -(8 + 41 / 60 + 32.1 / 3600)], km: 0.2, source: 'SR art. 2.8: Exponor 41°11\'58.3"N 8°41\'32.1"W' },
  greece: { at: [37 + 57.247 / 60, 22 + 57.855 / 60], km: 0.2, source: 'SR art. 2.8: Loutraki 37°57.247\'N 22°57.855\'E' },
  paraguay: { at: [-(27 + 19.749 / 60), -(55 + 52.519 / 60)], km: 0.2, source: 'Rally Guide 2 §9.1: S27°19.749\' W55°52.519\' (Sambodromo)' },
  sardegna: { at: [40.5625, 8.3173], km: 0.3, source: 'Rally Guide 2 §5.1.1: Piazzale della Pace, Alghero' },
};

/** Fuso de cada rali (IANA): o teste confere que os horarios do itinerario usam o deslocamento certo na data. */
const TIME_ZONE: Record<string, string> = {
  montecarlo: 'Europe/Paris',
  sweden: 'Europe/Stockholm',
  safari: 'Africa/Nairobi',
  croatia: 'Europe/Zagreb',
  canarias: 'Atlantic/Canary',
  portugal: 'Europe/Lisbon',
  japan: 'Asia/Tokyo',
  greece: 'Europe/Athens',
  estonia: 'Europe/Tallinn',
  finland: 'Europe/Helsinki',
  paraguay: 'America/Asuncion',
  chile: 'America/Santiago',
  sardegna: 'Europe/Rome',
};

const WGS_A = 6378137;
const WGS_F = 1 / 298.257223563;
const WGS_B = WGS_A * (1 - WGS_F);
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Distancia geodesica no WGS84 (Vincenty, inverso), em km. p = [lat, lon]. */
function geodesicKm(p: readonly number[], q: readonly number[]): number {
  if (p[0] === q[0] && p[1] === q[1]) return 0;
  const L = rad(q[1] - p[1]);
  const U1 = Math.atan((1 - WGS_F) * Math.tan(rad(p[0])));
  const U2 = Math.atan((1 - WGS_F) * Math.tan(rad(q[0])));
  const [sU1, cU1, sU2, cU2] = [Math.sin(U1), Math.cos(U1), Math.sin(U2), Math.cos(U2)];
  let lambda = L;
  let sinSigma = 0, cosSigma = 0, sigma = 0, cos2Alpha = 0, cos2SigmaM = 0;
  for (let i = 0; i < 200; i++) {
    const sl = Math.sin(lambda), cl = Math.cos(lambda);
    sinSigma = Math.hypot(cU2 * sl, cU1 * sU2 - sU1 * cU2 * cl);
    if (sinSigma === 0) return 0;
    cosSigma = sU1 * sU2 + cU1 * cU2 * cl;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cU1 * cU2 * sl) / sinSigma;
    cos2Alpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cos2Alpha ? cosSigma - (2 * sU1 * sU2) / cos2Alpha : 0;
    const C = (WGS_F / 16) * cos2Alpha * (4 + WGS_F * (4 - 3 * cos2Alpha));
    const prev = lambda;
    lambda = L + (1 - C) * WGS_F * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM ** 2)));
    if (Math.abs(lambda - prev) < 1e-12) break;
  }
  const u2 = (cos2Alpha * (WGS_A ** 2 - WGS_B ** 2)) / WGS_B ** 2;
  const A = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
  const B = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
  const dSigma = B * sinSigma * (cos2SigmaM + (B / 4) * (cosSigma * (-1 + 2 * cos2SigmaM ** 2) - (B / 6) * cos2SigmaM * (-3 + 4 * sinSigma ** 2) * (-3 + 4 * cos2SigmaM ** 2)));
  return (WGS_B * A * (sigma - dSigma)) / 1000;
}

/** Ponto do mapa (viewBox) de volta para [lat, lon]. */
function toLatLon(map: RallyMap, x: number, y: number): [number, number] {
  const { lat0, lon0, kx, pxPerDeg } = map.projection;
  return [lat0 - (y - map.height / 2) / pxPerDeg, lon0 + (x - map.width / 2) / (kx * pxPerDeg)];
}

function pathPoints(d: string): [number, number][] {
  expect(d, 'so comandos M + pares de numeros').toMatch(/^M[-\d. ]+$/);
  const nums = d.slice(1).trim().split(/\s+/).map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
  return out;
}

const lineKm = (pts: readonly (readonly number[])[]) => pts.slice(1).reduce((sum, p, i) => sum + geodesicKm(pts[i], p), 0);

const inRegion = (p: readonly number[], [la0, la1, lo0, lo1]: readonly [number, number, number, number]) => p[0] >= la0 && p[0] <= la1 && p[1] >= lo0 && p[1] <= lo1;

const stageKms = (info: RallyInfo, routeId: string) => info.days.flatMap((d) => d.stages).filter((s) => s.routeId === routeId);

const mapped = RALLIES_2026.filter((info) => info.map);

describe('mapas dos ralis conferidos contra o mundo real', () => {
  it('cada mapa tem o arquivo gerado, a regiao e o parque de assistencia de referencia', () => {
    expect(mapped.map((info) => info.id).sort()).toEqual(Object.keys(GENERATED).sort());
    for (const info of mapped) {
      expect(REGION[info.id], info.id).toBeDefined();
      expect(SERVICE_PARK[info.id], info.id).toBeDefined();
    }
  });

  for (const info of mapped) {
    const map = info.map!;
    const gen = GENERATED[info.id];
    const region = REGION[info.id];

    describe(info.id, () => {
      it('projecao sem espelhamento e com a proporcao certa; escala em km reais', () => {
        const { lat0, lon0, kx, pxPerDeg } = map.projection;
        expect(kx).toBeCloseTo(Math.cos(rad(lat0)), 6);
        // 1 px no mapa vale o mesmo em norte-sul e leste-oeste (dentro de 1%), e norte fica em cima / leste a direita.
        const north = toLatLon(map, map.width / 2, map.height / 2 - 100);
        const east = toLatLon(map, map.width / 2 + 100, map.height / 2);
        expect(north[0]).toBeGreaterThan(lat0);
        expect(east[1]).toBeGreaterThan(lon0);
        const kmNS = geodesicKm([lat0, lon0], north);
        const kmEW = geodesicKm([lat0, lon0], east);
        expect(Math.abs(kmNS / kmEW - 1)).toBeLessThan(0.01);
        // A barra de escala mede o que diz (1%).
        const pxPerKm = 100 / kmNS;
        expect(Math.abs(map.scaleBar.px / map.scaleBar.km / pxPerKm - 1)).toBeLessThan(0.01);
        expect(pxPerDeg).toBeGreaterThan(0);
      });

      it('tracados: comprimento desenhado dentro de 2% da distancia oficial e pontas na largada/chegada oficiais', () => {
        for (const route of map.routes) {
          if (!route.path) continue;
          const official = gen.stages[route.id].official;
          expect(official, `${route.id}: tracado sem largada/chegada oficiais`).toBeDefined();
          const pts = pathPoints(route.path).map(([x, y]) => toLatLon(map, x, y));
          const km = lineKm(pts);
          const stages = stageKms(info, route.id);
          expect(stages.length, route.id).toBeGreaterThan(0);
          for (const stage of stages) {
            expect(Math.abs(km / stage.km - 1), `${route.id} SS${stage.number}: desenhado ${km.toFixed(2)} km x oficial ${stage.km} km`).toBeLessThanOrEqual(0.02);
          }
          expect(geodesicKm(pts[0], official!.start), `${route.id}: inicio da linha x largada oficial`).toBeLessThan(0.12);
          expect(geodesicKm(pts[pts.length - 1], official!.finish), `${route.id}: fim da linha x chegada oficial`).toBeLessThan(0.12);
          // Bolinhas de largada/chegada nas pontas da linha.
          expect(geodesicKm(toLatLon(map, ...route.start), official!.start)).toBeLessThan(0.12);
          expect(geodesicKm(toLatLon(map, ...route.finish), official!.finish)).toBeLessThan(0.12);
          for (const p of pts) expect(inRegion(p, region), `${route.id} fora da regiao: ${p}`).toBe(true);
        }
      });

      it('especiais sem tracado num mapa de tracados aparecem citadas na nota do mapa', () => {
        if (map.geometry !== 'route') return;
        for (const route of map.routes) {
          if (!route.path) expect(info.mapNote?.pt, route.label).toContain(route.label);
          if (!route.path) expect(info.mapNote?.en, route.label).toContain(route.label);
        }
      });

      it('largada e chegada dentro da regiao do rali e mais perto entre si que o tamanho da especial', () => {
        for (const route of map.routes) {
          const start = toLatLon(map, ...route.start);
          const finish = toLatLon(map, ...route.finish);
          expect(inRegion(start, region), `${route.id} largada fora da regiao: ${start}`).toBe(true);
          expect(inRegion(finish, region), `${route.id} chegada fora da regiao: ${finish}`).toBe(true);
          const straight = geodesicKm(start, finish);
          for (const stage of stageKms(info, route.id)) expect(straight, `${route.id} SS${stage.number}`).toBeLessThanOrEqual(stage.km);
          // O km que o gerador usou para validar e o mesmo do itinerario mostrado.
          for (const stage of stageKms(info, route.id)) expect(gen.stages[route.id].km, `${route.id} SS${stage.number}`).toBe(stage.km);
        }
      });

      it('parque de assistencia no local oficial', () => {
        const ref = SERVICE_PARK[info.id];
        expect(map.servicePark, info.id).not.toBeNull();
        const at = toLatLon(map, map.servicePark!.x, map.servicePark!.y);
        expect(geodesicKm(at, ref.at), ref.source).toBeLessThan(ref.km);
      });
    });
  }
});

describe('horarios do itinerario', () => {
  for (const info of RALLIES_2026) {
    it(`${info.id}: deslocamento UTC certo para o fuso do rali na data (horario de verao incluso)`, () => {
      const zone = TIME_ZONE[info.id];
      expect(zone, info.id).toBeDefined();
      const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      for (const day of info.days) {
        const times = [...day.stages.map((s) => s.startsAt), day.shakedown?.startsAt].filter((t): t is string => Boolean(t));
        for (const iso of times) {
          const parts = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
          expect(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`, iso).toBe(iso.slice(0, 16));
        }
      }
    });
  }

  it('mostra o dia da semana quando o fuso do visitante muda o dia', () => {
    // Japao (UTC+9) visto do Brasil (UTC-3): 08:05 de sexta la = 20:05 de quinta aqui.
    expect(stageClock('2026-05-29T08:05:00+09:00', '2026-05-29', 'pt', 'America/Sao_Paulo')).toEqual({ time: '20:05', day: 'Qui' });
    expect(stageClock('2026-05-29T08:05:00+09:00', '2026-05-29', 'en', 'America/Sao_Paulo')).toEqual({ time: '20:05', day: 'Thu' });
    // Sardenha (UTC+2) vista do Brasil: mesmo dia, so muda a hora.
    expect(stageClock('2026-10-03T08:01:00+02:00', '2026-10-03', 'pt', 'America/Sao_Paulo')).toEqual({ time: '03:01', day: null });
    // No fuso do proprio rali, o horario e o do itinerario.
    expect(stageClock('2026-10-04T14:15:00+02:00', '2026-10-04', 'pt', 'Europe/Rome')).toEqual({ time: '14:15', day: null });
    // Chile (UTC-3) visto de Tokyo: dia seguinte.
    expect(stageClock('2026-09-13T15:15:00-03:00', '2026-09-13', 'en', 'Asia/Tokyo')).toEqual({ time: '03:15', day: 'Mon' });
  });
});
