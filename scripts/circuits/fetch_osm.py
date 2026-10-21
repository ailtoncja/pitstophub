"""Download the OpenStreetMap ways around each layout's venue (Overpass API).

usage: python fetch_osm.py [key ...] [--force]

Fetches highway=raceway ways, circuit/raceway relations and their member ways, and (for
layouts with select.streets = true, i.e. street circuits) the drivable streets in the box.
"""
import math
import os
import sys
import time

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import cache, keys_from_argv, load_layout  # noqa: E402

ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
]
ROADS = ('motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|'
         'tertiary|tertiary_link|unclassified|residential|service|living_street|pedestrian|road|raceway')
UA = {'User-Agent': 'pitstophub-circuit-drawings/1.0 (github.com/ailtoncja/pitstophub)'}


def bbox(venue):
    lat, lon, r = venue['lat'], venue['lon'], venue['radius_m']
    dlat = r / 111320.0
    dlon = r / (111320.0 * max(0.2, math.cos(math.radians(lat))))
    return f'{lat - dlat:.6f},{lon - dlon:.6f},{lat + dlat:.6f},{lon + dlon:.6f}'


def query(layout):
    bb = bbox(layout['venue'])
    streets = f'way["highway"~"^({ROADS})$"]({bb});' if layout.get('select', {}).get('streets') else ''
    # relations named in the layout (e.g. Le Mans: type=route without a route=* value)
    rels = ''.join(f'rel({rid});' for rid in layout.get('select', {}).get('relations', []))
    return f'''[out:json][timeout:180];
(
  way["highway"="raceway"]({bb});
  way["leisure"="track"]["sport"="motor"]({bb});
  rel["type"="circuit"]({bb});
  rel["route"="raceway"]({bb});
  rel["sport"="motor"]({bb});
  {streets}
  {rels}
)->.a;
(.a; way(r.a););
out body geom;'''


def fetch(key, force=False):
    layout = load_layout(key)
    venue = layout.get('venue_key', key)
    out = cache('osm', venue + '.json')
    if not force and os.path.exists(out) and os.path.getsize(out) > 300:
        print(key, 'cached', out)
        return out
    q = query(layout)
    for ep in ENDPOINTS:
        try:
            r = requests.post(ep, data={'data': q}, timeout=240, headers=UA)
            if r.status_code == 200 and r.text.lstrip().startswith('{'):
                with open(out, 'w', encoding='utf-8') as f:
                    f.write(r.text)
                print(key, 'ok', ep, len(r.text))
                return out
            print(key, ep, r.status_code, r.text[:120].replace('\n', ' '))
        except requests.RequestException as e:
            print(key, ep, 'ERR', e)
        time.sleep(5)
    raise SystemExit(f'{key}: Overpass failed on every endpoint')


if __name__ == '__main__':
    force = '--force' in sys.argv
    for k in keys_from_argv(sys.argv[1:]):
        fetch(k, force)
        time.sleep(2)
