import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RALLY_DATES_2026 } from './rally/dates';
import { RALLIES_2026 } from './rally/rallies-2026';
import { dayKm, getRallyInfo, rallyKeyNumbers, rallyStages } from './rally-info';
import { MOTORSPORT_DATA, type Race } from './types';

// O cartao le o idioma do SettingsProvider; no teste, portugues fixo.
vi.mock('./lib/i18n', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./lib/i18n')>();
  return { ...mod, useT: () => ({ lang: 'pt' as const, t: (key: string, params?: Record<string, string | number>) => mod.translate('pt', key, params) }) };
});

const { RallyCard } = await import('./components/RallyCard');

const wrcCalendar = MOTORSPORT_DATA.find((category) => category.id === 'wrc')!.calendar;
const race = (over: Partial<Race>): Race => ({ id: 'x', name: 'Rally', location: '', date: '2026-10-04', circuit: 'Cascalho', status: 'completed', ...over }) as Race;

describe('fichas de rali do WRC 2026', () => {
  it('toda etapa do calendario do WRC (menos a cancelada) tem ficha, e a certa', () => {
    for (const round of wrcCalendar) {
      const info = getRallyInfo(round);
      if (round.status === 'cancelled') continue;
      expect(info?.id, round.id).toBe(round.id);
    }
    expect(RALLIES_2026).toHaveLength(wrcCalendar.filter((round) => round.status !== 'cancelled').length);
  });

  it('o indice leve de datas bate com as fichas', () => {
    expect(RALLY_DATES_2026).toEqual(RALLIES_2026.map((rally) => ({ id: rally.id, start: rally.dates.start, end: rally.dates.end })));
  });

  it('acha a ficha pela data mesmo com o id e o nome da fonte ao vivo', () => {
    expect(getRallyInfo(race({ id: 'r13-alghero', name: 'Rally Italy', date: '2026-10-02' }))?.id).toBe('sardegna');
    expect(getRallyInfo(race({ date: '2026-11-14' }))).toBeNull();
    expect(getRallyInfo(race({ date: '2025-10-04' }))).toBeNull();
  });

  for (const info of RALLIES_2026) {
    describe(info.id, () => {
      it('soma das especiais = totais da fonte do itinerario', () => {
        const key = rallyKeyNumbers(info);
        expect(key.count).toBe(info.official.stages);
        expect(key.km).toBeCloseTo(info.official.km, 2);
      });

      it('especiais numeradas em sequencia, no dia certo, com no maximo uma Power Stage', () => {
        const stages = rallyStages(info);
        expect(stages.map((stage) => stage.number)).toEqual(stages.map((_, i) => i + 1));
        expect(stages.filter((stage) => stage.powerStage).length).toBeLessThanOrEqual(1);
        for (const day of info.days) {
          expect(day.date >= info.dates.start && day.date <= info.dates.end, day.date).toBe(true);
          for (const stage of day.stages) if (stage.startsAt) expect(stage.startsAt.slice(0, 10)).toBe(day.date);
          expect(dayKm(day)).toBeGreaterThanOrEqual(0);
        }
      });

      it('tem fontes com endereco valido', () => {
        expect(info.sources.length).toBeGreaterThan(0);
        for (const source of info.sources) {
          expect(source.label.trim()).not.toBe('');
          expect(source.url).toMatch(/^https:\/\//);
        }
      });

      it('mapa (quando existe) cobre todas as especiais', () => {
        if (!info.map) return;
        const roads = new Set(info.map.routes.map((route) => route.id));
        for (const stage of rallyStages(info)) {
          // Especial sem localizacao publicada: fica fora do mapa, e a nota do mapa precisa citar.
          if (!stage.routeId) expect(info.mapNote?.pt, `SS${stage.number} sem lugar no mapa`).toContain(`SS${stage.number} `);
          else expect(roads.has(stage.routeId), `SS${stage.number}`).toBe(true);
        }
        for (const route of info.map.routes) {
          if (info.map.geometry === 'route') expect(route.path, route.id).toBeTruthy();
          for (const [x, y] of [route.start, route.finish, route.labelAt]) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(info.map.width);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(info.map.height);
          }
        }
      });

      it('o cartao renderiza com todas as especiais', () => {
        const html = renderToStaticMarkup(createElement(RallyCard, { info }));
        expect(html).toContain(`data-rally="${info.id}"`);
        for (const stage of rallyStages(info)) expect(html).toContain(`>SS${stage.number}<`);
        if (info.map) expect(html).toContain('<svg');
        else expect(html).toContain('data-rally-nomap');
      });
    });
  }
});
