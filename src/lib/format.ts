import type { Race } from '../types';
import { raceStartDate } from '../race-time';

export type Lang = 'pt' | 'en';

const localeOf = (lang: Lang) => (lang === 'pt' ? 'pt-BR' : 'en-US');

export const pad2 = (n: number) => String(Math.max(0, Math.trunc(n))).padStart(2, '0');

/** A fonte so informa horario quando traz `startsAt`; sem ele, so a data e confiavel. */
export const hasStartTime = (race: Pick<Race, 'startsAt'>) =>
  Boolean(race.startsAt) && !Number.isNaN(new Date(race.startsAt as string).getTime());

export function weekdayShort(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeOf(lang), { weekday: 'short' }).format(date).replace('.', '').toUpperCase();
}

export function monthShort(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeOf(lang), { month: 'short' }).format(date).replace('.', '').toUpperCase();
}

export function monthLong(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeOf(lang), { month: 'long' }).format(date).toUpperCase();
}

export function timeOf(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeOf(lang), { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
}

/** "BRT" para quem esta no horario de Brasilia; senao, a sigla curta do fuso do aparelho. */
export function timeZoneLabel(date: Date = new Date()): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone === 'America/Sao_Paulo') return 'BRT';
    const part = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName');
    return part?.value ?? '';
  } catch {
    return '';
  }
}

/** "04 Out" */
export function dayMonth(date: Date, lang: Lang): string {
  const month = new Intl.DateTimeFormat(localeOf(lang), { month: 'short' }).format(date).replace('.', '');
  return `${pad2(date.getDate())} ${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}

/** "04/10" */
export function dayMonthNumeric(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}

/** "27 de setembro de 2026" */
export function longDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

/** "Domingo, 25 out" (dia da semana por extenso, dia e mes curto; em ingles "Sunday, 25 Oct"). */
export function weekdayDayMonth(date: Date, lang: Lang): string {
  const weekday = new Intl.DateTimeFormat(localeOf(lang), { weekday: 'long' }).format(date);
  const month = new Intl.DateTimeFormat(localeOf(lang), { month: 'short' }).format(date).replace('.', '');
  const text = `${weekday}, ${date.getDate()} ${month}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "04 Out, 03:00" (so a data quando a fonte nao informa horario). */
export function raceWhen(race: Race, lang: Lang): string {
  const date = raceStartDate(race);
  return hasStartTime(race) ? `${dayMonth(date, lang)}, ${timeOf(date, lang)}` : dayMonth(date, lang);
}

export function raceTitle(race: Race, lang: Lang): string {
  return lang === 'en' ? race.enName ?? race.name : race.name;
}

export function racePlace(race: Race, lang: Lang): string {
  const place = lang === 'en' ? race.enLocation ?? race.location : race.location;
  return place;
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

export function countdownTo(target: number, now: number): Countdown {
  const total = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: total === 0,
  };
}

export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

/** Pontos de diferenca com sinal: "-82", "+14". */
export function signed(n: number): string {
  if (n === 0) return '0';
  return n > 0 ? `+${formatPoints(n)}` : `-${formatPoints(Math.abs(n))}`;
}

export function ordinal(position: number, lang: Lang): string {
  if (lang === 'pt') return `${position}º`;
  const mod100 = position % 100;
  const mod10 = position % 10;
  if (mod100 >= 11 && mod100 <= 13) return `${position}th`;
  if (mod10 === 1) return `${position}st`;
  if (mod10 === 2) return `${position}nd`;
  if (mod10 === 3) return `${position}rd`;
  return `${position}th`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
