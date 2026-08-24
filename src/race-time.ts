import type { Race } from './types';

export function raceStartDate(race: Pick<Race, 'date' | 'startsAt'>): Date {
  if (race.startsAt) {
    const start = new Date(race.startsAt);
    if (!Number.isNaN(start.getTime())) return start;
  }
  return new Date(`${race.date}T00:00:00`);
}

export function formatRaceDateTime(
  race: Pick<Race, 'date' | 'startsAt'>,
  language: 'pt' | 'en',
  options?: { monthOnly?: boolean },
): string {
  const parts = race.date.split('-');
  const dateLabel = options?.monthOnly
    ? parts.slice(1).reverse().join('/')
    : parts.reverse().join('/');
  if (!race.startsAt) return dateLabel;
  const start = new Date(race.startsAt);
  if (Number.isNaN(start.getTime())) return dateLabel;
  const time = start.toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateLabel} · ${time}`;
}

export function formatRaceLongDate(race: Pick<Race, 'date' | 'startsAt'>, language: 'pt' | 'en'): string {
  const dateLabel = new Date(`${race.date}T00:00:00`).toLocaleDateString(
    language === 'pt' ? 'pt-BR' : 'en-US',
    { day: '2-digit', month: 'long', year: 'numeric' },
  );
  if (!race.startsAt) return dateLabel;
  const start = new Date(race.startsAt);
  if (Number.isNaN(start.getTime())) return dateLabel;
  const time = start.toLocaleTimeString(language === 'pt' ? 'pt-BR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateLabel} · ${time}`;
}
