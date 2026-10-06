import { Link } from 'react-router-dom';
import { paths } from '../app/paths';
import { useTributes } from '../features/tributes/Tributes';
import { flagForNationality } from '../nationality-flags';
import { cn } from '../lib/utils';
import type { Category, Driver, Team } from '../types';
import { Avatar } from './Avatar';

/** Cor da equipe do catalogo (cai no vermelho da marca quando ausente/ invalida). */
export function teamColor(team?: Team): string {
  return team?.color && /^#[0-9a-f]{6}$/i.test(team.color) ? team.color : '#e10600';
}

export function TeamCard({ category, team, drivers }: { category: Category; team: Team; drivers: Driver[] }) {
  const tributes = useTributes();
  const color = teamColor(team);
  const isFerrariWec = team.id === 'af-corse-wec';
  return (
    <Link
      to={paths.team(category.id, team.id)}
      className="relative flex items-center gap-3 rounded-xl bg-surface-raised border border-surface-border p-3 pl-4 overflow-hidden hover:bg-surface-overlay transition-colors"
    >
      <span className="absolute left-0 inset-y-0 w-[3px]" style={{ backgroundColor: color }} aria-hidden />
      <span
        onClick={isFerrariWec ? (e) => { e.preventDefault(); e.stopPropagation(); tributes.onFerrariWecTap(); } : undefined}
        className={cn('shrink-0', isFerrariWec && 'cursor-pointer select-none')}
      >
        <Avatar src={team.badge} name={team.name} size={44} square fit="contain" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="type-headline-sm uppercase text-text-primary truncate">{team.name}</h3>
        <p className="type-label-telemetry uppercase text-text-muted truncate">
          {[team.car, team.class].filter(Boolean).join(' • ') || category.name}
        </p>
        {drivers.length > 0 && (
          <p className="type-body-sm text-text-secondary truncate mt-0.5">{drivers.map((d) => d.name.split(' ').at(-1)).join(' · ')}</p>
        )}
      </div>
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
          {driver.number && <span className="type-label-badge font-bold" style={{ color: teamColor(team) }}>#{driver.number}</span>}
          <span className="type-body-md uppercase font-bold text-text-primary truncate">{driver.name}</span>
        </div>
        <p className="type-body-sm text-text-muted truncate">{[team?.name, flag].filter(Boolean).join(' ')}</p>
      </div>
    </Link>
  );
}
