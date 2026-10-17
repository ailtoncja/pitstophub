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

/** Cartao de equipe: monocromatico; a cor da equipe aparece so como filete fino no topo (dado, nao enfeite). */
export function TeamCard({ category, team, drivers }: { category: Category; team: Team; drivers: Driver[] }) {
  const tributes = useTributes();
  const isFerrariWec = team.id === 'af-corse-wec';
  const sorted = [...drivers].sort((a, b) => (parseInt(a.number, 10) || 9999) - (parseInt(b.number, 10) || 9999));
  const shown = sorted.slice(0, 4);
  return (
    <Link to={paths.team(category.id, team.id)} className="block rounded-2xl bg-asphalt border border-hairline hover:border-white/35 transition-colors overflow-hidden">
      <span className="block h-0.5" style={{ backgroundColor: teamColor(team) }} aria-hidden />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="type-headline-md text-white line-clamp-2">{team.name}</h3>
            {(team.car || team.class) && (
              <p className="type-body-sm text-silver mt-1 truncate">{[team.car, team.class].filter(Boolean).join(' · ')}</p>
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
          <ul className="mt-4 divide-y divide-hairline-soft border-t border-hairline-soft">
            {shown.map((driver) => (
              <li key={driver.id} className="flex items-center gap-4 py-2.5">
                <span className="type-headline-sm text-silver tabular w-8 text-right shrink-0">{driver.number || ''}</span>
                <span className="type-body-md text-white truncate">{driver.name}</span>
              </li>
            ))}
            {sorted.length > shown.length && <li className="type-label-badge text-silver pt-2.5">+{sorted.length - shown.length}</li>}
          </ul>
        )}
      </div>
    </Link>
  );
}

export function DriverRow({ category, driver, team }: { category: Category; driver: Driver; team?: Team }) {
  const flag = flagForNationality(driver.nationality);
  return (
    <Link to={paths.driver(category.id, driver.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors">
      <Avatar src={driver.cutout ?? driver.image} name={driver.name} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {driver.number && <span className="type-label-badge text-silver tabular">#{driver.number}</span>}
          <span className="type-body-md font-semibold text-white truncate">{driver.name}</span>
        </div>
        <p className="type-body-sm text-silver truncate">{[team?.name, flag].filter(Boolean).join(' ')}</p>
      </div>
    </Link>
  );
}

/** Cartao de piloto da aba Grid: posicao, numero (na cor da equipe), nome, equipe/pontos e a foto. */
export function DriverCard({ category, driver, team, standing }: { category: Category; driver: Driver; team?: Team; standing?: StandingItem }) {
  const color = teamColor(team);
  const flag = flagForNationality(driver.nationality);
  const portrait = driver.cutout ?? driver.image;
  const subtitle = [team?.name, standing ? `${formatPoints(standing.points)} pts` : null].filter(Boolean).join(' · ');
  return (
    <Link to={paths.driver(category.id, driver.id)} className="flex items-stretch h-[112px] rounded-2xl bg-asphalt border border-hairline hover:border-white/35 transition-colors overflow-hidden">
      {standing && (
        <span className={cn('w-14 shrink-0 flex items-center justify-center type-headline-md tabular', standing.position === 1 ? 'text-white' : 'text-silver')}>
          {standing.position}
        </span>
      )}
      <div className={cn('flex-1 min-w-0 flex flex-col justify-center pr-2', standing ? 'pl-0' : 'pl-5')}>
        <div className="flex items-center gap-2">
          {driver.number && driver.number !== '--' && <span className="type-headline-sm tabular" style={{ color }}>{driver.number}</span>}
          {flag && <span className="text-[1rem] leading-none">{flag}</span>}
        </div>
        <h3 className="type-headline-sm text-[1.0625rem] text-white line-clamp-2">{driver.name}</h3>
        {subtitle && <p className="type-body-sm text-silver truncate">{subtitle}</p>}
      </div>
      {portrait && (
        <img src={portrait} alt="" loading="lazy" className={cn('h-full w-[104px] shrink-0', driver.cutout ? 'object-contain object-bottom' : 'object-cover object-top')} />
      )}
    </Link>
  );
}
