"""Builds src/rally/<id>-map.ts from scripts/rally/rallies/<id>.json.

usage: python -I scripts/rally/build_map.py [id ...]     (no id or "all" = every rally)

Config (rallies/<id>.json):
  out            output .ts path (repo-relative); export = name of the exported const
  viewBox        [width, height] of the card map (the box is fitted around stages + service park)
  stages         one entry per stage road (repeated passes share it), id = key used by src/rally-info.ts:
                   {"id", "route": {"file", "name", "match": "exact|prefix", "reverse", "trim": {"start", "finish"}}}
                     official vector line (cache file); trim cuts it between the START/FINISH points
                   {"id", "start": [lat, lon], "finish": [lat, lon]}         start/finish only
  servicePark    [lat, lon]
  towns          [{"name", "lat", "lon"}] orientation labels (OpenStreetMap)
  land           true = draw OpenStreetMap land polygons (coast); false = plain land background
Every coordinate has its source in the config ("sources"); the output header repeats them.
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import CACHE, REPO, clip_polygon, douglas_peucker, find_line, haversine_km, ids_from_argv, land_rings, line_km, load_rally, svg_path  # noqa: E402

NICE_KM = (1, 2, 5, 10, 20, 25, 50, 100)


def build(rally_id):
    cfg = load_rally(rally_id)
    width, height = cfg.get('viewBox', [1000, 500])

    lines, points = {}, {}
    for st in cfg['stages']:
        if 'route' in st:
            r = st['route']
            coords = find_line(os.path.join(CACHE, r['file']), r['name'], r.get('match', 'exact'))
            if r.get('reverse'):
                coords = coords[::-1]
            if r.get('trim'):
                # Linha do organizador vai do controle horario ate o STOP: corta entre os pontos START e FINISH.
                a = min(range(len(coords)), key=lambda i: haversine_km(coords[i], r['trim']['start']))
                b = min(range(len(coords)), key=lambda i: haversine_km(coords[i], r['trim']['finish']))
                if a >= b:
                    raise SystemExit(f"{rally_id}/{st['id']}: START after FINISH on the line")
                coords = coords[a:b + 1]
            lines[st['id']] = coords
            points[st['id']] = (coords[0], coords[-1])
        else:
            points[st['id']] = (tuple(st['start']), tuple(st['finish']))
    kinds = {'route' if st['id'] in lines else 'points' for st in cfg['stages']}
    if len(kinds) != 1:
        raise SystemExit(f'{rally_id}: mix of routes and points; use one kind per rally')
    geometry = kinds.pop()

    sp = tuple(cfg['servicePark']) if cfg.get('servicePark') else None
    pts = [p for c in lines.values() for p in c] + [p for s, f in points.values() for p in (s, f)] + ([sp] if sp else [])
    lat_min, lat_max = min(p[0] for p in pts), max(p[0] for p in pts)
    lon_min, lon_max = min(p[1] for p in pts), max(p[1] for p in pts)
    lat_c = (lat_min + lat_max) / 2
    kx = math.cos(math.radians(lat_c))
    pad_x, pad_y = cfg.get('padding', [1.10, 1.30])
    span_x = max((lon_max - lon_min) * kx * pad_x, 0.02)
    span_y = max((lat_max - lat_min) * pad_y, 0.02)
    span_x = max(span_x, span_y * width / height)
    span_y = span_x * height / width
    cx, cy = (lon_min + lon_max) / 2, (lat_min + lat_max) / 2
    scale = width / span_x

    def proj(lat, lon):
        return ((lon - cx) * kx * scale + width / 2, (cy - lat) * scale + height / 2)

    def rnd(p):
        return [round(p[0], 1), round(p[1], 1)]

    routes, stages = {}, {}
    for st in cfg['stages']:
        sid = st['id']
        start, finish = points[sid]
        meta = {'start': rnd(proj(*start)), 'finish': rnd(proj(*finish))}
        if sid in lines:
            coords = lines[sid]
            km = line_km(coords)
            half, acc, mid = km / 2, 0.0, coords[0]
            for i in range(len(coords) - 1):
                seg = haversine_km(coords[i], coords[i + 1])
                if acc + seg >= half:
                    mid = coords[i]
                    break
                acc += seg
            routes[sid] = svg_path(douglas_peucker([proj(*c) for c in coords], 0.5))
            meta['mid'] = rnd(proj(*mid))
            meta['geomKm'] = round(km, 2)
        else:
            meta['mid'] = rnd(proj((start[0] + finish[0]) / 2, (start[1] + finish[1]) / 2))
        stages[sid] = meta

    land_paths = []
    if cfg.get('land', True):
        half_lon = span_x / kx / 2 + 0.2
        half_lat = span_y / 2 + 0.2
        margin = 20
        for ring in land_rings(cx - half_lon, cy - half_lat, cx + half_lon, cy + half_lat):
            xy = [proj(lat, lon) for lat, lon in ring]
            if xy[0] == xy[-1]:
                xy = xy[:-1]
            xy = clip_polygon(xy, -margin, -margin, width + margin, height + margin)
            if len(xy) < 3:
                continue
            xy.append(xy[0])
            h = len(xy) // 2
            simp = douglas_peucker(xy[: h + 1], 0.6)[:-1] + douglas_peucker(xy[h:], 0.6)
            area = abs(sum(simp[i][0] * simp[i + 1][1] - simp[i + 1][0] * simp[i][1] for i in range(len(simp) - 1))) / 2
            if len(simp) >= 4 and area >= 12:
                land_paths.append(svg_path(simp[:-1], closed=True))

    px_per_km = scale / 111.32
    target = width * 0.12 / px_per_km
    scale_km = min(NICE_KM, key=lambda k: abs(k - target))

    data = {
        'width': width,
        'height': height,
        'geometry': geometry,
        'land': ' '.join(land_paths),
        'routes': routes,
        'stages': stages,
        'servicePark': rnd(proj(*sp)) if sp else None,
        'towns': [{'name': t['name'], 'x': round(proj(t['lat'], t['lon'])[0], 1), 'y': round(proj(t['lat'], t['lon'])[1], 1)} for t in cfg.get('towns', [])],
        'scaleBar': {'km': scale_km, 'px': round(px_per_km * scale_km, 1)},
    }

    header = ['// ARQUIVO GERADO por scripts/rally/build_map.py a partir de scripts/rally/rallies/%s.json -- nao editar a mao.' % rally_id]
    header += ['// ' + line for line in cfg.get('credits', [])]
    header.append('// Projecao equiretangular centrada em %.4f; viewBox %dx%d; geomKm = comprimento medido na linha oficial.' % (cy, width, height))
    out = os.path.join(REPO, cfg['out'])
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(header) + '\n')
        f.write('export const %s = ' % cfg['export'])
        f.write(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
        f.write(' as const;\n')

    print(f'{rally_id}: {geometry}, {len(stages)} stage roads, land paths {len(land_paths)}, {os.path.getsize(out)} bytes')
    for sid, m in stages.items():
        extra = f" geom {m['geomKm']} km" if 'geomKm' in m else ''
        print(f'  {sid}: start {m["start"]} finish {m["finish"]}{extra}')


if __name__ == '__main__':
    for rid in ids_from_argv(sys.argv[1:]):
        build(rid)
