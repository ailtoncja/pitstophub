import type { RuleSection } from '../types';

export type RuleKind = 'scoring' | 'balance' | 'classes' | 'car' | 'fun' | 'format';

/** Tipo de cada secao de regras, pelo titulo (os titulos vem do catalogo, em PT ou EN). */
export function ruleKind(title: string): RuleKind {
  const t = title.toLowerCase();
  if (/pontua|point|scoring|classifica|standing/.test(t)) return 'scoring';
  if (/balance|\bbop\b/.test(t)) return 'balance';
  if (/classe|class|piloto e|driver and/.test(t)) return 'classes';
  if (/carro|\bcars?\b|regulamento|rally1|brido|hybrid/.test(t)) return 'car';
  if (/curiosidade|trivia|fun fact/.test(t)) return 'fun';
  return 'format';
}

/** Indice da secao que explica a pontuacao (link "Como funcionam os pontos?" da classificacao). */
export function scoringRuleIndex(rules: RuleSection[]): number | null {
  const index = rules.findIndex((rule) => /pontua|scoring|points|classifica/.test(`${rule.title} ${rule.enTitle ?? ''}`.toLowerCase()));
  return index >= 0 ? index : null;
}

/** Titulo curto para os atalhos do topo ("Curiosidades e regras especiais" -> "Curiosidades e regras…"). */
export function shortRuleTitle(title: string, max = 22): string {
  if (title.length <= max) return title;
  const head = title.slice(0, max);
  const cut = head.includes(' ') ? head.slice(0, head.lastIndexOf(' ')) : head;
  return `${cut.replace(/[,\s-]+$/, '')}…`;
}
