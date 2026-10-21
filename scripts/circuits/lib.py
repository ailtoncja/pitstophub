"""Shared helpers for the OpenStreetMap circuit drawings (public/circuits/*.png).

Pipeline per layout (scripts/circuits/layouts/<key>.json):
  fetch_osm.py   -> raw Overpass extract in the cache dir
  build_loop.py  -> scripts/circuits/data/<key>.json (the lap as OSM coordinates, ODbL)
  render.py      -> public/circuits/<key>.png
  verify.py      -> scripts/circuits/verification/<key>.json (shape score vs the official map)

The cache dir (raw OSM, official maps, debug images) is $CIRCUITS_CACHE or scripts/circuits/.cache.
Official maps are downloaded by hand from the URL in each layout file and saved as
<cache>/official/<key>.<ext>; they are only read, never published.
"""
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
LAYOUTS = os.path.join(HERE, 'layouts')
DATA = os.path.join(HERE, 'data')
VERIFY = os.path.join(HERE, 'verification')
PUBLIC = os.path.join(REPO, 'public', 'circuits')
CACHE = os.environ.get('CIRCUITS_CACHE') or os.path.join(HERE, '.cache')

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def cache(*parts):
    path = os.path.join(CACHE, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def load_layout(key):
    with open(os.path.join(LAYOUTS, key + '.json'), encoding='utf-8') as f:
        return json.load(f)


def all_layout_keys():
    return sorted(f[:-5] for f in os.listdir(LAYOUTS) if f.endswith('.json'))


def keys_from_argv(argv):
    keys = [a for a in argv if not a.startswith('-')]
    return all_layout_keys() if not keys or keys == ['all'] else keys


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


# ---------------------------------------------------------------- geometry

EARTH_R = 6371008.8


def projector(lat0, lon0):
    """Local equirectangular projection in metres: x east, y north."""
    k = math.cos(math.radians(lat0))

    def proj(lat, lon):
        return (math.radians(lon - lon0) * EARTH_R * k, math.radians(lat - lat0) * EARTH_R)

    return proj


def latlon_to_xy(latlon):
    import numpy as np
    lat0 = sum(p[0] for p in latlon) / len(latlon)
    lon0 = sum(p[1] for p in latlon) / len(latlon)
    proj = projector(lat0, lon0)
    return np.array([proj(a, b) for a, b in latlon], float)


def path_length(xy):
    import numpy as np
    xy = np.asarray(xy, float)
    return float(np.linalg.norm(np.diff(xy, axis=0), axis=1).sum())


def haversine(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * EARTH_R * math.asin(math.sqrt(h))
