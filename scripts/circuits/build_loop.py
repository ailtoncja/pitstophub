"""Pick the lap of each layout out of the OpenStreetMap ways and save it as data/<key>.json.

usage: python build_loop.py [key ...]

select.mode (layout file):
  "cycle"     (default) every closed loop the raceway ways form is listed and the one whose
              length is closest to the official length wins. select.require_ways (way ids the
              lap must use), select.exclude_ways and select.include_ways (extra ways, e.g. public
              roads that are part of the circuit, or leisure=track ways of circuits not tagged as a
              raceway) disambiguate layouts that share a venue; select.only_ways fixes the ways.
  "waypoints" the lap is the shortest route through select.waypoints ([lat, lon], in lap
              order) over the raceway ways plus, with select.streets, the public streets.
              Used for street circuits, whose streets are not tagged as a raceway.
A debug picture (all candidate ways with their ids, the chosen lap in red) goes to
<cache>/debug/<key>_loop.png.
"""
import math
import os
import re
import sys

import networkx as nx
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import DATA, cache, keys_from_argv, load_json, load_layout, projector, save_json  # noqa: E402

# word starts, in the way's name/raceway/service tags (not 'paddock': Brands Hatch's Paddock Hill bend;
# not the description: Magny-Cours' GP way mentions the karting track)
PITLIKE = ('pit', 'boxengasse', 'kart', 'drag', 'skid', 'drift', 'autocross', 'motocross', 'dirt', 'oval track access')


def is_pitlike(tags):
    if tags.get('area') == 'yes':
        return True
    if tags.get('raceway') in ('pit_lane', 'pitlane', 'pit', 'paddock', 'drag_strip', 'karting'):
        return True
    if tags.get('sport') in ('karting', 'motocross', 'drag_racing', 'dirt_bike'):
        return True
    text = ' '.join(str(tags.get(k, '')) for k in ('name', 'raceway', 'service')).lower()
    # whole words only: Hockenheim's hairpin is called "Spitzkehre"
    return re.search(r'(' + '|'.join(PITLIKE) + r')', text) is not None


def load_osm(layout, key):
    venue = layout.get('venue_key', key)
    d = load_json(cache('osm', venue + '.json'))
    ways, rels = {}, []
    for e in d['elements']:
        if e['type'] == 'way' and 'geometry' in e and len(e['nodes']) == len(e['geometry']):
            ways[e['id']] = e
        elif e['type'] == 'relation':
            rels.append(e)
    return ways, rels, d.get('osm3s', {}).get('timestamp_osm_base')


def candidate_ways(layout, ways, rels):
    sel = layout.get('select', {})
    exclude = set(sel.get('exclude_ways', []))
    include = set(sel.get('include_ways', [])) | set(sel.get('require_ways', []))
    chosen = set()
    for wid, w in ways.items():
        t = w.get('tags', {})
        if t.get('highway') == 'raceway' and not is_pitlike(t):
            chosen.add(wid)
    for rid in sel.get('relations', []):
        rel = next((r for r in rels if r['id'] == rid), None)
        if rel is None:
            raise SystemExit(f'relation {rid} not in the extract')
        for m in rel['members']:
            if m['type'] == 'way' and m['ref'] in ways and 'pit' not in m.get('role', '').lower():
                chosen.add(m['ref'])
    if sel.get('streets'):
        for wid, w in ways.items():
            t = w.get('tags', {})
            if 'highway' in t and t.get('area') != 'yes' and t['highway'] != 'raceway':
                chosen.add(wid)
    if sel.get('only_ways'):
        chosen = set(sel['only_ways'])
    return (chosen | include) - exclude


def node_graph(way_ids, ways, proj):
    G = nx.Graph()
    pos = {}
    for wid in way_ids:
        w = ways[wid]
        for n, g in zip(w['nodes'], w['geometry']):
            pos[n] = proj(g['lat'], g['lon'])
        for a, b in zip(w['nodes'], w['nodes'][1:]):
            if a != b:
                G.add_edge(a, b, way=wid, w=math.dist(pos[a], pos[b]))
    return G, pos


def bridge_gaps(G, pos, max_gap):
    ends = [n for n, d in G.degree() if d == 1]
    used = set()
    for a in ends:
        if a in used:
            continue
        best = min(((math.dist(pos[a], pos[b]), b) for b in ends if b != a and b not in used), default=None)
        if best and best[0] < max_gap:
            G.add_edge(a, best[1], way=0, w=best[0])
            used |= {a, best[1]}


def cycles(G, pos, cap=400000):
    """Every simple cycle of the (degree>=2 core of the) graph, as node paths."""
    G = G.copy()
    while True:
        low = [n for n, d in G.degree() if d <= 1]
        if not low:
            break
        G.remove_nodes_from(low)
    out = []
    junc = {n for n, d in G.degree() if d != 2}
    for comp in nx.connected_components(G):
        if comp & junc:
            continue
        start = next(iter(comp))
        path, prev, cur = [start], None, start
        while True:
            nxt = [x for x in G.neighbors(cur) if x != prev][0]
            if nxt == start:
                break
            path.append(nxt)
            prev, cur = cur, nxt
        out.append(path + [start])
    H = nx.Graph()
    chains = []
    seen = set()
    for j in junc:
        for nb in G.neighbors(j):
            if (j, nb) in seen:
                continue
            path, prev, cur = [j, nb], j, nb
            while cur not in junc:
                nxt = [x for x in G.neighbors(cur) if x != prev][0]
                prev, cur = cur, nxt
                path.append(cur)
            seen.add((j, nb))
            seen.add((path[-1], path[-2]))
            if path[0] == path[-1]:
                out.append(path)
                continue
            cid = ('c', len(chains))
            chains.append(path)
            H.add_edge(path[0], cid)
            H.add_edge(cid, path[-1])
    n = 0
    for cyc in nx.simple_cycles(H):
        n += 1
        if n > cap:
            print('  cycle cap reached')
            break
        path = []
        for i, x in enumerate(cyc):
            if isinstance(x, tuple):
                ch = chains[x[1]]
                seq = ch if ch[0] == cyc[i - 1] else ch[::-1]
                path.extend(seq if not path else seq[1:])
        if path and path[0] != path[-1]:
            path.append(path[0])
        if len(path) > 3:
            out.append(path)
    return out


def ways_of(path, G):
    seq = []
    for a, b in zip(path, path[1:]):
        w = G.edges[a, b]['way'] if G.has_edge(a, b) else 0
        if w and (not seq or seq[-1] != w):
            seq.append(w)
    return seq


def route_waypoints(G, pos, waypoints, proj, ways):
    """Shortest route through the waypoints (closed). Non-raceway edges cost a bit more."""
    W = nx.Graph()
    for a, b, d in G.edges(data=True):
        t = ways.get(d['way'], {}).get('tags', {})
        k = 1.0 if t.get('highway') == 'raceway' or d['way'] == 0 else 1.05
        W.add_edge(a, b, w=d['w'] * k, way=d['way'])
    nodes = list(W.nodes)
    P = np.array([pos[n] for n in nodes])
    targets = []
    for lat, lon in waypoints:
        p = np.array(proj(lat, lon))
        i = int(np.argmin(((P - p) ** 2).sum(1)))
        dist = float(np.sqrt(((P[i] - p) ** 2).sum()))
        if dist > 40:
            print(f'  warning: waypoint {lat},{lon} is {dist:.0f} m from the nearest way')
        targets.append(nodes[i])
    path = [targets[0]]
    for a, b in zip(targets, targets[1:] + targets[:1]):
        seg = nx.shortest_path(W, a, b, weight='w')
        path.extend(seg[1:])
    return path, W


def build(key):
    layout = load_layout(key)
    sel = layout.get('select', {})
    ways, rels, stamp = load_osm(layout, key)
    lat0, lon0 = layout['venue']['lat'], layout['venue']['lon']
    proj = projector(lat0, lon0)
    cand = candidate_ways(layout, ways, rels)
    G, pos = node_graph(cand, ways, proj)
    target = layout['official']['length_m']
    if sel.get('mode', 'cycle') == 'waypoints':
        path, G = route_waypoints(G, pos, sel['waypoints'], proj, ways)
        src = f'route through {len(sel["waypoints"])} waypoints'
    else:
        bridge_gaps(G, pos, sel.get('max_gap_m', 30))
        req = set(sel.get('require_ways', []))
        best = None
        for path in cycles(G, pos):
            L = sum(math.dist(pos[a], pos[b]) for a, b in zip(path, path[1:]))
            if req and not req <= set(ways_of(path, G)):
                continue
            err = abs(L - target) / target
            if best is None or err < best[0]:
                best = (err, path)
        if best is None:
            raise SystemExit(f'{key}: no closed loop found')
        path = best[1]
        src = 'closed loop of highway=raceway ways closest to the official length'
    xy = np.array([pos[n] for n in path])
    L = float(np.linalg.norm(np.diff(xy, axis=0), axis=1).sum())
    used = ways_of(path, G)
    latlon = []
    node_ll = {}
    for wid in used:
        for n, g in zip(ways[wid]['nodes'], ways[wid]['geometry']):
            node_ll[n] = (g['lat'], g['lon'])
    for n in path:
        if n in node_ll:
            latlon.append([round(node_ll[n][0], 7), round(node_ll[n][1], 7)])
    data = {
        'key': key,
        'name': layout['name'],
        'source': 'OpenStreetMap',
        'attribution': '© OpenStreetMap contributors',
        'license': 'ODbL-1.0 (https://opendatacommons.org/licenses/odbl/1-0/)',
        'osm_base_timestamp': stamp,
        'method': src,
        'osm_ways': used,
        'length_m': round(L, 1),
        'official_length_m': target,
        'length_error_pct': round((L - target) / target * 100, 2),
        'latlon': latlon,
    }
    save_json(os.path.join(DATA, key + '.json'), data)
    debug_image(key, cand, ways, proj, xy, data)
    print(f'{key}: {src}; OSM {L:.0f} m vs official {target} m ({data["length_error_pct"]:+.2f}%), {len(used)} ways')


def debug_image(key, cand, ways, proj, loop_xy, data):
    allxy = [proj(g['lat'], g['lon']) for wid in cand for g in ways[wid]['geometry']]
    A = np.array(allxy + loop_xy.tolist())
    mn, mx = A.min(0), A.max(0)
    W = 1400
    s = (W - 80) / max(mx - mn)
    H = int((mx - mn)[1] * s) + 100
    im = Image.new('RGB', (W, H), 'white')
    dr = ImageDraw.Draw(im)

    def P(p):
        return (40 + (p[0] - mn[0]) * s, H - 40 - (p[1] - mn[1]) * s)

    for wid in cand:
        pts = [P(proj(g['lat'], g['lon'])) for g in ways[wid]['geometry']]
        hw = ways[wid].get('tags', {}).get('highway')
        dr.line(pts, fill=(170, 170, 170) if hw == 'raceway' else (215, 215, 230), width=3)
    dr.line([P(p) for p in loop_xy], fill=(220, 0, 0), width=4)
    for wid in cand:
        g = ways[wid]['geometry']
        if ways[wid].get('tags', {}).get('highway') != 'raceway' and wid not in data['osm_ways']:
            continue
        m = g[len(g) // 2]
        dr.text(P(proj(m['lat'], m['lon'])), str(wid), fill=(0, 0, 160))
    dr.text((8, 8), f'{key}: {data["method"]}  OSM {data["length_m"]:.0f} m / official {data["official_length_m"]} m '
                    f'({data["length_error_pct"]:+.2f}%)  north up', fill='black')
    im.save(cache('debug', key + '_loop.png'))


if __name__ == '__main__':
    for k in keys_from_argv(sys.argv[1:]):
        build(k)
