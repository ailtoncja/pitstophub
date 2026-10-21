import type { RallyMap, RallyRoute, RallyStage } from './types';

// Ajudantes para montar os dados de cada rali (src/rally/<id>-2026.ts).

/** Uma especial: "HH:MM" local + fuso do rali vira ISO 8601. */
export function stage(
  number: number,
  name: string,
  km: number,
  date: string,
  time: string | null,
  utcOffset: string,
  routeId?: string,
  powerStage?: boolean,
): RallyStage {
  return {
    number,
    name,
    km,
    ...(time ? { startsAt: `${date}T${time}:00${utcOffset}` } : {}),
    ...(routeId ? { routeId } : {}),
    ...(powerStage ? { powerStage } : {}),
  };
}

type GeneratedMap = {
  readonly width: number;
  readonly height: number;
  readonly geometry: 'route' | 'points';
  readonly land: string;
  readonly routes: { readonly [id: string]: string };
  readonly stages: { readonly [id: string]: { readonly start: readonly number[]; readonly finish: readonly number[]; readonly mid: readonly number[] } };
  readonly servicePark: readonly number[] | null;
  readonly towns: readonly { readonly name: string; readonly x: number; readonly y: number }[];
  readonly scaleBar: { readonly km: number; readonly px: number };
};

export type LabelSpec = {
  label: string;
  at: readonly [number, number];
  anchor: RallyRoute['anchor'];
  /** De onde sai a linha-guia: meio da especial (padrao), largada ou chegada. */
  from?: 'start' | 'mid' | 'finish';
};

/** Junta a geometria gerada com os rotulos posicionados a mao (em unidades do viewBox). */
export function rallyMap(generated: GeneratedMap, labels: Record<string, LabelSpec>, usesOsm = true): RallyMap {
  const xy = (p: readonly number[]) => [p[0], p[1]] as const;
  const routes = Object.entries(labels).map(([id, spec]): RallyRoute => {
    const meta = generated.stages[id];
    if (!meta) throw new Error(`rally map: stage road "${id}" not in the generated map`);
    return {
      id,
      label: spec.label,
      path: generated.routes[id],
      start: xy(meta.start),
      finish: xy(meta.finish),
      labelAt: spec.at,
      leaderFrom: xy(meta[spec.from ?? 'mid']),
      anchor: spec.anchor,
    };
  });
  return {
    width: generated.width,
    height: generated.height,
    land: generated.land,
    geometry: generated.geometry,
    routes,
    servicePark: generated.servicePark ? { x: generated.servicePark[0], y: generated.servicePark[1] } : null,
    towns: generated.towns.map((town) => ({ ...town })),
    scaleBar: { ...generated.scaleBar },
    usesOsm,
  };
}
