import { describe, expect, it } from 'vitest';
import type { Category, Race } from '../types';
import { buildIcs, escapeIcs, foldLine } from './ics';

const category = { id: 'f1', name: 'F1', fullName: 'Formula 1' } as Category;
const base: Race = { id: 'singapore', name: 'GP de Singapura', enName: 'Singapore Grand Prix', location: 'Singapura', date: '2026-10-11', circuit: 'Marina Bay', status: 'upcoming' };
const NOW = new Date('2026-10-04T10:00:00Z');

describe('ics', () => {
  it('escapa os caracteres especiais do formato', () => {
    expect(escapeIcs('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('dobra linhas longas a cada 73 caracteres', () => {
    const folded = foldLine('x'.repeat(200));
    const parts = folded.split('\r\n ');
    expect(parts).toHaveLength(3);
    expect(parts.every((part) => part.length <= 73)).toBe(true);
    expect(parts.join('')).toBe('x'.repeat(200));
  });

  it('gera evento com horario em UTC e alarme quando a fonte informa a largada', () => {
    const ics = buildIcs([{ category, race: { ...base, startsAt: '2026-10-11T12:00:00Z' } }], 'pt', NOW);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART:20261011T120000Z');
    expect(ics).toContain('DTEND:20261011T140000Z');
    expect(ics).toContain('SUMMARY:F1 — GP de Singapura');
    expect(ics).toContain('TRIGGER:-PT1H');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('gera evento de dia inteiro, sem alarme, quando so a data e conhecida', () => {
    const ics = buildIcs([{ category, race: base }], 'en', NOW);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261011');
    expect(ics).toContain('DTEND;VALUE=DATE:20261012');
    expect(ics).toContain('SUMMARY:F1 — Singapore Grand Prix');
    expect(ics).not.toContain('VALARM');
  });
});
