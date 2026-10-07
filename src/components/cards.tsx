import { Link } from 'react-router-dom';
import { paths } from '../app/paths';
import { useTributes } from '../features/tributes/Tributes';
import { flagForNationality } from '../nationality-flags';
import { formatPoints } from '../lib/format';
import { cn } from '../lib/utils';
import type { Category, Driver, StandingItem, Team } from '../types';
import { Avatar } from './Avatar';

/** Cor da equipe do catalogo (cai no vermelho da marca quando ausente/ invalida). */
export function teamColor(team?: Team): string {
  return team?.color && /^#[0-9a-f]{6}$/i.test(team.color) ? team.color : '#e10600';
}

/** Cartao de equipe, monocromatico como no app: nome, carro/classe, brasao e a lista de pilotos com numero. */
export function TeamCard({ category, team, drivers }: { category: Category; team: Team; drivers: Driver[] }) {
  const tributes = useTributes();
  const isFerrariWec = team.id === 'af-corse-wec';
  const sorted = [...drivers].sort((a, b) => (parseInt(a.number, 10) || 9999) - (parseInt(b.number, 10) || 9999));
  const shown = sorted.slice(0, 4);
  return (
    <Link to={paths.team(category.id, team.id)} className="block rounded-lg bg-asphalt border border-hairline hover:bg-asphalt-alt transition-colors overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="type-headline-md uppercase text-white line-clamp-2">{team.name}</h3>
            {(team.car || team.class) && (
              <p className="type-label-badge uppercase text-silver-dim mt-1 truncate">{[team.car, team.class].filter(Boolean).join(' • ')}</p>
            )}
          </div>
          <span
            onClick={isFerrariWec ? (e) => { e.preventDefault(); e.stopPropagation(); tributes.onFerrariWecTap(); } : undefined}
            className={cn('shrink-0 rounded-full', isFerrariWec && 'cursor-pointer select-none')}
          >
            <Avatar src={team.badge} name={team.name} size={48} fit="contain" className="bg-surface-container-highest border border-hairline" />
          </span>
        </div>
        {shown.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {shown.map((driver) => (
              <li key={driver.id} className="flex items-center bg-surface-container-low pr-3 py-2.5 border-l-2 border-outline-variant">
                {driver.number && <span className="type-telemetry-counter text-[16px] text-white w-[52px] pl-3.5 shrink-0">{driver.number}</span>}
                <span className={cn('type-body-md uppercase tracking-wide text-on-surface truncate', !driver.number && 'pl-3.5')}>{driver.name}</span>
              </li>
            ))}
            {sorted.length > shown.length && <li className="type-label-badge text-on-surface-variant">+{sorted.length - shown.length}</li>}
          </ul>
        )}
      </div>
      <div className="h-2 bg-gradient-to-r from-primary-container to-black" aria-hidden />
    </Link>
  );
}

export function DriverRow({ category, driver, team }: { category: Category; driver: Driver; team?: Team }) {
  const flag = flagForNationality(driver.nationality);
  return (
    <Link to={paths.driver(category.id, driver.id)} className="flex items-center gap-3 px-space-md py-2.5 hover:bg-surface-container transition-colors">
      <Avatar src={driver.cutout ?? driver.image} name={driver.name} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {driver.number && <span className="type-label-badge font-bold text-white">#{driver.number}</span>}
          <span className="type-body-md uppercase font-bold text-text-primary truncate">{driver.name}</span>
        </div>
        <p className="type-body-sm text-text-muted truncate">{[team?.name, flag].filter(Boolean).join(' ')}</p>
      </div>
    </Link>
  );
}

/** Cartao de piloto da aba Grid: faixa na cor da equipe, posicao, numero, bandeira, nome, equipe/pontos e a foto. */
export function DriverCard({ category, driver, team, standing }: { category: Category; driver: Driver; team?: Team; standing?: StandingItem }) {
  const color = teamColor(team);
  const flag = flagForNationality(driver.nationality);
  const portrait = driver.cutout ?? driver.image;
  const subtitle = [team?.name, standing ? `${formatPoints(standing.points)} pts` : null].filter(Boolean).join(' • ');
  return (
    <Link to={paths.driver(category.id, driver.id)} className="flex items-stretch h-[104px] rounded-lg bg-asphalt border border-hairline hover:bg-asphalt-alt transition-colors overflow-hidden">
      <span className="w-1 shrink-0" style={{ backgroundColor: color }} aria-hidden />
      {standing && (
        <span className={cn('w-[52px] shrink-0 flex items-center justify-center type-telemetry-counter text-[16px]', standing.position === 1 ? 'text-primary-container' : 'text-on-surface-variant')}>
          P{standing.position}
        </span>
      )}
      <div className={cn('flex-1 min-w-0 flex flex-col justify-center pr-2', standing ? 'pl-0' : 'pl-4')}>
        <div className="flex items-center gap-2">
          {driver.number && driver.number !== '--' && <span className="type-telemetry-counter text-[18px] leading-5" style={{ color }}>{driver.number}</span>}
          {flag && <span className="text-[16px] leading-none">{flag}</span>}
        </div>
        <h3 className="type-headline-md text-[18px] leading-[22px] uppercase text-white line-clamp-2">{driver.name}</h3>
        {subtitle && <p className="type-label-telemetry uppercase text-on-surface-variant truncate">{subtitle}</p>}
      </div>
      {portrait && (
        <img src={portrait} alt="" loading="lazy" className={cn('h-full w-[100px] shrink-0', driver.cutout ? 'object-contain object-bottom' : 'object-cover object-top')} />
      )}
    </Link>
  );
}
