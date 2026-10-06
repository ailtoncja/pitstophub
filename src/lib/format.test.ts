import { describe, expect, it } from 'vitest';
import { countdownTo, formatPoints, initials, ordinal, pad2, signed } from './format';

describe('format', () => {
  it('completa com zero a esquerda e nao passa de numeros negativos', () => {
    expect(pad2(4)).toBe('04');
    expect(pad2(12)).toBe('12');
    expect(pad2(-3)).toBe('00');
  });

  it('mostra pontos inteiros sem casa decimal e fracionados com uma', () => {
    expect(formatPoints(25)).toBe('25');
    expect(formatPoints(12.5)).toBe('12.5');
  });

  it('coloca sinal na diferenca de pontos', () => {
    expect(signed(14)).toBe('+14');
    expect(signed(-82)).toBe('-82');
    expect(signed(0)).toBe('0');
  });

  it('escreve ordinais em portugues e em ingles', () => {
    expect(ordinal(5, 'pt')).toBe('5º');
    expect(ordinal(1, 'en')).toBe('1st');
    expect(ordinal(2, 'en')).toBe('2nd');
    expect(ordinal(3, 'en')).toBe('3rd');
    expect(ordinal(4, 'en')).toBe('4th');
    expect(ordinal(11, 'en')).toBe('11th');
    expect(ordinal(22, 'en')).toBe('22nd');
  });

  it('tira as iniciais de ate dois nomes', () => {
    expect(initials('Lando Norris')).toBe('LN');
    expect(initials('  ayrton   senna da silva ')).toBe('AS');
    expect(initials('Pele')).toBe('P');
  });

  it('calcula a contagem regressiva e nunca fica negativa', () => {
    const now = Date.UTC(2026, 9, 4, 12, 0, 0);
    const target = now + ((2 * 24 + 3) * 3600 + 25 * 60 + 9) * 1000;
    expect(countdownTo(target, now)).toEqual({ days: 2, hours: 3, minutes: 25, seconds: 9, done: false });
    expect(countdownTo(now - 5000, now)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
  });
});
