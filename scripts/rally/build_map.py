"""Builds src/rally/<id>-map.ts from scripts/rally/rallies/<id>.json.

usage: python -I scripts/rally/build_map.py [id ...]     (no id or "all" = every rally)

Config (rallies/<id>.json):
  out            output .ts path (repo-relative); export = name of the exported const
  viewBox        [width, height] of the card map (the box is fitted around stages + service park)
  stages         one entry per stage road (repeated passes share it), id = key used by src/rally/<id>-2026.ts:
                   {"id", "km", "start": [lat, lon], "finish": [lat, lon], "route"?: {...}}
                   km            official stage length (itinerary)
                   start/finish  official START / FINISH points of the stage (organiser placemarks or documents)
                   route         official vector line (cache file): {"file", "name", "match": "exact|prefix", "reverse", "trim"}
                                 trim = true cuts the line at the projections of start/finish (organiser lines often run
                                 from the time control to the STOP). Without "route" only start/finish are drawn.
  servicePark    [lat, lon]
  towns          [{"name", "lat", "lon"}] orientation labels (OpenStreetMap)
  land           true = draw OpenStreetMap land polygons (coast); false = plain land background
Every coordinate has its source in the config ("sources"); the output header repeats them.

A route is drawn only if it checks out against the official itinerary: geodesic length within
ROUTE_TOLERANCE of the official km and both ends within END_TOLERANCE_KM of the official start/finish.
Otherwise the build stops: switch that stage to start/finish points (drop "route") or fix the source.
The drawn (simplified) line must stay within DRAWN_TOLERANCE of the full line. src/rally-info.test.ts
re-checks the generated file (projection, lengths, ends, region).
"""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import CACHE, REPO, clip_polygon, cut_line, douglas_peucker, find_line, geodesic_km, ids_from_argv, land_rings, line_km, load_rally, meridian_km_per_degree, svg_path  # noqa: E402

NICE_KM = (1, 2, 5, 10, 20, 25, 50, 100)
ROUTE_TOLERANCE = 0.02
END_TOLERANCE_KM = 0.12
DRAWN_TOLERANCE = 0.01
ROUTE_SIMPLIFY_PX = 0.02


def build(rally_id):
    cfg = load_rally(rally_id)
    width, height = cfg.get('viewBox', [1000, 500])

    lines, points, problems = {}, {}, []
    for st in cfg['stages']:
        sid = st['id']
        start, finish = tuple(st['start']), tuple(st['finish'])
        km = st.get('km')
        if not km:
            problems.append(f'{sid}: no official km')
            continue
        if geodesic_km(start, finish) > km:
            problems.append(f'{sid}: start->finish straight line {geodesic_km(start, finish):.2f} km > stage {km} km')
        if 'route' in st:
            r = st['route']
            coords = find_line(os.path.join(CACHE, r['file']), r['name'], r.get('match', 'exact'))
            if r.get('reverse'):
                coords = coords[::-1]
            if r.get('trim'):
                coords = cut_line(coords, start, finish)
                if coords is None:
                    raise SystemExit(f'{rally_id}/{sid}: START after FINISH on the line')
            got = line_km(coords)
            ends = (geodesic_km(coords[0], start), geodesic_km(coords[-1], finish))
            if abs(got / km - 1) > ROUTE_TOLERANCE:
                problems.append(f'{sid}: line {got:.2f} km vs official {km} km ({(got / km - 1) * 100:+.1f}%) -> use points')
            if max(ends) > END_TOLERANCE_KM:
                problems.append(f'{sid}: line ends {ends[0] * 1000:.0f} m / {ends[1] * 1000:.0f} m from official start/finish -> use points')
            lines[sid] = coords
            points[sid] = (coords[0], coords[-1])
        else:
            points[sid] = (start, finish)
    if problems:
        raise SystemExit(f'{rally_id}: map does not check out:\n  ' + '\n  '.join(problems))
    geometry = 'route' if lines else 'points'

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
    scale = width / span_x  # px per degree of latitude

    def proj(lat, lon):
        return ((lon - cx) * kx * scale + width / 2, (cy - lat) * scale + height / 2)

    def unproj(x, y):
        return (cy - (y - height / 2) / scale, cx + (x - width / 2) / (kx * scale))

    def rnd(p, digits=2):
        return [round(p[0], digits), round(p[1], digits)]

    routes, stages = {}, {}
    for st in cfg['stages']:
        sid = st['id']
        start, finish = points[sid]
        meta = {'km': st['km'], 'start': rnd(proj(*start)), 'finish': rnd(proj(*finish))}
        if sid in lines:
            coords = lines[sid]
            km = line_km(coords)
            half, acc, mid = km / 2, 0.0, coords[0]
            for i in range(len(coords) - 1):
                seg = geodesic_km(coords[i], coords[i + 1])
                if acc + seg >= half:
                    mid = coords[i]
                    break
                acc += seg
            simplified = [tuple(rnd(p)) for p in douglas_peucker([proj(*c) for c in coords], ROUTE_SIMPLIFY_PX)]
            drawn = line_km([unproj(*p) for p in simplified])
            if abs(drawn / km - 1) > DRAWN_TOLERANCE:
                raise SystemExit(f'{rally_id}/{sid}: drawn line {drawn:.2f} km vs source {km:.2f} km; lower ROUTE_SIMPLIFY_PX')
            if abs(drawn / st['km'] - 1) > ROUTE_TOLERANCE:
                raise SystemExit(f"{rally_id}/{sid}: drawn line {drawn:.2f} km vs official {st['km']} km -> use points")
            routes[sid] = svg_path(simplified, digits=2)
            meta['mid'] = rnd(proj(*mid))
            meta['geomKm'] = round(km, 2)
            meta['drawnKm'] = round(drawn, 2)
            # Largada/chegada oficiais (lat, lon): o teste confere que a linha comeca e termina nelas.
            meta['official'] = {'start': [round(v, 6) for v in st['start']], 'finish': [round(v, 6) for v in st['finish']]}
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

    # Escala: km reais (WGS84) ao longo do meridiano no centro do mapa.
    px_per_km = scale / meridian_km_per_degree(cy)
    target = width * 0.12 / px_per_km
    scale_km = min(NICE_KM, key=lambda k: abs(k - target))

    data = {
        'width': width,
        'height': height,
        'geometry': geometry,
        # x = (lon - lon0) * kx * pxPerDeg + width/2 ; y = (lat0 - lat) * pxPerDeg + height/2
        'projection': {'lat0': round(cy, 7), 'lon0': round(cx, 7), 'kx': round(kx, 9), 'pxPerDeg': round(scale, 4)},
        'land': ' '.join(land_paths),
        'routes': routes,
        'stages': stages,
        'servicePark': rnd(proj(*sp)) if sp else None,
        'towns': [{'name': t['name'], 'x': round(proj(t['lat'], t['lon'])[0], 1), 'y': round(proj(t['lat'], t['lon'])[1], 1)} for t in cfg.get('towns', [])],
        'scaleBar': {'km': scale_km, 'px': round(px_per_km * scale_km, 2)},
    }

    header = ['// ARQUIVO GERADO por scripts/rally/build_map.py a partir de scripts/rally/rallies/%s.json -- nao editar a mao.' % rally_id]
    header += ['// ' + line for line in cfg.get('credits', [])]
    header.append('// Projecao equiretangular centrada em %.4f; viewBox %dx%d; geomKm = comprimento (WGS84) da linha oficial; drawnKm = da linha desenhada.' % (cy, width, height))
    out = os.path.join(REPO, cfg['out'])
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(header) + '\n')
        f.write('export const %s = ' % cfg['export'])
        f.write(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
        f.write(' as const;\n')

    print(f'{rally_id}: {geometry}, {len(stages)} stage roads ({len(lines)} drawn), land paths {len(land_paths)}, {os.path.getsize(out)} bytes')
    for sid, m in stages.items():
        extra = f" line {m['geomKm']} km (drawn {m['drawnKm']}) vs {m['km']} = {(m['geomKm'] / m['km'] - 1) * 100:+.2f}%" if 'geomKm' in m else ' points'
        print(f'  {sid}:{extra}')


if __name__ == '__main__':
    for rid in ids_from_argv(sys.argv[1:]):
        build(rid)
