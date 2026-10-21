"""Cross-match: every published drawing against every OpenStreetMap lap we have.

usage: python crossmatch.py [key ...] [--extra DIR]

A drawing must fit its own lap better than any other circuit's. --extra adds more laps
(JSON files with "xy_m" or "latlon", e.g. the 25 F1 laps of the PR #6 check). Writes
verification/_crossmatch.json. Ovals of the same design (1.5-mile tri-ovals, say) are expected
to be near-ties: for them the venue's coordinates, not the shape, identify the circuit.
"""
import glob
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extract import extract_drawing  # noqa: E402
from lib import DATA, PUBLIC, VERIFY, keys_from_argv, latlon_to_xy, save_json  # noqa: E402
from shape import align, resample_poly, subsample  # noqa: E402


def load_refs(extra):
    refs = {}
    for f in sorted(glob.glob(os.path.join(DATA, '*.json'))):
        d = json.load(open(f, encoding='utf-8'))
        refs[d['key']] = resample_poly(latlon_to_xy(d['latlon']), 400)
    if extra:
        for f in sorted(glob.glob(os.path.join(extra, '*.json'))):
            d = json.load(open(f, encoding='utf-8'))
            xy = np.array(d['xy_m']) if 'xy_m' in d else latlon_to_xy(d['latlon'])
            refs['f1:' + os.path.basename(f)[:-5]] = resample_poly(xy, 400)
    return refs


def main(argv):
    extra = None
    if '--extra' in argv:
        i = argv.index('--extra')
        extra = argv[i + 1]
        argv = argv[:i] + argv[i + 2:]
    keys = [k for k in keys_from_argv(argv) if os.path.exists(os.path.join(PUBLIC, k + '.png'))]
    refs = load_refs(extra)
    out = {}
    for k in keys:
        A, _ = extract_drawing(os.path.join(PUBLIC, k + '.png'))
        A = subsample(A, 400)
        row = {r: round(float(align(A, B, step=12, iters=15, mirror_opts=(False,))[False]['score']) * 100, 2)
               for r, B in refs.items()}
        ranked = sorted(row.items(), key=lambda x: x[1])
        own = row.get(k)
        others = [x for x in ranked if x[0] != k]
        out[k] = {'own_pct': own, 'best_other': others[0][0], 'best_other_pct': others[0][1],
                  'margin': round(others[0][1] / max(own, 1e-6), 2), 'own_is_best': ranked[0][0] == k,
                  'top5': ranked[:5]}
        print(f"{k:24s} own {own:5.2f}%  best other {others[0][0]} {others[0][1]:5.2f}%  "
              f"{'OK' if ranked[0][0] == k else 'NOT BEST'}", flush=True)
    save_json(os.path.join(VERIFY, '_crossmatch.json'), out)


if __name__ == '__main__':
    main(sys.argv[1:])
