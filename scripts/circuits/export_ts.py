"""Write src/circuit-drawings.ts from the published layouts.

usage: python export_ts.py

Only layouts with status "published", a drawing in public/circuits and a passing
verification/<key>.json are exported. Facts (length, corners, direction) are exported only
when the layout file gives an official source URL for them.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import PUBLIC, REPO, VERIFY, all_layout_keys, load_json, load_layout  # noqa: E402

OUT = os.path.join(REPO, 'src', 'circuit-drawings.ts')

HEADER = '''// GERADO por scripts/circuits/export_ts.py -- nao edite a mao.
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

'''


def main():
    entries = []
    for key in all_layout_keys():
        layout = load_layout(key)
        if layout.get('status') != 'published':
            continue
        if not os.path.exists(os.path.join(PUBLIC, key + '.png')):
            raise SystemExit(f'{key}: published but public/circuits/{key}.png is missing')
        v = load_json(os.path.join(VERIFY, key + '.json'))
        if not v.get('pass'):
            raise SystemExit(f'{key}: published but its verification did not pass')
        off = layout['official']
        e = {'name': layout['name'], 'layout': layout.get('layout', ''), 'trackImage': f'/circuits/{key}.png'}
        src = {'map': off.get('map_page') or off['map_url']}
        if off.get('length_source'):
            e['lengthKm'] = round(off['length_m'] / 1000, 3)
            src['length'] = off['length_source']
        if off.get('corners') is not None and off.get('corners_source'):
            e['corners'] = int(off['corners'])
            src['corners'] = off['corners_source']
        if off.get('direction') in ('clockwise', 'counterclockwise') and off.get('direction_source'):
            e['direction'] = off['direction']
            src['direction'] = off['direction_source']
        e['sources'] = src
        entries.append((key, e))
    body = 'export const DRAWN_CIRCUITS: Record<string, DrawnCircuit> = {\n'
    for key, e in entries:
        body += f'  {json.dumps(key)}: {json.dumps(e, ensure_ascii=False)},\n'
    body += '};\n'
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(HEADER + body)
    print(OUT, len(entries), 'circuits')


if __name__ == '__main__':
    main()
