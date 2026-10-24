"""Shared helpers for the WRC rally maps (src/rally/<id>-map.ts).

Pipeline per rally (scripts/rally/rallies/<id>.json):
  fetch.py      -> downloads the organiser's stage files (My Maps KML exports, KMZ) and the
                   OpenStreetMap land polygons into the cache dir
  build_map.py  -> src/rally/<id>-map.ts (land, stage lines or start/finish points, service park,
                   towns, scale bar; all in the viewBox of the card)

The cache dir is $RALLY_CACHE or scripts/rally/.cache. Everything downloaded is treated as data
only: KML/KMZ are parsed with ElementTree, nothing in them is executed. Run with `python -I`.
Only the Python standard library is used.
"""
import io
import json
import math
import os
import struct
import sys
import xml.etree.ElementTree as ET
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
RALLIES = os.path.join(HERE, 'rallies')
CACHE = os.environ.get('RALLY_CACHE') or os.path.join(HERE, '.cache')
LAND_ZIP_URL = 'https://osmdata.openstreetmap.de/download/simplified-land-polygons-complete-3857.zip'
LAND_SHP = os.path.join('land', 'simplified-land-polygons-complete-3857', 'simplified_land_polygons.shp')

KML_NS = '{http://www.opengis.net/kml/2.2}'

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def cache(*parts):
    path = os.path.join(CACHE, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def all_rally_ids():
    return sorted(f[:-5] for f in os.listdir(RALLIES) if f.endswith('.json'))


def ids_from_argv(argv):
    ids = [a for a in argv if not a.startswith('-')]
    return all_rally_ids() if not ids or ids == ['all'] else ids


def load_rally(rally_id):
    return load_json(os.path.join(RALLIES, rally_id + '.json'))


def haversine_km(a, b):
    """a, b = (lat, lon). Sphere; fine for picking the nearest vertex, not for measuring stages."""
    r = 6371.0088
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    d = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(d))


_WGS_A, _WGS_F = 6378137.0, 1 / 298.257223563
_WGS_B = _WGS_A * (1 - _WGS_F)


def geodesic_km(a, b):
    """Distance on the WGS84 ellipsoid (Vincenty inverse), a, b = (lat, lon)."""
    if a[0] == b[0] and a[1] == b[1]:
        return 0.0
    f = _WGS_F
    big_l = math.radians(b[1] - a[1])
    u1 = math.atan((1 - f) * math.tan(math.radians(a[0])))
    u2 = math.atan((1 - f) * math.tan(math.radians(b[0])))
    su1, cu1, su2, cu2 = math.sin(u1), math.cos(u1), math.sin(u2), math.cos(u2)
    lam = big_l
    for _ in range(200):
        sl, cl = math.sin(lam), math.cos(lam)
        ss = math.hypot(cu2 * sl, cu1 * su2 - su1 * cu2 * cl)
        if ss == 0:
            return 0.0
        cs = su1 * su2 + cu1 * cu2 * cl
        sig = math.atan2(ss, cs)
        sa = cu1 * cu2 * sl / ss
        c2a = 1 - sa * sa
        c2sm = cs - 2 * su1 * su2 / c2a if c2a else 0.0
        c = f / 16 * c2a * (4 + f * (4 - 3 * c2a))
        prev = lam
        lam = big_l + (1 - c) * f * sa * (sig + c * ss * (c2sm + c * cs * (-1 + 2 * c2sm * c2sm)))
        if abs(lam - prev) < 1e-12:
            break
    u2_ = c2a * (_WGS_A ** 2 - _WGS_B ** 2) / _WGS_B ** 2
    ka = 1 + u2_ / 16384 * (4096 + u2_ * (-768 + u2_ * (320 - 175 * u2_)))
    kb = u2_ / 1024 * (256 + u2_ * (-128 + u2_ * (74 - 47 * u2_)))
    ds = kb * ss * (c2sm + kb / 4 * (cs * (-1 + 2 * c2sm * c2sm) - kb / 6 * c2sm * (-3 + 4 * ss * ss) * (-3 + 4 * c2sm * c2sm)))
    return _WGS_B * ka * (sig - ds) / 1000


def line_km(coords):
    """Geodesic length (WGS84) of a polyline [(lat, lon)]."""
    return sum(geodesic_km(coords[i], coords[i + 1]) for i in range(len(coords) - 1))


def meridian_km_per_degree(lat):
    """Length of one degree of latitude on WGS84 at `lat` (km)."""
    phi = math.radians(lat)
    return (111132.954 - 559.822 * math.cos(2 * phi) + 1.175 * math.cos(4 * phi)) / 1000


def project_on_line(coords, p):
    """(segment index, fraction, point) of the point of the polyline nearest to p (local plane)."""
    k = math.cos(math.radians(p[0]))
    best = None
    for i in range(len(coords) - 1):
        (y1, x1), (y2, x2) = coords[i], coords[i + 1]
        ax, ay, bx, by = (x1 - p[1]) * k, y1 - p[0], (x2 - p[1]) * k, y2 - p[0]
        dx, dy = bx - ax, by - ay
        l2 = dx * dx + dy * dy
        t = 0.0 if l2 == 0 else max(0.0, min(1.0, -(ax * dx + ay * dy) / l2))
        d = (ax + dx * t) ** 2 + (ay + dy * t) ** 2
        if best is None or d < best[0]:
            best = (d, i, t)
    _, i, t = best
    (y1, x1), (y2, x2) = coords[i], coords[i + 1]
    return i, t, (y1 + (y2 - y1) * t, x1 + (x2 - x1) * t)


def cut_line(coords, start, finish):
    """Part of the polyline between the projections of `start` and `finish` (start must come first)."""
    ia, ta, qa = project_on_line(coords, start)
    ib, tb, qb = project_on_line(coords, finish)
    if (ib, tb) <= (ia, ta):
        return None
    return [qa] + list(coords[ia + 1:ib + 1]) + [qb]


# ── KML / KMZ ──────────────────────────────────────────────────────────────────

def read_kml_root(path):
    """Root element of a .kml, or of doc.kml (first .kml) inside a .kmz."""
    if path.lower().endswith('.kmz'):
        with zipfile.ZipFile(path) as z:
            name = next(n for n in z.namelist() if n.lower().endswith('.kml'))
            return ET.parse(io.BytesIO(z.read(name))).getroot()
    return ET.parse(path).getroot()


def _coords(text):
    out = []
    for tok in text.split():
        parts = tok.split(',')
        out.append((float(parts[1]), float(parts[0])))
    return out


def placemarks(root):
    """[(name, kind, coords)] for every Placemark; kind = 'line' | 'point'. coords = [(lat, lon)]."""
    out = []
    for pm in root.iter(KML_NS + 'Placemark'):
        name_el = pm.find(KML_NS + 'name')
        name = (name_el.text or '').strip() if name_el is not None else ''
        for ls in pm.iter(KML_NS + 'LineString'):
            c = ls.find(KML_NS + 'coordinates')
            if c is not None and c.text:
                out.append((name, 'line', _coords(c.text)))
        for pt in pm.iter(KML_NS + 'Point'):
            c = pt.find(KML_NS + 'coordinates')
            if c is not None and c.text:
                out.append((name, 'point', _coords(c.text)))
    return out


def find_line(path, name, match='exact'):
    """The LineString placemark called `name` ('exact' or 'prefix'); errors if missing or ambiguous."""
    hits = [c for n, k, c in placemarks(read_kml_root(path)) if k == 'line' and (n == name if match == 'exact' else n.startswith(name))]
    if not hits:
        raise SystemExit(f'{path}: no line placemark {match} "{name}"')
    # My Maps repeats the stage line in a second folder: identical copies are fine.
    if any(h != hits[0] for h in hits[1:]):
        raise SystemExit(f'{path}: {len(hits)} different lines for "{name}"')
    return hits[0]


# ── OpenStreetMap land polygons (shapefile, EPSG:3857) ─────────────────────────

def _merc_to_lonlat(x, y):
    lon = x / 6378137.0 * 180.0 / math.pi
    lat = math.degrees(2 * math.atan(math.exp(y / 6378137.0)) - math.pi / 2)
    return lon, lat


def _lonlat_to_merc(lon, lat):
    x = math.radians(lon) * 6378137.0
    y = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)) * 6378137.0
    return x, y


def land_rings(lon_min, lat_min, lon_max, lat_max):
    """Outer and inner rings ([(lat, lon)]) of every land polygon touching the box. Minimal
    shapefile reader: polygon records only (type 5), which is all this dataset has."""
    x0, y0 = _lonlat_to_merc(lon_min, lat_min)
    x1, y1 = _lonlat_to_merc(lon_max, lat_max)
    rings = []
    with open(os.path.join(CACHE, LAND_SHP), 'rb') as f:
        f.seek(100)
        while True:
            head = f.read(8)
            if len(head) < 8:
                break
            _, length = struct.unpack('>ii', head)
            body = f.read(length * 2)
            shape_type = struct.unpack('<i', body[:4])[0]
            if shape_type != 5:
                continue
            bx0, by0, bx1, by1 = struct.unpack('<4d', body[4:36])
            if bx1 < x0 or bx0 > x1 or by1 < y0 or by0 > y1:
                continue
            n_parts, n_points = struct.unpack('<2i', body[36:44])
            parts = list(struct.unpack(f'<{n_parts}i', body[44:44 + 4 * n_parts]))
            pts_off = 44 + 4 * n_parts
            pts = struct.unpack(f'<{2 * n_points}d', body[pts_off:pts_off + 16 * n_points])
            parts.append(n_points)
            for i in range(n_parts):
                ring = []
                for j in range(parts[i], parts[i + 1]):
                    lon, lat = _merc_to_lonlat(pts[2 * j], pts[2 * j + 1])
                    ring.append((lat, lon))
                rings.append(ring)
    return rings


# ── geometry helpers in viewBox units ─────────────────────────────────────────

def douglas_peucker(points, tol):
    if len(points) < 3:
        return list(points)
    (x1, y1), (x2, y2) = points[0], points[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy)
    best, idx = -1.0, 0
    for i in range(1, len(points) - 1):
        x0, y0 = points[i]
        d = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1) / norm if norm else math.hypot(x0 - x1, y0 - y1)
        if d > best:
            best, idx = d, i
    if best > tol:
        return douglas_peucker(points[: idx + 1], tol)[:-1] + douglas_peucker(points[idx:], tol)
    return [points[0], points[-1]]


def clip_polygon(poly, xmin, ymin, xmax, ymax):
    """Sutherland-Hodgman against a rectangle (closed polygon, first point not repeated)."""
    def edge(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            cur, prev = pts[i], pts[i - 1]
            if inside(cur):
                if not inside(prev):
                    out.append(inter(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(inter(prev, cur))
        return out

    def at_x(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))

    def at_y(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)

    pts = list(poly)
    for inside, inter in (
        (lambda p: p[0] >= xmin, at_x(xmin)),
        (lambda p: p[0] <= xmax, at_x(xmax)),
        (lambda p: p[1] >= ymin, at_y(ymin)),
        (lambda p: p[1] <= ymax, at_y(ymax)),
    ):
        if not pts:
            break
        pts = edge(pts, inside, inter)
    return pts


def svg_path(points, closed=False, digits=1):
    return 'M' + ' '.join(f'{x:.{digits}f} {y:.{digits}f}' for x, y in points) + ('Z' if closed else '')
