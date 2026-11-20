import { describe, expect, it } from 'vitest';
import { MOTORSPORT_DATA } from '../types';
import { activeSeasonOf, resolveCategoryRules, ruleKind } from './rules';

function getCat(id: string) {
  const found = MOTORSPORT_DATA.find((c) => c.id === id);
  if (!found) throw new Error(`Categoria ${id} nao encontrada`);
  return structuredClone(found);
}

describe('resolveCategoryRules (adaptacao automatica por temporada e dados ao vivo)', () => {
  it('WRC em 2026 explica os Rally1 sem hibrido e a transicao para 2027; em 2027 muda sozinho para os novos carros WRC27', () => {
    const wrc2026 = resolveCategoryRules(getCat('wrc'));
    expect(activeSeasonOf(wrc2026)).toBe(2026);
    const car2026 = wrc2026.rulesFormat?.find((s) => ruleKind(s.title) === 'car');
    expect(car2026?.title).toBe('Carros Rally1 e transição para 2027');
    expect(car2026?.body).toContain('ciclo Rally1 (até o fim de 2026)');
    expect(car2026?.body).toContain('novo regulamento técnico WRC27');
    expect(wrc2026.longDescription).not.toContain('Rally1" híbridos');

    // Simula a virada de calendario do WRC para 2027
    const wrc2027Raw = {
      ...getCat('wrc'),
      calendar: [
        { id: 'montecarlo-2027', name: 'Rallye Monte-Carlo', location: 'Mônaco', date: '2027-01-24', circuit: 'Asfalto/Gelo', status: 'upcoming' as const },
        { id: 'sweden-2027', name: 'Rally Sweden', location: 'Umeå', date: '2027-02-14', circuit: 'Neve', status: 'upcoming' as const },
      ],
    };
    const wrc2027 = resolveCategoryRules(wrc2027Raw);
    expect(activeSeasonOf(wrc2027)).toBe(2027);
    const car2027 = wrc2027.rulesFormat?.find((s) => ruleKind(s.title) === 'car');
    expect(car2027?.title).toBe('Carros WRC27 (Novo regulamento)');
    expect(car2027?.enTitle).toBe('WRC27 cars (New regulations)');
    expect(car2027?.body).toContain('substituem a antiga geração Rally1');
    expect(car2027?.body).toContain('300 a 330 cv');
    expect(car2027?.body).toContain('€ 345 mil');
    expect(wrc2027.longDescription).toContain('geração WRC27');
  });

  it('Porsche Cup muda para o novo 911 GT3 Cup 992.2 na divisao Carrera em 2027 e lista as pistas reais do calendario', () => {
    const pcup2027Raw = {
      ...getCat('porsche-cup'),
      calendar: [
        { id: 'r1', name: 'Interlagos', location: 'Interlagos', enLocation: 'Interlagos', date: '2027-03-07', circuit: 'Interlagos', status: 'upcoming' as const },
        { id: 'r2', name: 'Velocitta', location: 'Velocitta', enLocation: 'Velocitta', date: '2027-04-11', circuit: 'Velocitta', status: 'upcoming' as const },
        { id: 'r3', name: 'Estoril', location: 'Estoril', enLocation: 'Estoril', date: '2027-07-04', circuit: 'Estoril', status: 'upcoming' as const },
      ],
    };
    const pcup2027 = resolveCategoryRules(pcup2027Raw);
    const div2027 = pcup2027.rulesFormat?.find((s) => s.title === 'Divisões');
    expect(div2027?.body).toContain('geração 992.2');
    expect(pcup2027.longDescription).toContain('911 Cup 992.2');
    expect(pcup2027.longDescription).toContain('O calendário de 2027 passa por Interlagos, Velocitta e Estoril.');
  });

  it('F1 monta dinamicamente a lista de cidades Sprint do calendario ativo e adapta titulos em 2027+', () => {
    const f12027Raw = {
      ...getCat('f1'),
      calendar: [
        {
          id: 'interlagos-2027',
          name: 'GP de São Paulo',
          location: 'São Paulo',
          enLocation: 'São Paulo',
          date: '2027-11-07',
          circuit: 'Interlagos',
          status: 'upcoming' as const,
          sessions: [{ id: 'sprint', name: 'Sprint', date: '2027-11-06' }],
        },
        {
          id: 'spa-2027',
          name: 'GP da Bélgica',
          location: 'Spa-Francorchamps',
          enLocation: 'Spa-Francorchamps',
          date: '2027-07-25',
          circuit: 'Spa',
          status: 'upcoming' as const,
          sessions: [{ id: 'sprint', name: 'Sprint', date: '2027-07-24' }],
        },
        {
          id: 'monza-2027',
          name: 'GP da Itália',
          location: 'Monza',
          enLocation: 'Monza',
          date: '2027-09-05',
          circuit: 'Monza',
          status: 'upcoming' as const,
          sessions: [{ id: 'qualifying', name: 'Classificação', date: '2027-09-04' }],
        },
      ],
    };
    const f12027 = resolveCategoryRules(f12027Raw);
    const formatSec = f12027.rulesFormat?.find((s) => ruleKind(s.title) === 'format');
    const scoringSec = f12027.rulesFormat?.find((s) => ruleKind(s.title) === 'scoring');
    const carSec = f12027.rulesFormat?.find((s) => ruleKind(s.title) === 'car');

    expect(formatSec?.body).toContain('Em duas etapas do calendário (São Paulo e Spa-Francorchamps), o fim de semana ganha o formato Sprint');
    expect(formatSec?.enBody).toContain('On two calendar rounds (São Paulo and Spa-Francorchamps) the weekend switches to the Sprint format');
    expect(scoringSec?.body).toContain('Nas duas corridas Sprint do calendário');
    expect(carSec?.title).toBe('Carros e regulamento técnico');
    expect(carSec?.enTitle).toBe('Cars and technical regulations');
    expect(f12027.longDescription).toContain('Desde 2026, o regulamento técnico combina');
  });

  it('aplica secoes de regras confirmadas vindas da API / points_rules para a temporada ativa, mas ignora regras herdadas (assumed)', () => {
    const wec2027Raw = {
      ...getCat('wec'),
      calendar: [
        { id: 'imola-2027', name: '6 Horas de Ímola', location: 'Ímola', date: '2027-04-18', circuit: 'Imola', status: 'upcoming' as const },
      ],
    };

    // Se a regra no banco ainda e herdada de 2026 (assumed = true), nao sobrescreve 2027
    const withAssumed = resolveCategoryRules(wec2027Raw, {
      season: 2026,
      assumed: true,
      sections: [{ title: 'Pontuação', body: 'Texto antigo de 2026' }],
    });
    const scoringAssumed = withAssumed.rulesFormat?.find((s) => s.title === 'Pontuação');
    expect(scoringAssumed?.body).not.toBe('Texto antigo de 2026');

    // Quando a regra de 2027 e confirmada no banco (assumed = false, season = 2027), atualiza a secao automaticamente
    const withConfirmed = resolveCategoryRules(wec2027Raw, {
      season: 2027,
      assumed: false,
      sections: [
        {
          title: 'Pontuação',
          enTitle: 'Points system',
          body: 'Em 2027, a FIA WEC atualizou a escala de pontuação das provas de 10 horas.',
          enBody: 'In 2027, FIA WEC updated the points scale for 10-hour races.',
        },
      ],
    });
    const scoringConfirmed = withConfirmed.rulesFormat?.find((s) => s.title === 'Pontuação');
    expect(scoringConfirmed?.body).toBe('Em 2027, a FIA WEC atualizou a escala de pontuação das provas de 10 horas.');
  });
});
