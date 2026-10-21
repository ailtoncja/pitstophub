import { MapPin } from 'lucide-react';
import { hasStartTime, racePlace, raceTitle, timeOf, timeZoneLabel, weekdayDayMonth } from '../lib/format';
import { useT } from '../lib/i18n';
import { phaseOf } from '../lib/reel';
import { cn } from '../lib/utils';
import { raceStartDate } from '../race-time';
import type { Race } from '../types';
import { ReelBackdrop, StatusTag } from './pit';
import { Countdown } from './ui';

/**
 * Faixa de midia de uma corrida (mesma linguagem do reel): campo da categoria, titulo embaixo, horario no fuso
 * de quem olha e contagem. Usada no resumo da categoria, no calendario e na pagina da corrida.
 */
export function RaceSpotlight({
  race,
  categoryId,
  now,
  className,
}: {
  race: Race;
  categoryId: string;
  now: number;
  className?: string;
}) {
  const { t, lang } = useT();
  const start = raceStartDate(race);
  const timed = hasStartTime(race);
  const completed = race.status === 'completed';
  const cancelled = race.status === 'cancelled';
  const phase = completed || cancelled ? 'wrapped' : phaseOf(race, now);
  const place = race.circuit && race.circuit !== racePlace(race, lang) ? [race.circuit, racePlace(race, lang)].filter(Boolean).join(' · ') : racePlace(race, lang);

  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-hairline min-h-[18rem] lg:min-h-[24rem]', className)}>
      <ReelBackdrop race={race} categoryId={categoryId} />
      <div className="absolute inset-x-0 bottom-0 p-5 lg:p-8 space-y-2.5">
        <h2 className="text-[1.875rem] sm:text-[2.25rem] lg:text-[2.75rem] leading-[1] font-extrabold tracking-[-0.035em] text-white text-balance line-clamp-3">{raceTitle(race, lang)}</h2>
        <p className="text-[1.0625rem] lg:text-[1.25rem] font-bold text-white tabular">
          {completed ? (
            race.winner ? `${t('home.winner')}: ${race.winner}` : t('cal.final')
          ) : (
            <>
              {weekdayDayMonth(start, lang)}
              {timed && !cancelled && <> · {timeOf(start, lang)} <span className="text-silver font-semibold">{timeZoneLabel(start)}</span></>}
            </>
          )}
        </p>
        <div className="min-h-[2.25rem] flex items-center">
          {cancelled ? (
            <StatusTag className="text-[1rem]">{t('cir.cancelled')}</StatusTag>
          ) : phase === 'live' ? (
            <StatusTag live className="text-[1rem] text-white">{t('home.liveNow')}</StatusTag>
          ) : phase === 'awaiting' ? (
            <StatusTag className="text-[1rem]">{t('home.awaiting')}</StatusTag>
          ) : phase === 'wrapped' ? null : timed ? (
            <Countdown target={start.getTime()} labels={{ d: t('unit.dShort'), h: t('unit.hShort'), m: t('unit.mShort') }} />
          ) : (
            <StatusTag className="text-[1rem]">{t('home.timeTbc')}</StatusTag>
          )}
        </div>
        {place && (
          <p className="flex items-center gap-2 type-body-md text-silver">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="line-clamp-2">{place}</span>
          </p>
        )}
      </div>
    </div>
  );
}
