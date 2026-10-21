"""Draw public/circuits/<key>.png from data/<key>.json.

usage: python render.py [key ...]

Same frame and stroke as the formula1.com 2026 maps already on the site: 1252x704,
transparent background, a dark track band (~30 px) with the line drawn in its centre (~7 px),
in white -- the interface colour -- because there are no official sectors to colour.
No sectors, corner numbers or start/finish marks: OpenStreetMap does not carry them.
The lap is drawn to scale (no stretching) and never mirrored; render.rotate_deg (degrees,
counter-clockwise) turns it to the orientation of the official map.
"""
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import DATA, PUBLIC, keys_from_argv, latlon_to_xy, load_json, load_layout  # noqa: E402

W, H = 1252, 704
SS = 4                    # supersampling
PAD_X, PAD_Y = 70, 52     # free margin around the band
BAND = 30                 # dark band width (px at 1252 wide), as in the F1 maps
CENTRE = 7                # white centre line, as wide as the F1 sector line
BAND_RGB = (21, 21, 30, 255)
WHITE = (255, 255, 255, 255)


def rotate(xy, deg):
    t = math.radians(deg)
    R = np.array([[math.cos(t), -math.sin(t)], [math.sin(t), math.cos(t)]])
    return xy @ R.T


def fit(xy):
    """Scale to the frame (uniform), y down for the picture."""
    mn, mx = xy.min(0), xy.max(0)
    span = mx - mn
    s = min((W - 2 * PAD_X - BAND) / max(span[0], 1e-9), (H - 2 * PAD_Y - BAND) / max(span[1], 1e-9))
    ox = (W - s * span[0]) / 2
    oy = (H - s * span[1]) / 2
    return np.c_[(xy[:, 0] - mn[0]) * s + ox, (mx[1] - xy[:, 1]) * s + oy], s


def stroke(dr, pts, width, fill):
    w = max(1, int(round(width * SS)))
    dr.line(pts, fill=fill, width=w, joint='curve')
    r = w / 2
    for x, y in (pts[0], pts[-1]):
        dr.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def render_xy(xy_m, rotate_deg=0.0):
    xy = rotate(np.asarray(xy_m, float), rotate_deg)
    px, scale = fit(xy)
    pts = [(float(x) * SS, float(y) * SS) for x, y in px]
    closed = math.dist(pts[0], pts[-1]) < 1e-6
    if closed:
        pts = pts + pts[1:3]   # overlap the seam so the joint is round
    big = Image.new('RGBA', (W * SS, H * SS), (0, 0, 0, 0))
    dr = ImageDraw.Draw(big)
    stroke(dr, pts, BAND, BAND_RGB)
    stroke(dr, pts, CENTRE, WHITE)
    return big.resize((W, H), Image.LANCZOS), scale


def render(key):
    layout = load_layout(key)
    data = load_json(os.path.join(DATA, key + '.json'))
    xy = latlon_to_xy(data['latlon'])
    im, scale = render_xy(xy, layout.get('render', {}).get('rotate_deg', 0.0))
    out = os.path.join(PUBLIC, key + '.png')
    im.save(out, optimize=True)
    print(f'{key}: {out} ({os.path.getsize(out) // 1024} KB, {1 / scale:.2f} m/px)')


if __name__ == '__main__':
    for k in keys_from_argv(sys.argv[1:]):
        render(k)
