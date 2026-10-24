import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenText } from 'lucide-react';
import { getRaceCircuitInfo } from '../circuit-info';
import { splitBio } from '../lib/bio';
import { accentOf } from '../lib/categories-meta';
import { cn } from '../lib/utils';
import { MOTORSPORT_DATA, type Race } from '../types';

// Peças do "Reel": campo de cor da categoria, mídia sangrando até a borda e etiquetas de estado.

// Desenho do carro de cada serie (arte branca com transparencia em public/cars, tingida pelo tom da categoria).
const CAR_ART: Record<string, string> = {
  f1: '/cars/f1.webp',
  f2: '/cars/f1.webp',
  f3: '/cars/f1.webp',
  'f1-academy': '/cars/f1.webp',
  indy: '/cars/indy.webp',
  nascar: '/cars/nascar.webp',
  wrc: '/cars/wrc.webp',
  dtm: '/cars/dtm.webp',
  wec: '/cars/gt3-hyper.webp',
  imsa: '/cars/gt3-hyper.webp',
  'gtwc-europe': '/cars/gt3.webp',
  'gtwc-america': '/cars/gt3.webp',
  'gtwc-asia': '/cars/gt3.webp',
  'endurance-brasil': '/cars/gt3.webp',
};

export function carArtOf(categoryId: string): string | undefined {
  return CAR_ART[categoryId] ?? (MOTORSPORT_DATA.some((category) => category.id === categoryId) ? '/cars/gt3.webp' : undefined);
}

/** Etiqueta de estado da largada: ao vivo (ponto vermelho), a confirmar, temporada encerrada. Sem caixa colorida. */
export function StatusTag({ live = false, children, className }: { live?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 type-label-badge text-[0.8125rem]', live ? 'text-white' : 'text-silver', className)}>
      {live && <span className="w-2 h-2 rounded-full bg-racing-red animate-pulse" aria-hidden />}
      {children}
    </span>
  );
}

/**
 * Campo do reel: o tom da categoria tinge o fundo e o desenho do carro da serie. Com `art="track"` (paginas de corrida
 * e calendario) usa o mapa do circuito quando existe. Um veu preto embaixo carrega o texto.
 */
export function ReelBackdrop({
  race,
  categoryId,
  hue: hueOverride,
  bare = false,
  eager = false,
  art = 'track',
  compact = false,
  className,
}: {
  race?: Race | null;
  categoryId: string;
  /** Tom do campo quando nao e o da categoria (ex.: cor da equipe na pagina do piloto). */
  hue?: string;
  /** Sem mapa nem carro: so o campo e o veu (paginas que trazem a propria foto). */
  bare?: boolean;
  /** Carrega a arte ja (os dois primeiros itens do reel: o seguinte precisa estar pronto quando aparece embaixo). */
  eager?: boolean;
  /** "car" sempre mostra o carro da serie (Inicio); "track" prefere o mapa do circuito. */
  art?: 'car' | 'track';
  /** Cartoes pequenos: carro menor, no canto, para caber inteiro. */
  compact?: boolean;
  className?: string;
}) {
  const hue = hueOverride ?? accentOf(categoryId);
  const circuit = useMemo(() => (race && !bare && art === 'track' ? getRaceCircuitInfo(race, categoryId) : null), [race, bare, art, categoryId]);
  const track = circuit?.trackImage;
  const car = bare ? undefined : carArtOf(categoryId);
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-black', className)} aria-hidden>
      <div className="absolute inset-0" style={{ background: `radial-gradient(120% 80% at 75% 8%, color-mix(in oklab, ${hue} 46%, #000) 0%, color-mix(in oklab, ${hue} 18%, #000) 46%, #000 82%)` }} />
      {track ? (
        <>
          <img src={track} alt="" className="absolute top-[7%] inset-x-0 mx-auto h-[50%] w-[92%] object-contain" loading={eager ? 'eager' : 'lazy'} />
          {/* Desenho feito a partir do OpenStreetMap: o credito (ODbL) acompanha o desenho. */}
          {circuit?.osm && <span className="absolute top-[57%] right-[5%] type-label-telemetry text-white/60">© OpenStreetMap</span>}
        </>
      ) : car ? (
        <>
          {/* pre-carrega a arte (mask-image nao tem loading="eager") */}
          {eager && <link rel="preload" as="image" href={car} />}
          <div
            className={cn('absolute aspect-[1672/941]', compact ? 'top-[6%] right-[15%] w-[52%]' : 'top-[5%] inset-x-0 mx-auto w-[96%] max-w-[46rem]')}
            style={{
              backgroundColor: `color-mix(in oklab, ${hue} 30%, #fff)`,
              opacity: 0.8,
              WebkitMaskImage: `url(${car})`,
              maskImage: `url(${car})`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />
        </>
      ) : null}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.88) 26%, rgba(0,0,0,0.35) 52%, transparent 70%)' }} />
    </div>
  );
}

/**
 * Texto editorial para biografias e regras: a primeira frase em destaque, o resto em parágrafos curtos
 * numa medida de leitura confortável.
 */
export function BioCard({ text, className }: { text: string; className?: string }) {
  const bio = useMemo(() => splitBio(text), [text]);
  if (!bio.lead) return null;
  return (
    <div className={cn('max-w-[68ch] space-y-4', className)}>
      <p className="type-body-lg text-white font-semibold">{bio.lead}</p>
      {bio.paragraphs.map((paragraph) => (
        <p key={paragraph} className="type-body-lg text-silver">{paragraph}</p>
      ))}
    </div>
  );
}

/** Atalho para a página "Como funciona" da categoria: linha clicável padrão. */
export function HowItWorksCard({ to, title, subtitle }: { to: string; title: string; subtitle: string }) {
  return (
    <Link to={to} className="group flex items-center gap-4 rounded-2xl bg-asphalt border border-hairline p-4 hover:border-white/40 transition-colors">
      <span className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shrink-0">
        <BookOpenText className="w-5 h-5" />
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="type-headline-sm text-white">{title}</span>
        <span className="type-body-sm text-silver line-clamp-2">{subtitle}</span>
      </span>
      <ArrowRight className="w-5 h-5 text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
