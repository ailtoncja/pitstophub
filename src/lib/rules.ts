import type { Category, Race, RuleSection } from '../types';

export type RuleKind = 'scoring' | 'balance' | 'classes' | 'car' | 'fun' | 'format';

/** Regras vindas da api-motorsports / tabela points_rules para a temporada ativa. */
export interface RemoteCategoryRules {
  season: number;
  assumed: boolean;
  sessions?: Record<string, number[]> | null;
  multipliers?: Record<string, number> | null;
  drops?: number | null;
  useSourcePoints?: boolean | null;
  perClass?: boolean | null;
  sections?: RuleSection[] | null;
  longDescription?: string | null;
  enLongDescription?: string | null;
  note?: string | null;
  updatedAt?: string | null;
}

/** Tipo de cada secao de regras, pelo titulo (os titulos vem do catalogo, em PT ou EN). */
export function ruleKind(title: string): RuleKind {
  const t = title.toLowerCase();
  if (/pontua|point|scoring|classifica|standing/.test(t)) return 'scoring';
  if (/balance|\bbop\b/.test(t)) return 'balance';
  if (/classe|class|divis[oõ]es|divisions|piloto e|driver and/.test(t)) return 'classes';
  if (/carro|\bcars?\b|regulamento|rally1|wrc27|brido|hybrid/.test(t)) return 'car';
  if (/curiosidade|trivia|fun fact|quirk/.test(t)) return 'fun';
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

const PT_NUMBERS: Record<number, string> = {
  1: 'uma',
  2: 'duas',
  3: 'três',
  4: 'quatro',
  5: 'cinco',
  6: 'seis',
  7: 'sete',
  8: 'oito',
  9: 'nove',
  10: 'dez',
};

const EN_NUMBERS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};

function formatListPt(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

function formatListEn(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function hasSprintSession(race: Race): boolean {
  return (race.sessions ?? []).some(
    (s) => s.id === 'sprint' || /\bsprint\b/i.test(s.name) && !/qualifying|shootout|classifica/i.test(s.name),
  );
}

/** Descobre o ano da temporada ativa da categoria a partir do calendario (ou da regra confirmada). */
export function activeSeasonOf(
  category: Category,
  remoteRules?: RemoteCategoryRules | null,
  fallbackYear = new Date().getFullYear(),
): number {
  const activeRaces = (category.calendar ?? []).filter((r) => r.status !== 'cancelled');
  const pool = activeRaces.length > 0 ? activeRaces : (category.calendar ?? []);
  const counts = new Map<number, number>();
  for (const race of pool) {
    const y = Number(String(race.date ?? '').slice(0, 4));
    if (Number.isFinite(y) && y > 1900) {
      counts.set(y, (counts.get(y) ?? 0) + 1);
    }
  }
  if (counts.size > 0) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  }
  if (remoteRules && !remoteRules.assumed && Number.isFinite(remoteRules.season)) {
    return remoteRules.season;
  }
  return fallbackYear;
}

function adaptF1Rules(category: Category, season: number, sections: RuleSection[]): {
  sections: RuleSection[];
  longDescription?: string;
  enLongDescription?: string;
} {
  const activeRaces = (category.calendar ?? []).filter((r) => r.status !== 'cancelled');
  const hasAnySessions = activeRaces.some((r) => (r.sessions?.length ?? 0) > 0);
  const sprintRaces = activeRaces.filter(hasSprintSession);

  const teamCount = category.teams.length >= 10 ? category.teams.length : 11;
  const carCount = category.drivers.length >= 20 && category.drivers.length % 2 === 0 ? category.drivers.length : teamCount * 2;
  const cutCount = Math.max(5, Math.floor((carCount - 10) / 2));
  const cutPt = PT_NUMBERS[cutCount] ?? String(cutCount);
  const cutEn = EN_NUMBERS[cutCount] ?? String(cutCount);

  let sprintSentencePt: string;
  let sprintSentenceEn: string;
  let scoringSprintPt: string;
  let scoringSprintEn: string;

  if (sprintRaces.length > 0) {
    const count = sprintRaces.length;
    const countPt = PT_NUMBERS[count] ?? String(count);
    const countEn = EN_NUMBERS[count] ?? String(count);
    const venuesPt = formatListPt(sprintRaces.map((r) => r.location || r.name));
    const venuesEn = formatListEn(sprintRaces.map((r) => r.enLocation || r.location || r.enName || r.name));
    const nounPt = count === 1 ? 'etapa' : 'etapas';
    const nounEn = count === 1 ? 'calendar round' : 'calendar rounds';
    sprintSentencePt = `Em ${countPt} ${nounPt} do calendário (${venuesPt}), o fim de semana ganha o formato Sprint`;
    sprintSentenceEn = `On ${countEn} ${nounEn} (${venuesEn}) the weekend switches to the Sprint format`;
    scoringSprintPt = `Nas ${countPt} corridas Sprint do calendário`;
    scoringSprintEn = `On the ${countEn} Sprint weekends`;
  } else if (season === 2026 && !hasAnySessions) {
    sprintSentencePt = 'Em seis etapas do calendário (Xangai, Miami, Montreal, Silverstone, Zandvoort e Singapura), o fim de semana ganha o formato Sprint';
    sprintSentenceEn = 'On six calendar rounds (Shanghai, Miami, Montreal, Silverstone, Zandvoort and Singapore) the weekend switches to the Sprint format';
    scoringSprintPt = 'Nas seis corridas Sprint do calendário';
    scoringSprintEn = 'On the six Sprint weekends';
  } else {
    sprintSentencePt = 'Em etapas selecionadas do calendário, o fim de semana ganha o formato Sprint';
    sprintSentenceEn = 'On selected calendar rounds the weekend switches to the Sprint format';
    scoringSprintPt = 'Nas corridas Sprint do calendário';
    scoringSprintEn = 'On Sprint weekends';
  }

  const gridSentencePt =
    season === 2026
      ? `Com a chegada da Cadillac, o grid de 2026 chega a ${teamCount} equipes e ${carCount} carros — por isso ${cutPt} carros, e não mais cinco, caem em cada corte.`
      : `Com o grid de ${teamCount} equipes e ${carCount} carros, ${cutPt} carros são eliminados em cada um dos dois primeiros cortes (Q1 e Q2).`;

  const gridSentenceEn =
    season === 2026
      ? `With Cadillac joining, the 2026 grid grows to ${teamCount} teams and ${carCount} cars — so ${cutEn} cars, not five, are cut at each stage.`
      : `With a grid of ${teamCount} teams and ${carCount} cars, ${cutEn} cars are eliminated in each of the first two knockout segments (Q1 and Q2).`;

  const updated = sections.map((sec) => {
    const kind = ruleKind(`${sec.title} ${sec.enTitle ?? ''}`);
    if (kind === 'format') {
      return {
        ...sec,
        body: `Um fim de semana padrão tem três treinos livres (FP1, FP2, FP3) e uma classificação eliminatória em três partes: Q1, Q2 e Q3, em que os 10 mais rápidos decidem a pole. ${gridSentencePt} ${sprintSentencePt}: uma Sprint Qualifying própria (SQ1 de 12 min, SQ2 de 10 min, SQ3 de 8 min, com apenas um jogo de pneus por segmento) define o grid de uma corrida curta no sábado, que não interfere na pole do domingo. Depois da classificação, os carros entram em parc fermé e a configuração mecânica não pode mais ser alterada até a corrida.`,
        enBody: `A standard weekend has three free practice sessions (FP1, FP2, FP3) and a three-part knockout qualifying (Q1, Q2 and Q3), where the fastest 10 fight for pole. ${gridSentenceEn} ${sprintSentenceEn}: a separate Sprint Qualifying (SQ1 12 min, SQ2 10 min, SQ3 8 min, one tyre set per segment) sets the grid for a short Saturday race that has no bearing on Sunday's pole. Once qualifying ends, cars enter parc fermé and their mechanical setup is frozen until the race.`,
      };
    }
    if (kind === 'scoring') {
      return {
        ...sec,
        body: `No Grande Prêmio de domingo, os 10 primeiros pontuam 25-18-15-12-10-8-6-4-2-1, com um ponto extra para quem fizer a volta mais rápida da corrida estando entre os 10 primeiros. ${scoringSprintPt}, pontuam apenas os oito primeiros: 8-7-6-5-4-3-2-1, sem ponto de volta rápida. O campeonato de pilotos soma os pontos de Sprint e GP; o de construtores soma os pontos dos dois carros de cada equipe.`,
        enBody: `In Sunday's Grand Prix, the top 10 score 25-18-15-12-10-8-6-4-2-1, with a bonus point for the fastest race lap if set by a top-10 finisher. ${scoringSprintEn}, only the top eight score: 8-7-6-5-4-3-2-1, with no fastest-lap bonus. The Drivers' Championship adds up Sprint and GP points; the Constructors' Championship adds both cars from each team.`,
      };
    }
    if (kind === 'car' && season >= 2027) {
      return {
        ...sec,
        title: 'Carros e regulamento técnico',
        enTitle: 'Cars and technical regulations',
        body: (sec.body ?? '').replace(/^A geração 2026 troca a base técnica da categoria\./, 'A geração técnica introduzida em 2026 define a base atual da categoria.'),
        enBody: (sec.enBody ?? '').replace(/^The 2026 generation overhauls the category's technical base\./, 'The technical generation introduced in 2026 defines the category\'s current regulations.'),
      };
    }
    if (kind === 'fun' && season >= 2027) {
      return {
        ...sec,
        body: (sec.body ?? '').replace('O DRS deixou de existir em 2026:', 'O DRS deixou de existir desde a reforma técnica de 2026:'),
        enBody: (sec.enBody ?? '').replace('DRS is gone in 2026:', 'DRS was retired in the 2026 technical overhaul:'),
      };
    }
    return sec;
  });

  const longDescription =
    season >= 2027 && category.longDescription
      ? category.longDescription.replace(
          'Em 2026, novas regras de motores e aerodinâmica entram em vigor, focando em combustíveis 100% sustentáveis e maior potência elétrica.',
          'Desde 2026, o regulamento técnico combina combustíveis 100% sustentáveis, aerodinâmica ativa e motores híbridos com maior potência elétrica.',
        )
      : category.longDescription;

  const enLongDescription =
    season >= 2027 && category.enLongDescription
      ? category.enLongDescription.replace(
          'In 2026, new engine and aerodynamic rules come into force, focusing on 100% sustainable fuels and greater electric power.',
          'Since 2026, the technical regulations combine 100% sustainable fuels, active aerodynamics and hybrid power units with greater electric power.',
        )
      : category.enLongDescription;

  return { sections: updated, longDescription, enLongDescription };
}

function adaptWrcRules(season: number, sections: RuleSection[]): {
  sections: RuleSection[];
  longDescription: string;
  enLongDescription: string;
} {
  if (season >= 2027) {
    const updated = sections.map((sec) => {
      if (ruleKind(`${sec.title} ${sec.enTitle ?? ''}`) !== 'car') return sec;
      return {
        title: 'Carros WRC27 (Novo regulamento)',
        enTitle: 'WRC27 cars (New regulations)',
        body: 'Com o regulamento técnico WRC27 (em vigor a partir de 2027 para um ciclo de 10 anos), os carros da categoria principal substituem a antiga geração Rally1 e passam a usar uma célula de segurança tubular padronizada de alta proteção, com motor 1.6 turbo movido a combustível 100% sustentável e potência em torno de 300 a 330 cv controlada por uma curva de torque de referência igual para todo o grid.\n\nMotor, câmbio, freios e suspensão utilizam componentes derivados da categoria Rally2, com teto de custo de € 345 mil por carro para baratear a competição e atrair novas equipes. A carroceria é flexível — podendo adotar formato de hatch, sedã compacto, SUV/crossover ou um conceito de rali próprio dentro dos limites de aerodinâmica e centro de gravidade da FIA — e a homologação é aberta tanto para montadoras oficiais quanto para preparadoras independentes (tuners).',
        enBody: 'Under the WRC27 technical regulations (in force from 2027 for a 10-year cycle), top-class cars replace the former Rally1 generation with a high-protection standardised tubular safety cell, a 1.6L turbo engine running on 100% sustainable fuel and output around 300–330 hp governed by a common reference torque curve across the entire grid.\n\nEngine, transmission, brakes and suspension use Rally2-derived components under a €345,000 per-car cost cap designed to cut costs and attract new teams. Bodywork is flexible — allowing hatchback, compact sedan, crossover/SUV or bespoke rally concept shapes within FIA aerodynamic and centre-of-gravity envelopes — and homologation is open to both OEM manufacturers and independent tuners.',
      };
    });
    return {
      sections: updated,
      longDescription:
        'O WRC é a competição de rali de mais alto nível da FIA. Pilotos e navegadores competem nos carros da geração WRC27 (introduzida em 2027 com célula de segurança padronizada, ~300 a 330 cv, combustível 100% sustentável e mecânica derivada do Rally2) em superfícies que variam de asfalto liso a cascalho bruto, neve e gelo. Cada rali é dividido em "estágios" cronometrados em estradas fechadas ao público. O objetivo é completar os estágios no menor tempo possível. Entre os estágios, os carros circulam em estradas públicas, devendo obedecer às leis de trânsito. O WRC exige uma habilidade de condução incomparável e uma confiança cega entre o piloto e o navegador, que lê as "notas de ritmo" para descrever o que vem pela frente em alta velocidade.',
      enLongDescription:
        'The WRC is the highest level of rally competition from the FIA. Drivers and co-drivers compete in the WRC27 generation of cars (introduced in 2027 with a standardised safety cell, ~300–330 hp, 100% sustainable fuel and Rally2-derived running gear) on surfaces ranging from smooth asphalt to rough gravel, snow and ice. Each rally is divided into timed "stages" on roads closed to the public. The goal is to complete the stages in the shortest time possible. Between stages, cars circulate on public roads, having to obey traffic laws. The WRC requires unparalleled driving skill and blind trust between the driver and the co-driver, who reads the "pace notes" to describe what lies ahead at high speed.',
    };
  }

  // Temporada <= 2026: explica os Rally1 sem hibrido que correm em 2026 e ja antecipa a chegada dos novos carros WRC27 em 2027.
  const updated = sections.map((sec) => {
    if (ruleKind(`${sec.title} ${sec.enTitle ?? ''}`) !== 'car') return sec;
    return {
      title: 'Carros Rally1 e transição para 2027',
      enTitle: 'Rally1 cars and 2027 transition',
      body: 'Na fase final do ciclo Rally1 (até o fim de 2026), os carros correm sem a unidade híbrida plug-in que usaram entre 2022 e 2024: são protótipos tubulares de tração integral com motor 1.6 turbo de cerca de 380 cv movidos a combustível 100% sustentável, mais leves e simples de manter.\n\nA partir de 2027 entra em vigor o novo regulamento técnico WRC27 (ciclo de 10 anos): a potência passa a ficar em torno de 300 a 330 cv controlada por uma curva de torque de referência igual para todos, com motor, câmbio, freios e suspensão derivados da categoria Rally2, célula de segurança padronizada e teto de custo de € 345 mil por carro — permitindo carrocerias de hatch, sedã, SUV ou conceito próprio, abertas tanto a montadoras quanto a preparadoras independentes.',
      enBody: 'In the final phase of the Rally1 cycle (through the end of 2026), cars run without the plug-in hybrid unit used from 2022 to 2024: they are all-wheel-drive spaceframe prototypes powered by a ~380 hp 1.6L turbo engine on 100% sustainable fuel, lighter and simpler to run.\n\nFrom 2027, the new WRC27 technical regulations take effect for a 10-year cycle: power is set around 300–330 hp governed by a common reference torque curve, with Rally2-derived engine, transmission, brakes and suspension, a standardised safety cell and a €345,000 cost cap per car — allowing hatchback, sedan, SUV or bespoke rally concept bodywork from both manufacturers and independent tuners.',
    };
  });

  return {
    sections: updated,
    longDescription:
      'O WRC é a competição de rali de mais alto nível da FIA. Pilotos e navegadores competem em protótipos "Rally1" a combustão 100% sustentável (sem a unidade híbrida usada até 2024, antes da estreia da nova geração WRC27 em 2027) em superfícies que variam de asfalto liso a cascalho bruto, neve e gelo. Cada rali é dividido em "estágios" cronometrados em estradas fechadas ao público. O objetivo é completar os estágios no menor tempo possível. Entre os estágios, os carros circulam em estradas públicas, devendo obedecer às leis de trânsito. O WRC exige uma habilidade de condução incomparável e uma confiança cega entre o piloto e o navegador, que lê as "notas de ritmo" para descrever o que vem pela frente em alta velocidade.',
    enLongDescription:
      'The WRC is the highest level of rally competition from the FIA. Drivers and co-drivers compete in 100% sustainable-fuel "Rally1" prototypes (without the hybrid unit used through 2024, ahead of the new WRC27 generation debuting in 2027) on surfaces ranging from smooth asphalt to rough gravel, snow and ice. Each rally is divided into timed "stages" on roads closed to the public. The goal is to complete the stages in the shortest time possible. Between stages, cars circulate on public roads, having to obey traffic laws. The WRC requires unparalleled driving skill and blind trust between the driver and the co-driver, who reads the "pace notes" to describe what lies ahead at high speed.',
  };
}

function adaptPorscheCupRules(category: Category, season: number, sections: RuleSection[]): {
  sections: RuleSection[];
  longDescription: string;
  enLongDescription: string;
} {
  const activeRaces = (category.calendar ?? []).filter((r) => r.status !== 'cancelled');
  const venuesPt = Array.from(new Set(activeRaces.map((r) => (r.location || r.name || '').trim()).filter(Boolean)));
  const venuesEn = Array.from(new Set(activeRaces.map((r) => (r.enLocation || r.location || r.enName || r.name || '').trim()).filter(Boolean)));

  const carreraModel = season >= 2027 ? '911 Cup 992.2' : '911 Cup 992.1';
  const calendarSentencePt =
    venuesPt.length > 0
      ? `O calendário de ${season} passa por ${formatListPt(venuesPt)}.`
      : 'O calendário combina autódromos brasileiros tradicionais e etapas internacionais.';
  const calendarSentenceEn =
    venuesEn.length > 0
      ? `The ${season} calendar visits ${formatListEn(venuesEn)}.`
      : 'The calendar combines traditional Brazilian circuits with international rounds.';

  const updated = sections.map((sec) => {
    if (sec.title !== 'Divisões' && sec.enTitle !== 'Divisions') return sec;
    if (season >= 2027) {
      return {
        ...sec,
        body: 'Carrera é a divisão de elite e utiliza a partir de 2027 o novo Porsche 911 GT3 Cup (geração 992.2, 510 cv, com aerodinâmica dianteira revisada, eletrônica atualizada e freios otimizados). Challenge é a divisão intermediária, com o 991.2 (485 cv), e Trophy é a divisão de entrada, com o 991.1 (460 cv), largada em fila indiana e sem disputa no Endurance.',
        enBody: 'Carrera is the top division and from 2027 runs the new Porsche 911 GT3 Cup (992.2 generation, 510 hp, featuring revised front aerodynamics, updated electronics and optimised brakes). Challenge is the intermediate division on the 991.2 (485 hp), and Trophy is the entry division on the 991.1 (460 hp), with single-file starts and no Endurance championship.',
      };
    }
    return sec;
  });

  return {
    sections: updated,
    longDescription: `A Porsche Cup Brasil corre desde 2005 com carros rigorosamente iguais, para que a diferença fique só entre os pilotos. São dois campeonatos no mesmo ano: o Sprint, com duas corridas curtas por etapa, e o Endurance, disputado em duplas ou trios em provas de 300 km e 500 km. Dentro de cada um, o grid é dividido em três níveis — Carrera (experientes, ${carreraModel}), Challenge (intermediário, 991.2) e Trophy (iniciantes, 991.1, que não disputa o Endurance). ${calendarSentencePt}`,
    enLongDescription: `Porsche Cup Brasil has run since 2005 with strictly identical cars, so the difference comes down to the drivers. There are two championships in the same year: the Sprint, with two short races per round, and the Endurance, run by two- or three-driver crews over 300 km and 500 km. Within each, the grid is split into three levels — Carrera (experienced, ${carreraModel}), Challenge (intermediate, 991.2) and Trophy (rookies, 991.1, which does not run the Endurance). ${calendarSentenceEn}`,
  };
}

function adaptOther2026Phrasing(categoryId: string, season: number, sections: RuleSection[]): RuleSection[] {
  if (season < 2027) return sections;
  if (categoryId === 'f1-academy') {
    return sections.map((sec) => ({
      ...sec,
      body: (sec.body ?? '')
        .replace(
          'mas em 2026 duas rodadas (Montreal e Austin) ganharam uma terceira corrida, a "Opening Race"',
          'mas etapas selecionadas podem contar com uma terceira corrida, a "Opening Race" (introduzida em 2026)',
        )
        .replace('A "Opening Race", nova em 2026,', 'A "Opening Race", introduzida em 2026,'),
      enBody: (sec.enBody ?? '')
        .replace(
          'but in 2026 two rounds (Montreal and Austin) gained a third race, the "Opening Race"',
          'but selected rounds can feature a third race, the "Opening Race" (introduced in 2026)',
        )
        .replace('The "Opening Race", new for 2026,', 'The "Opening Race", introduced in 2026,'),
    }));
  }
  if (categoryId === 'nascar') {
    return sections.map((sec) => ({
      ...sec,
      body: (sec.body ?? '').replace('A NASCAR volta em 2026 ao formato "Chase":', 'Desde 2026, a NASCAR adota novamente o formato "Chase":'),
      enBody: (sec.enBody ?? '').replace('NASCAR returns to the "Chase" format in 2026:', 'Since 2026, NASCAR uses the "Chase" format:'),
    }));
  }
  if (categoryId === 'indy') {
    return sections.map((sec) => ({
      ...sec,
      body: (sec.body ?? '').replace('Em 2026, a INDYCAR aumentou', 'Desde 2026, a INDYCAR aumentou'),
      enBody: (sec.enBody ?? '').replace('For 2026, INDYCAR raised', 'Since 2026, INDYCAR raised'),
    }));
  }
  return sections;
}

function mergeRemoteSections(base: RuleSection[], remote: RuleSection[]): RuleSection[] {
  const result = base.map((s) => ({ ...s }));
  for (const incoming of remote) {
    const incomingTitle = incoming.title.trim().toLowerCase();
    const incomingEnTitle = (incoming.enTitle ?? '').trim().toLowerCase();
    const incomingKind = ruleKind(`${incoming.title} ${incoming.enTitle ?? ''}`);

    let idx = result.findIndex(
      (s) =>
        s.title.trim().toLowerCase() === incomingTitle ||
        (incomingEnTitle && (s.enTitle ?? '').trim().toLowerCase() === incomingEnTitle),
    );
    if (idx === -1) {
      const sameKindIndexes = result
        .map((s, i) => (ruleKind(`${s.title} ${s.enTitle ?? ''}`) === incomingKind ? i : -1))
        .filter((i) => i >= 0);
      if (sameKindIndexes.length === 1) idx = sameKindIndexes[0];
    }

    if (idx >= 0) {
      result[idx] = {
        title: incoming.title,
        enTitle: incoming.enTitle ?? result[idx].enTitle,
        body: incoming.body,
        enBody: incoming.enBody ?? result[idx].enBody,
      };
    } else {
      result.push({
        title: incoming.title,
        enTitle: incoming.enTitle ?? incoming.title,
        body: incoming.body,
        enBody: incoming.enBody ?? incoming.body,
      });
    }
  }
  return result;
}

/**
 * Adapta automaticamente as secoes da pagina "Como funciona" e a descricao da categoria
 * conforme o ano ativo do calendario, os dados vivos (cidades de Sprint, tamanho do grid,
 * pistas do calendario), as mudancas de regulamento ja confirmadas (ex.: carros WRC27 em 2027,
 * Porsche 992.2 em 2027) e eventuais regras novas salvas no banco (points_rules).
 */
export function resolveCategoryRules(
  category: Category,
  remoteRules?: RemoteCategoryRules | null,
  fallbackYear = new Date().getFullYear(),
): Category {
  const season = activeSeasonOf(category, remoteRules, fallbackYear);
  let sections = (category.rulesFormat ?? []).map((s) => ({ ...s }));
  let longDescription = category.longDescription;
  let enLongDescription = category.enLongDescription;

  if (category.id === 'f1') {
    const adapted = adaptF1Rules(category, season, sections);
    sections = adapted.sections;
    longDescription = adapted.longDescription;
    enLongDescription = adapted.enLongDescription;
  } else if (category.id === 'wrc') {
    const adapted = adaptWrcRules(season, sections);
    sections = adapted.sections;
    longDescription = adapted.longDescription;
    enLongDescription = adapted.enLongDescription;
  } else if (category.id === 'porsche-cup') {
    const adapted = adaptPorscheCupRules(category, season, sections);
    sections = adapted.sections;
    longDescription = adapted.longDescription;
    enLongDescription = adapted.enLongDescription;
  } else {
    sections = adaptOther2026Phrasing(category.id, season, sections);
  }

  // Sobrescritas confirmadas vindas do banco / api-motorsports especificamente para a temporada ativa.
  if (remoteRules && !remoteRules.assumed && remoteRules.season === season) {
    if (remoteRules.sections && remoteRules.sections.length > 0) {
      sections = mergeRemoteSections(sections, remoteRules.sections);
    }
    if (remoteRules.longDescription) longDescription = remoteRules.longDescription;
    if (remoteRules.enLongDescription) enLongDescription = remoteRules.enLongDescription;
  }

  return {
    ...category,
    rulesFormat: sections,
    longDescription,
    enLongDescription,
  };
}
