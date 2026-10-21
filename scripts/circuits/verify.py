"""Check each drawing against an independent official map of the same layout.

usage: python verify.py [key ...]

Needs the official map saved as <cache>/official/<key>.<png|jpg|webp|gif> (URL in the layout
file, official.map_url) and the extraction rules in layout.extract (see extract.py).

Scores (mean symmetric chamfer distance after a similarity fit, % of the RMS radius; the same
method used for the formula1.com maps in PR #6):
  osm_*  the OpenStreetMap lap (data/<key>.json) vs the official map: right circuit and layout;
         *_mirror is the best score when the lap is mirrored (a right one is far better
         un-mirrored), aniso the stretch a free affine fit wants (1.000 = none), rot the turn
         that puts the lap in the official map's orientation (-> render.rotate_deg).
  png_*  the published drawing (public/circuits/<key>.png) vs the official map: drawn
         without distortion, not mirrored, in the official orientation (rot ~ 0).
  length the OSM lap length vs the official length (official.length_m; official.alt_lengths
         lists other official figures, e.g. the series' and the circuit's own, and the
         closest one counts).
Writes verification/<key>.json, and overlay + side-by-side pictures to <cache>/verify/.
"""
import glob
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract import extract_drawing, extract_official  # noqa: E402
from lib import DATA, PUBLIC, VERIFY, cache, keys_from_argv, latlon_to_xy, load_json, load_layout, save_json  # noqa: E402
from shape import align, norm, resample_poly, subsample  # noqa: E402

LIMITS = {'chamfer_pct': 2.0, 'mirror_ratio': 2.0, 'aniso': 1.06, 'length_pct': 2.0, 'png_rot': 3.0}


def official_path(key, layout):
    name = layout.get('official', {}).get('map_file')
    if name:
        return cache('official', name)
    hits = [p for p in glob.glob(cache('official', key + '.*')) if not p.endswith('_extract.png')]
    return hits[0] if hits else None


def wrap(deg):
    return (deg + 180) % 360 - 180


def score(A, B, step=6):
    r = align(A, B, step=step)
    nm, mi = r[False], r[True]
    return nm, mi


def verify(key):
    layout = load_layout(key)
    path = official_path(key, layout)
    if not path:
        print(f'{key}: no official map in {cache("official")}')
        return None
    data = load_json(os.path.join(DATA, key + '.json'))
    osm_xy = latlon_to_xy(data['latlon'])
    L = float(np.linalg.norm(np.diff(osm_xy, axis=0), axis=1).sum())
    target = layout['official']['length_m']
    osm = resample_poly(osm_xy, 700)
    _, _, s_osm = norm(osm)

    off, info = extract_official(path, layout.get('extract', {}), debug=cache('verify', key + '_extract.png'))
    off = subsample(off, 900)

    nm, mi = score(osm, off)
    row = {
        'key': key,
        'official_map': layout['official'].get('map_url'),
        'official_map_page': layout['official'].get('map_page'),
        'official_length_m': target,
        'official_length_source': layout['official'].get('length_source'),
        'alt_lengths': layout['official'].get('alt_lengths', []),
        'osm_length_m': round(L, 1),
        'length_error_pct': round(min(((L - t) / t * 100 for t in [target] + [a['length_m'] for a in layout['official'].get('alt_lengths', [])]), key=abs), 2),
        'osm_chamfer_pct': round(float(nm['score']) * 100, 2),
        'osm_chamfer_m': round(float(nm['score']) * s_osm, 1),
        'osm_p95_m': round(float(nm['p95']) * s_osm, 1),
        'osm_mirror_pct': round(float(mi['score']) * 100, 2),
        'osm_aniso': round(float(nm['aniso']), 3),
        'osm_rot_deg': round(wrap(nm['rot']), 1),
        'extract': info,
    }
    png = os.path.join(PUBLIC, key + '.png')
    if os.path.exists(png):
        A, _ = extract_drawing(png)
        pn, pm = score(subsample(A, 900), off, step=6)
        row.update(png_chamfer_pct=round(float(pn['score']) * 100, 2), png_mirror_pct=round(float(pm['score']) * 100, 2),
                   png_aniso=round(float(pn['aniso']), 3), png_rot_deg=round(wrap(pn['rot']), 1))
    symmetric = bool(layout.get('verify', {}).get('symmetric'))
    ratio = row['osm_mirror_pct'] / max(row['osm_chamfer_pct'], 1e-6)
    checks = {
        'shape': row['osm_chamfer_pct'] <= LIMITS['chamfer_pct'],
        'not_mirrored': symmetric or ratio >= LIMITS['mirror_ratio'],
        'not_distorted': row['osm_aniso'] <= LIMITS['aniso'],
        'length': abs(row['length_error_pct']) <= LIMITS['length_pct'],
    }
    if 'png_chamfer_pct' in row:
        pratio = row['png_mirror_pct'] / max(row['png_chamfer_pct'], 1e-6)
        checks.update(png_shape=row['png_chamfer_pct'] <= LIMITS['chamfer_pct'],
                      png_not_mirrored=symmetric or pratio >= LIMITS['mirror_ratio'],
                      png_not_distorted=row['png_aniso'] <= LIMITS['aniso'],
                      # a shape that looks the same turned 180 degrees (an oval) may fit either way
                      png_orientation=abs(row['png_rot_deg']) <= LIMITS['png_rot']
                      or (symmetric and 180 - abs(row['png_rot_deg']) <= LIMITS['png_rot']))
    row['mirror_ratio'] = round(ratio, 2)
    row['symmetric_shape'] = symmetric
    row['checks'] = checks
    row['pass'] = all(checks.values())
    save_json(os.path.join(VERIFY, key + '.json'), row)
    pictures(key, path, png, nm, row)
    flag = 'PASS' if row['pass'] else 'FAIL ' + ','.join(k for k, v in checks.items() if not v)
    print(f"{key}: OSM vs official {row['osm_chamfer_pct']}% ({row['osm_chamfer_m']} m, p95 {row['osm_p95_m']} m), "
          f"mirrored {row['osm_mirror_pct']}%, aniso {row['osm_aniso']}, rot {row['osm_rot_deg']} | "
          f"png {row.get('png_chamfer_pct')}% rot {row.get('png_rot_deg')} | length {row['osm_length_m']:.0f}/{target} "
          f"({row['length_error_pct']:+.2f}%) -> {flag}")
    return row


def pictures(key, official, png, nm, row):
    W = 900
    Bn = nm['Bn']
    Aa = nm['Am'] @ nm['M'].T + nm['t']
    allp = np.r_[Bn, Aa]
    mn, mx = allp.min(0), allp.max(0)
    s = (W - 60) / max(mx - mn)
    H = int((mx - mn)[1] * s) + 80
    im = Image.new('RGB', (W, H), 'white')
    dr = ImageDraw.Draw(im)

    def P(p):
        return (30 + (p[0] - mn[0]) * s, H - 30 - (p[1] - mn[1]) * s)

    for p in Bn:
        x, y = P(p)
        dr.ellipse([x - 3, y - 3, x + 3, y + 3], fill=(160, 160, 160))
    dr.line([P(p) for p in Aa], fill=(220, 0, 0), width=2)
    dr.text((6, 6), f'{key}: grey = official map, red = OpenStreetMap lap aligned (not mirrored). '
                    f'{row["osm_chamfer_pct"]}% / {row["osm_chamfer_m"]} m mean, p95 {row["osm_p95_m"]} m', fill='black')
    im.save(cache('verify', key + '_overlay.png'))
    # side by side: official | drawing on the site's card colour
    a = Image.open(official).convert('RGBA')
    bg = Image.new('RGBA', a.size, (255, 255, 255, 255))
    bg.alpha_composite(a)
    a = bg.convert('RGB')
    w = 700
    a = a.resize((w, int(a.height * w / a.width)))
    if os.path.exists(png):
        b = Image.open(png).convert('RGBA').resize((w, int(704 * w / 1252)))
        card = Image.new('RGBA', b.size, (14, 14, 16, 255))
        card.alpha_composite(b)
        b = card.convert('RGB')
    else:
        b = Image.new('RGB', (w, 10), 'black')
    c = Image.new('RGB', (2 * w + 10, max(a.height, b.height) + 24), 'white')
    c.paste(a, (0, 24))
    c.paste(b, (w + 10, 24))
    d = ImageDraw.Draw(c)
    d.text((4, 5), f'OFFICIAL {os.path.basename(official)}', fill='black')
    d.text((w + 14, 5), f'DRAWING {key}.png', fill='black')
    c.save(cache('verify', key + '_side.png'))


if __name__ == '__main__':
    for k in keys_from_argv(sys.argv[1:]):
        verify(k)
