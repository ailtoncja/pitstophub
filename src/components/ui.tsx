import { useId, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { dataStateOf, type DataState } from '../lib/categories-meta';
import { useT } from '../lib/i18n';
import { cn } from '../lib/utils';
import { countdownTo, pad2 } from '../lib/format';
import { useNow } from '../lib/useNow';

// ─── Marcadores ───────────────────────────────────────────────────────────────

/** Ponto pulsante vermelho ("ao vivo" / proxima largada). */
export function LiveDot({ className, color = 'bg-racing-red' }: { className?: string; color?: string }) {
  return <span className={cn('inline-block w-2 h-2 rounded-full animate-pulse', color, className)} aria-hidden />;
}

/** Forma do estado do dado: filete cheio = ao vivo, tracejado = diario, meio filete = catalogo. */
export function StateMark({ state, className }: { state: DataState; className?: string }) {
  const { t } = useT();
  return <span className={cn('state-mark', className)} data-state={state} role="img" aria-label={t(`state.${state}`)} title={t(`state.${state}`)} />;
}

/** Legenda das tres formas do estado do dado. */
export function StateLegend({ className }: { className?: string }) {
  const { t } = useT();
  const items: DataState[] = ['live', 'daily', 'catalog'];
  return (
    <ul className={cn('grid gap-1.5 type-label-telemetry text-silver', className)}>
      {items.map((state) => (
        <li key={state} className="flex items-center gap-2.5">
          <span className="state-mark text-white" data-state={state} aria-hidden />
          {t(`state.${state}`)}
        </li>
      ))}
    </ul>
  );
}

/** Estado do dado de uma categoria, com o nome ao lado (cabecalhos e cartoes). */
export function CategoryDataState({ categoryId, className }: { categoryId: string; className?: string }) {
  const { t } = useT();
  const state = dataStateOf(categoryId);
  return (
    <span className={cn('inline-flex items-center gap-2 type-label-telemetry text-silver', className)}>
      <span className="state-mark text-white" data-state={state} aria-hidden />
      {t(`state.${state}`)}
    </span>
  );
}

/** Titulo de secao: titulo em frase e, a direita, a acao como link discreto. */
export function SectionTitle({
  children,
  right,
  className,
}: {
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <h2 className="type-headline-md text-white min-w-0">{children}</h2>
      {right != null && <div className="type-label-badge text-silver shrink-0 [&_a]:underline [&_a]:decoration-white/30 hover:[&_a]:decoration-white [&_a]:text-white">{right}</div>}
    </div>
  );
}

/** Barra de voltar das paginas de detalhe (piloto, equipe, corrida): volta no historico ou cai no destino de reserva. */
export function BackBar({ fallback, label, right }: { fallback: string; label: string; right?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between gap-3 pt-3 lg:pt-8 pb-2">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(fallback))}
        className="inline-flex items-center gap-2 h-11 -ml-2 px-2 rounded-full text-silver hover:text-white transition-colors min-w-0"
      >
        <ArrowLeft className="w-5 h-5 shrink-0" />
        <span className="type-label-badge text-[0.875rem] truncate">{label}</span>
      </button>
      {right}
    </div>
  );
}

// ─── Listas e cartoes ─────────────────────────────────────────────────────────

/** Grupo de linhas com divisores finos. */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('divide-y divide-hairline-soft rounded-2xl bg-asphalt border border-hairline overflow-hidden', className)}>
      {children}
    </div>
  );
}

/** Pares rotulo/valor em linhas (no lugar de blocos "numero grande + rotulo pequeno"). */
export function FactList({ items, className }: { items: { label: ReactNode; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn('divide-y divide-hairline-soft rounded-2xl bg-asphalt border border-hairline overflow-hidden', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="type-body-sm text-silver">{item.label}</dt>
          <dd className="type-headline-sm text-white tabular text-right min-w-0 break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Botoes ───────────────────────────────────────────────────────────────────

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  children: ReactNode;
  to?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  'aria-pressed'?: boolean;
  'aria-label'?: string;
};

/** Botao padrao: pilula de 44 px. Primario = branco; secundario = contorno; fantasma = so texto. */
export function Button({ variant = 'primary', className, children, to, onClick, type = 'button', disabled, ...rest }: ButtonProps) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full type-label-badge text-[0.875rem] transition-[background-color,color,transform] duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
    variant === 'primary' && 'bg-white text-black hover:bg-white/85',
    variant === 'secondary' && 'border border-white/30 text-white hover:bg-white/10 hover:border-white/60',
    variant === 'ghost' && 'text-silver hover:text-white hover:bg-white/10',
    className,
  );
  return to ? (
    <Link to={to} className={cls} aria-label={rest['aria-label']}>{children}</Link>
  ) : (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} aria-pressed={rest['aria-pressed']} aria-label={rest['aria-label']}>{children}</button>
  );
}

/** Glifo circular de 44 px (trilho de acoes do reel, cabecalhos). Ativo = preenchido. */
export function GlyphButton({
  label,
  active = false,
  onClick,
  to,
  children,
  className,
  showLabel = false,
  visibleLabel,
  tabIndex,
  tone = 'white',
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  to?: string;
  children: ReactNode;
  className?: string;
  showLabel?: boolean;
  /** Texto curto mostrado sob o glifo; o aria-label continua sendo `label`. */
  visibleLabel?: string;
  tabIndex?: number;
  /** Cor do estado ativo: branco por padrao; vermelho so para "seguindo". */
  tone?: 'white' | 'red';
}) {
  const circle = cn(
    'w-11 h-11 rounded-full flex items-center justify-center transition-[background-color,color,transform] duration-200 active:scale-90',
    active ? (tone === 'red' ? 'bg-racing-red text-white' : 'bg-white text-black') : 'bg-black/45 text-white backdrop-blur-md border border-white/15 hover:bg-white/20',
  );
  const content = (
    <>
      <span className={circle}>{children}</span>
      {showLabel && <span className="type-label-telemetry text-white [text-shadow:0_1px_6px_rgba(0,0,0,.8)]">{visibleLabel ?? label}</span>}
    </>
  );
  const base = cn('flex flex-col items-center gap-1', className);
  return to ? (
    <Link to={to} aria-label={label} className={base} tabIndex={tabIndex}>{content}</Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={onClick ? active : undefined} className={base} tabIndex={tabIndex}>{content}</button>
  );
}

// ─── Pilulas e abas ───────────────────────────────────────────────────────────

export type PillOption<T extends string> = { value: T; label: ReactNode; dot?: string; icon?: ComponentType<{ className?: string; style?: CSSProperties }>; accent?: string };

/** Tira de chips (filtros). Selecionado: branco cheio. Quebra em linhas no computador; rola no celular. */
export function PillStrip<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (value: NoInfer<T>) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-margin px-margin whitespace-nowrap md:flex-wrap md:overflow-visible md:mx-0 md:px-0', className)} role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-full type-label-badge text-[0.8125rem] border transition-colors duration-200 active:scale-95',
              active ? 'bg-white text-black border-white' : 'border-white/20 text-silver hover:text-white hover:border-white/50',
            )}
          >
            {Icon && <Icon className="w-4 h-4" style={{ color: active ? undefined : option.accent }} />}
            {option.dot && !Icon && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: option.dot }} aria-hidden />}
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
    <div className={cn('bg-asphalt p-1 rounded-full border border-hairline flex items-center gap-1 overflow-x-auto no-scrollbar', className)} role="tablist">
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
              'flex-1 min-w-fit h-9 px-4 text-center rounded-full type-label-badge text-[0.8125rem] transition-colors duration-200 whitespace-nowrap',
              active ? 'bg-white text-black' : 'text-silver hover:text-white',
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

/** "8 d 03 h 41 min" em uma linha, algarismos tabulares. `size` ajusta a escala; sem caixa, sem pulsar. */
export function Countdown({ target, labels, className, size = 'md' }: {
  target: number;
  labels: { d: string; h: string; m: string };
  className?: string;
  size?: 'md' | 'lg';
}) {
  const now = useNow(1000);
  const c = countdownTo(target, now);
  const num = (value: number, label: string, pad = true) => (
    <span className="inline-flex items-baseline gap-1">
      <span className={cn('font-extrabold text-white tabular', size === 'lg' ? 'text-[2.25rem] leading-none' : 'text-[1.5rem] leading-none')}>{pad ? pad2(value) : value}</span>
      <span className="type-label-badge text-silver">{label}</span>
    </span>
  );
  return (
    <div className={cn('flex items-baseline gap-4', className)} role="timer" aria-label={`${c.days} ${labels.d} ${c.hours} ${labels.h} ${c.minutes} ${labels.m}`}>
      {c.days > 0 && num(c.days, labels.d, false)}
      {num(c.hours, labels.h)}
      {num(c.minutes, labels.m)}
    </div>
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-2xl bg-asphalt border border-hairline-soft', className)} aria-hidden />;
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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-asphalt border border-hairline rounded-2xl">
      {Icon && <Icon className="w-9 h-9 text-silver-dim mb-3" />}
      <h3 className="type-headline-sm text-white">{title}</h3>
      {hint && <p className="type-body-sm text-silver mt-1.5 max-w-xs">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Id estavel e valido em CSS/SVG (para <linearGradient id> e similares). */
export function useUid(prefix = 'ph') {
  return `${prefix}-${useId().replace(/:/g, '')}`;
}
