import { useId, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { countdownTo, pad2 } from '../lib/format';
import { useNow } from '../lib/useNow';

// ─── Marcadores ───────────────────────────────────────────────────────────────

/** Ponto pulsante vermelho ("ao vivo" / proxima largada). */
export function LiveDot({ className, color = 'bg-racing-red' }: { className?: string; color?: string }) {
  return <span className={cn('inline-block w-1.5 h-1.5 rounded-full animate-pulse', color, className)} aria-hidden />;
}

/** Titulo de secao do app: barra salmao de 4px a esquerda, titulo italico em caixa alta e a acao a direita. */
export function SectionTitle({
  children,
  right,
  className,
}: {
  children: ReactNode;
  right?: ReactNode;
  /** Mantido por compatibilidade: a barra agora e sempre exibida. */
  bar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2 className="type-headline-md uppercase text-on-surface border-l-4 border-primary pl-3 min-w-0">{children}</h2>
      {right != null && <div className="type-label-badge uppercase text-primary shrink-0 tracking-wider">{right}</div>}
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
    <div className={cn('divide-y divide-hairline-soft rounded-lg bg-asphalt border border-hairline overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-lg bg-asphalt border border-hairline', className)}>{children}</div>;
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
    <div className={cn('flex flex-col min-w-0 rounded-lg bg-asphalt border p-3.5', accent ? 'border-primary/40' : 'border-hairline', className)}>
      <span className="type-label-telemetry uppercase text-on-surface-variant tracking-wider truncate">{label}</span>
      <span className={cn('type-telemetry-counter text-[24px] leading-[26px] mt-1.5', accent ? 'text-primary' : 'text-white')}>{value}</span>
      {sub != null && <span className="type-label-telemetry text-on-surface-variant mt-1 leading-snug line-clamp-2 break-words">{sub}</span>}
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

export type PillOption<T extends string> = { value: T; label: ReactNode; dot?: string; icon?: ComponentType<{ className?: string; style?: CSSProperties }>; accent?: string };

/** Tira horizontal de chips de categoria/grupo. Selecionado: salmao, canto cortado e sombra vermelha dura (como no app). */
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
  if (tone === 'quiet') {
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
                'shrink-0 px-3.5 py-2 rounded-sm type-label-badge uppercase tracking-wider border transition-colors active:scale-95',
                active ? 'bg-primary-container text-on-primary-container border-primary-container' : 'bg-surface-container-high text-on-surface-variant border-hairline hover:text-white',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className={cn('flex items-center gap-3 overflow-x-auto no-scrollbar py-1.5 pr-2 -mx-margin px-margin whitespace-nowrap', className)} role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        const chip = (
          <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'shrink-0 inline-flex items-center gap-2 px-4 py-2 type-headline-sm uppercase transition-colors active:scale-95',
              active ? 'cut-corner [--cut:12px] bg-primary text-on-primary' : 'rounded-sm bg-surface-container-highest text-on-surface border border-hairline hover:bg-surface-bright',
            )}
          >
            {Icon && <Icon className="w-5 h-5" style={{ color: active ? undefined : option.accent }} />}
            {option.dot && !Icon && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: option.dot }} aria-hidden />}
            {option.label}
          </button>
        );
        return (
          <span key={option.value} className="shrink-0 inline-flex" style={active ? { filter: 'drop-shadow(3px 3px 0 #e10600)' } : undefined}>
            {chip}
          </span>
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
    <div className={cn('bg-surface-container-high p-1 rounded-lg border border-hairline flex items-center gap-1 overflow-x-auto no-scrollbar', className)} role="tablist">
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
              'flex-1 min-w-fit px-3 py-2 text-center rounded-md type-label-badge uppercase tracking-wider transition-all whitespace-nowrap',
              active ? 'bg-racing-red text-white' : 'text-on-surface-variant hover:text-white',
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

/** Painel de vidro do hero: barra salmao na lateral e "06 : 07 : 50" com dois-pontos piscando. */
export function CountdownPanel({ target, labels }: { target: number; labels: { d: string; h: string; m: string } }) {
  const now = useNow(1000);
  const c = countdownTo(target, now);
  const unit = (value: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="type-telemetry-counter text-white leading-none">{pad2(value)}</span>
      <span className="type-label-telemetry uppercase text-silver mt-1.5">{label}</span>
    </div>
  );
  const colon = <span className="type-telemetry-counter text-primary animate-pulse self-start" aria-hidden>:</span>;
  return (
    <div className="inline-flex rounded-sm bg-black/55 backdrop-blur-sm border border-hairline overflow-hidden" role="timer" aria-label={`${c.days} d ${c.hours} h ${c.minutes} m`}>
      <span className="w-1 bg-primary" aria-hidden />
      <div className="flex items-center gap-4 px-4 py-3.5">
        {unit(c.days, labels.d)}
        {colon}
        {unit(c.hours, labels.h)}
        {colon}
        {unit(c.minutes, labels.m)}
      </div>
    </div>
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-asphalt border border-hairline-soft', className)} aria-hidden />;
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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-asphalt border border-hairline rounded-lg">
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
