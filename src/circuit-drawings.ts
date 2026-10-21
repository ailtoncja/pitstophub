// GERADO por scripts/circuits/export_ts.py -- nao edite a mao.
//
// Desenhos de circuito feitos a partir do OpenStreetMap (© OpenStreetMap contributors, ODbL):
// o traçado de cada layout e a volta de highway=raceway (ou das ruas, nos circuitos de rua)
// guardada em scripts/circuits/data/<chave>.json. Cada desenho foi conferido com um mapa oficial
// independente (scripts/circuits/verification/<chave>.json): formato, espelhamento, distorcao e
// extensao. Extensao, curvas e sentido so aparecem quando ha fonte oficial (sources).

export type DrawnCircuit = {
  name: string;
  layout: string;
  trackImage: string;
  lengthKm?: number;
  corners?: number;
  direction?: 'clockwise' | 'counterclockwise';
  sources: { map: string; length?: string; corners?: string; direction?: string };
};

export const DRAWN_CIRCUITS: Record<string, DrawnCircuit> = {
};
