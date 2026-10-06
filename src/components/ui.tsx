import { useId, type ComponentType, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { countdownTo, pad2 } from '../lib/format';
import { useNow } from '../lib/useNow';

// ─── Marcadores ───────────────────────────────────────────────────────────────

/** Ponto pulsante vermelho ("ao vivo" / proxima largada). */
export function LiveDot({ className, color = 'bg-racing-red' }: { className?: string; color?: string }) {
  return <span className={cn('inline-block w-1.5 h-1.5 rounded-full animate-pulse', color, className)} aria-hidden />;
}

/** Faixa de titulo de secao: "DESTAQUES ........ Temporada 2026". */
export function SectionTitle({
  children,
  right,
  bar = false,
  className,
}: {
  children: ReactNode;
  right?: ReactNode;
  /** Barra vermelha vertical antes do titulo (paginas de perfil). */
  bar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 pb-1', className)}>
      <div className="flex items-center gap-1.5 min-w-0">
        {bar && <span className="w-1 h-3.5 rounded-full bg-racing-red shrink-0" aria-hidden />}
        <h2 className="type-headline-sm uppercase text-text-primary tracking-wide truncate">{children}</h2>
      </div>
      {right != null && <div className="type-label-telemetry uppercase text-text-muted shrink-0">{right}</div>}
    </div>
  );
}

/** Rotulo mono pequeno em caixa alta. */
export function Telemetry({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('type-label-telemetry uppercase text-text-muted', className)}>{children}</span>;
}

// ─── Listas e cartoes ─────────────────────────────────────────────────────────

/** Grupo de linhas com divisores finos (lista "Destaques", "Corridas futuras"...). */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('divide-y divide-surface-container-high rounded-xl bg-surface-container-low overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-xl bg-surface-raised', className)}>{children}</div>;
}

export function StatTile({
  label,
  value,
  sub,
  accent = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col min-w-0', className)}>
      <span className="type-label-telemetry uppercase text-text-muted tracking-wider">{label}</span>
      <span className={cn('type-headline-lg font-black leading-none mt-1', accent ? 'text-racing-red' : 'text-text-primary')}>{value}</span>
      {sub != null && <span className="type-label-telemetry text-text-muted mt-1 leading-snug line-clamp-2 break-words">{sub}</span>}
    </div>
  );
}

export function ProgressBar({ value, className, barClassName = 'bg-racing-red' }: { value: number; className?: string; barClassName?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-700', barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Pilulas e abas ───────────────────────────────────────────────────────────

export type PillOption<T extends string> = { value: T; label: ReactNode; dot?: string };

/** Tira horizontal de pilulas (filtros de categoria / grupo). */
export function PillStrip<T extends string>({
  options,
  value,
  onChange,
  className,
  tone = 'red',
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  className?: string;
  tone?: 'red' | 'quiet';
}) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-margin px-margin whitespace-nowrap', className)} role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill type-label-badge uppercase tracking-wider transition-all active:scale-95',
              tone === 'red'
                ? active
                  ? 'bg-racing-red text-white shadow-[0_0_12px_rgba(225,6,0,0.4)]'
                  : 'bg-surface-container-high text-text-secondary hover:text-white'
                : active
                  ? 'bg-surface-raised text-text-primary'
                  : 'text-text-muted hover:text-text-primary',
            )}
          >
            {option.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: option.dot }} aria-hidden />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Controle segmentado (Pilotos | Construtores). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  className?: string;
}) {
  return (
    <div className={cn('bg-surface-container-lowest p-1 rounded-xl flex items-center gap-1 shadow-inner overflow-x-auto no-scrollbar', className)} role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 min-w-fit px-3 py-2 text-center rounded-lg type-headline-sm uppercase tracking-wider transition-all whitespace-nowrap',
              active ? 'bg-surface-overlay text-white' : 'text-text-muted hover:text-white',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Contagem regressiva ──────────────────────────────────────────────────────

/** "02d : 14h : 28m : 45s" (segundos em vermelho), com algarismos tabulares. */
export function CountdownInline({ target, className, labels = { d: 'd', h: 'h', m: 'm', s: 's' } }: {
  target: number;
  className?: string;
  labels?: { d: string; h: string; m: string; s: string };
}) {
  const now = useNow(1000);
  const c = countdownTo(target, now);
  const unit = (value: number, label: string, red = false) => (
    <span className="flex items-baseline gap-1">
      <span className={cn('type-telemetry-counter leading-none', red ? 'text-racing-red' : 'text-text-primary')}>{pad2(value)}</span>
      <span className="type-label-telemetry text-text-muted uppercase">{label}</span>
    </span>
  );
  const sep = <span className="text-text-muted text-body-sm" aria-hidden>:</span>;
  return (
    <div className={cn('flex items-baseline gap-4 py-2', className)} role="timer" aria-label={`${c.days} d ${c.hours} h ${c.minutes} m`}>
      {unit(c.days, labels.d)}
      {sep}
      {unit(c.hours, labels.h)}
      {sep}
      {unit(c.minutes, labels.m)}
      {sep}
      {unit(c.seconds, labels.s, true)}
    </div>
  );
}

/** Tres blocos (dias / horas / min) com fundo inset, como no design. */
export function CountdownTiles({ target, labels }: { target: number; labels: { d: string; h: string; m: string } }) {
  const now = useNow(1000);
  const c = countdownTo(target, now);
  const tile = (value: number, label: string, red = false) => (
    <div className={cn('flex-1 rounded-lg py-3 text-center border', red ? 'bg-[#0e1015] border-racing-red/40' : 'bg-[#0e1015] border-[#1e2430]')}>
      <div className={cn('type-telemetry-counter leading-none', red ? 'text-racing-red' : 'text-white')}>{pad2(value)}</div>
      <div className="type-label-telemetry text-text-muted uppercase mt-1.5">{label}</div>
    </div>
  );
  return (
    <div className="flex gap-gutter" role="timer">
      {tile(c.days, labels.d)}
      {tile(c.hours, labels.h, true)}
      {tile(c.minutes, labels.m)}
    </div>
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-surface-container-low', className)} aria-hidden />;
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-container-low rounded-xl">
      {Icon && <Icon className="w-9 h-9 text-text-muted mb-2" />}
      <h3 className="type-headline-sm uppercase text-text-primary">{title}</h3>
      {hint && <p className="type-body-sm text-text-secondary mt-1 max-w-xs">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Id estavel e valido em CSS/SVG (para <linearGradient id> e similares). */
export function useUid(prefix = 'ph') {
  return `${prefix}-${useId().replace(/:/g, '')}`;
}
