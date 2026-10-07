import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText } from 'lucide-react';
import { getRaceCircuitInfo } from '../circuit-info';
import { splitBio } from '../lib/bio';
import { cn } from '../lib/utils';
import type { Race } from '../types';

// Componentes do "Velocity Control" (o mesmo visual do app Android): canto cortado, selo inclinado, sombra "decalque",
// fibra de carbono e hero com mapa do circuito.

/** Selo vermelho inclinado a 15 graus ("PROXIMA CORRIDA"). */
export function SkewBadge({ children, live = false, className }: { children: ReactNode; live?: boolean; className?: string }) {
  return (
    <span className={cn('skew-shape inline-flex items-center gap-1.5 bg-primary-container text-on-primary-container px-[18px] py-1 type-label-badge uppercase', className)}>
      {live && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden />}
      {children}
    </span>
  );
}

type CutProps = { variant?: 'primary' | 'outline'; className?: string; children: ReactNode; to?: string; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean };

/** Botao do app: canto superior direito cortado. Primario = vermelho com sombra branca; contorno = borda fina. */
export function CutButton({ variant = 'primary', className, children, to, onClick, type = 'button', disabled }: CutProps) {
  const base = 'inline-flex items-center justify-center gap-2 px-6 py-3 type-label-badge uppercase tracking-wider transition-transform active:scale-[0.98] disabled:opacity-50';
  if (variant === 'primary') {
    const cls = cn(base, 'cut-corner bg-primary-container text-white', className);
    return (
      <span className="inline-flex" style={{ filter: 'drop-shadow(3px 3px 0 rgba(255,255,255,0.1))' }}>
        {to ? <Link to={to} className={cls}>{children}</Link> : <button type={type} onClick={onClick} disabled={disabled} className={cls}>{children}</button>}
      </span>
    );
  }
  // contorno: duas camadas recortadas igualmente (a de fora e a "borda")
  const inner = cn(base, 'cut-corner [--cut:15px] bg-carbon text-on-surface m-px');
  return (
    <span className={cn('cut-corner bg-white/80 inline-flex', className)}>
      {to ? <Link to={to} className={cn(inner, 'w-full')}>{children}</Link> : <button type={type} onClick={onClick} disabled={disabled} className={cn(inner, 'w-full')}>{children}</button>}
    </span>
  );
}

/** Fundo do hero: degrade escuro, faixas vermelhas inclinadas, fibra de carbono e o mapa do circuito (ou a sigla da serie). */
export function HeroBackdrop({ race, categoryName, className, artClassName }: { race?: Race | null; categoryName?: string; className?: string; artClassName?: string }) {
  const art = useMemo(() => (race ? getRaceCircuitInfo(race)?.trackImage : undefined), [race]);
  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#2e0707 0%,#0c0c12 50%,#000 100%)' }} />
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <polygon points="50,0 56,0 50,100 44,100" fill="#e10600" opacity="0.1" />
        <polygon points="66,0 69,0 63,100 60,100" fill="#e10600" opacity="0.2" />
        <polygon points="78,0 90,0 84,100 72,100" fill="#e10600" opacity="0.07" />
      </svg>
      <div className="absolute inset-0 carbon-lines" />
      {art ? (
        <img src={art} alt="" className={cn('absolute top-0 inset-x-0 mx-auto h-[58%] w-full object-contain px-7 py-5 opacity-90', artClassName)} loading="lazy" />
      ) : categoryName ? (
        <span className="absolute top-6 right-5 type-display-hero text-[64px] leading-[70px] text-white/[0.07] uppercase">{categoryName}</span>
      ) : null}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.88) 75%, #000 100%)' }} />
    </div>
  );
}

/**
 * Cartao editorial para biografias e regras: faixa vermelha na lateral, aspas grandes ao fundo, a primeira frase em
 * destaque e o resto em paragrafos curtos com bastante respiro.
 */
export function BioCard({ text, className }: { text: string; className?: string }) {
  const bio = useMemo(() => splitBio(text), [text]);
  if (!bio.lead) return null;
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-asphalt border border-hairline', className)}>
      <span className="absolute top-1 right-4 type-display-hero text-[120px] leading-[120px] text-primary-container/[0.11] select-none" aria-hidden>“</span>
      <div className="relative flex">
        <span className="w-1 bg-primary-container shrink-0" aria-hidden />
        <div className="px-5 pt-[22px] pb-6 space-y-3.5">
          <p className="font-inter text-[18px] leading-[27px] font-semibold text-on-surface">{bio.lead}</p>
          {bio.paragraphs.length > 0 && (
            <>
              <span className="block w-10 h-[3px] bg-primary-container" aria-hidden />
              {bio.paragraphs.map((paragraph) => (
                <p key={paragraph} className="font-inter text-[16px] leading-[26px] text-silver">{paragraph}</p>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Atalho bem visivel para a pagina "Como funciona" da categoria. */
export function HowItWorksCard({ to, title, subtitle }: { to: string; title: string; subtitle: string }) {
  return (
    <Link to={to} className="flex items-center gap-3.5 rounded-lg bg-asphalt border border-primary/45 p-4 hover:bg-asphalt-alt transition-colors">
      <span className="w-12 h-12 rounded-md bg-primary-container text-white flex items-center justify-center shrink-0">
        <BookOpenText className="w-[26px] h-[26px]" />
      </span>
      <span className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="type-headline-md text-[18px] leading-[22px] uppercase text-on-surface">{title}</span>
        <span className="type-label-badge text-on-surface-variant line-clamp-2">{subtitle}</span>
      </span>
      <ArrowRight className="w-5 h-5 text-primary shrink-0" />
    </Link>
  );
}
