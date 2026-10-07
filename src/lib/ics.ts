import type { Category, Race } from '../types';
import { raceStartDate } from '../race-time';
import { hasStartTime, raceTitle } from './format';

// Duracao tipica da prova, so para o evento de agenda ter um fim razoavel.
const RACE_HOURS: Record<string, number> = {
  f1: 2,
  f2: 1.5,
  f3: 1.5,
  'f1-academy': 1,
  wec: 6,
  imsa: 4,
  'endurance-brasil': 4,
  indy: 3,
  nascar: 3.5,
  dtm: 1,
  wrc: 8,
};

const pad = (n: number) => String(n).padStart(2, '0');

function utc(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function ymd(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/** RFC 5545: escapa virgula, ponto e virgula, barra e quebras de linha. */
export function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Linhas com mais de 75 octetos precisam ser dobradas (RFC 5545 §3.1). */
export function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const chunks: string[] = [];
  for (let i = 0; i < line.length; i += 73) chunks.push(line.slice(i, i + 73));
  return chunks.join('\r\n ');
}

export type IcsEntry = { category: Category; race: Race };

export function buildIcs(entries: IcsEntry[], language: 'pt' | 'en', now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PitStopHub//Calendario//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:PitStopHub`,
  ];
  for (const { category, race } of entries) {
    const start = raceStartDate(race);
    const timed = hasStartTime(race);
    const hours = RACE_HOURS[category.id] ?? 3;
    const end = new Date(start.getTime() + hours * 3600_000);
    const place = [race.circuit, language === 'en' ? race.enLocation ?? race.location : race.location].filter(Boolean).join(', ');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${category.id}-${race.id}-${race.date}@pitstophub`,
      `DTSTAMP:${utc(now)}`,
      timed ? `DTSTART:${utc(start)}` : `DTSTART;VALUE=DATE:${ymd(start)}`,
      timed ? `DTEND:${utc(end)}` : `DTEND;VALUE=DATE:${ymd(new Date(start.getTime() + 86400_000))}`,
      `SUMMARY:${escapeIcs(`${category.name} — ${raceTitle(race, language)}`)}`,
      `LOCATION:${escapeIcs(place)}`,
      `DESCRIPTION:${escapeIcs(`${category.fullName} • PitStopHub`)}`,
      // Alerta 1 hora antes (so faz sentido com horario conhecido).
      ...(timed
        ? ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeIcs(raceTitle(race, language))}`, 'TRIGGER:-PT1H', 'END:VALARM']
        : []),
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
