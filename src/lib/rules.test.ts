import { describe, expect, it } from 'vitest';
import { MOTORSPORT_DATA } from '../types';
import { ruleKind, scoringRuleIndex, shortRuleTitle } from './rules';

const rulesOf = (id: string) => MOTORSPORT_DATA.find((category) => category.id === id)?.rulesFormat ?? [];

describe('regras das categorias', () => {
  it('acha a seção de pontuação de cada categoria que a explica', () => {
    expect(scoringRuleIndex(rulesOf('f1'))).toBe(1);
    expect(scoringRuleIndex(rulesOf('wec'))).toBe(2);
    expect(scoringRuleIndex(rulesOf('gtwc-asia'))).toBeNull(); // só tem formato e classes
    expect(scoringRuleIndex([{ title: 'Formato', enTitle: 'Format', body: 'x' }, { title: 'Outro', enTitle: 'Scoring', body: 'y' }])).toBe(1);
  });

  it('toda categoria com regras tem ao menos duas seções para ler', () => {
    const withRules = MOTORSPORT_DATA.filter((category) => (category.rulesFormat?.length ?? 0) > 0);
    expect(withRules.length).toBeGreaterThanOrEqual(12);
    for (const category of withRules) expect(category.rulesFormat!.length, category.id).toBeGreaterThanOrEqual(2);
  });

  it('títulos longos viram atalhos curtos sem cortar palavra', () => {
    expect(shortRuleTitle('Pontuação')).toBe('Pontuação');
    expect(shortRuleTitle('Curiosidades e regras especiais')).toBe('Curiosidades e regras…');
  });

  it('cada tipo de seção ganha o ícone certo', () => {
    expect(ruleKind('Pontuação')).toBe('scoring');
    expect(ruleKind('Balance of Performance e Handicap')).toBe('balance');
    expect(ruleKind('Classes')).toBe('classes');
    expect(ruleKind('Carros e regulamento técnico')).toBe('car');
    expect(ruleKind('Curiosidades')).toBe('fun');
    expect(ruleKind('Formato do fim de semana')).toBe('format');
  });
});
