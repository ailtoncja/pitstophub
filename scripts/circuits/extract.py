"""Turn a track map picture into a point set along the track (x, y up, in pixels of a
1400 px wide copy).

Official maps come in every style, so each layout file says how to find the track in its
official map (layout.extract):
  mode "f1"      formula1.com style (dark band with a coloured centre line).
  mode "mask"    pixels matching every given rule are track:
                   rgb + tol  (distance to a colour), max_lum / min_lum, min_sat / max_sat,
                   min_alpha (for transparent PNGs)
                 crop [x0, y0, x1, y1] (fractions) drops legends and logos first,
                 erase [[x0, y0, x1, y1], ...] (fractions) blanks boxes (labels, insets),
                 close / open (px) clean the mask, keep "largest" (default) or "all" components,
                 min_size drops small specks (px).
  The mask is skeletonised, so bands and thin lines both give a centre line.
Our own drawings (public/circuits/<key>.png) use mode "drawing": the white centre line.
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.morphology import disk, remove_small_objects, skeletonize

WIDTH = 1400


def load(path, width=WIDTH):
    im = Image.open(path)
    im.load()
    im = im.convert('RGBA')
    h = int(round(im.height * width / im.width))
    return np.asarray(im.resize((width, h), Image.LANCZOS)).astype(float) / 255


def _skeleton_points(mask):
    sk = skeletonize(mask)
    pts = np.argwhere(sk)
    return np.c_[pts[:, 1], -pts[:, 0]].astype(float)


def extract_drawing(path):
    a = load(path)
    mask = (a[..., 3] > 0.8) & (a[..., :3].min(2) > 0.75)
    return _skeleton_points(mask), {'mode': 'drawing', 'n': int(mask.sum())}


def extract_f1(path):
    """formula1.com maps (same rules as the PR #6 check)."""
    a = load(path)
    bg = np.ones_like(a[..., :3])
    rgb = a[..., :3] * a[..., 3:4] + bg * (1 - a[..., 3:4])
    mx, mn = rgb.max(2), rgb.min(2)
    sat = (mx - mn) / (mx + 1e-6)
    D = mx < 0.30
    C = (sat > 0.45) & (mx > 0.35)
    T = ndi.binary_closing(D | C, structure=disk(4))
    T = remove_small_objects(T, max_size=2000)
    E = ndi.distance_transform_edt(T)
    sk = skeletonize(T)
    hw = np.median(E[sk]) if sk.any() else 0
    dens = ndi.uniform_filter(D.astype(float), size=max(3, int(2 * hw)))
    Cc = C & (E >= 0.55 * hw) & (dens > 0.45)
    if Cc.sum() > 0.5 * sk.sum():
        pts = np.argwhere(Cc)
        src = 'colour'
    else:
        pts = np.argwhere(sk & (E >= 0.6 * hw) & (dens > 0.35))
        src = 'skeleton'
    return np.c_[pts[:, 1], -pts[:, 0]].astype(float), {'mode': 'f1', 'src': src, 'n': len(pts)}


def extract_mask(path, cfg, debug=None):
    a = load(path)
    H, W = a.shape[:2]
    alpha = a[..., 3]
    rgb = a[..., :3] * alpha[..., None] + (1 - alpha[..., None]) * np.array(cfg.get('bg', [1, 1, 1]), float)
    mx, mn = rgb.max(2), rgb.min(2)
    lum = rgb.mean(2)
    sat = (mx - mn) / (mx + 1e-6)
    m = np.ones((H, W), bool)
    if 'rgb' in cfg:
        c = np.array(cfg['rgb'], float) / 255
        m &= np.sqrt(((rgb - c) ** 2).sum(2)) * 255 <= cfg.get('tol', 60)
    if 'max_lum' in cfg:
        m &= lum <= cfg['max_lum']
    if 'min_lum' in cfg:
        m &= lum >= cfg['min_lum']
    if 'min_sat' in cfg:
        m &= sat >= cfg['min_sat']
    if 'max_sat' in cfg:
        m &= sat <= cfg['max_sat']
    if 'min_alpha' in cfg:
        m &= alpha >= cfg['min_alpha']
    x0, y0, x1, y1 = cfg.get('crop', [0, 0, 1, 1])
    keep = np.zeros_like(m)
    keep[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = True
    for ex0, ey0, ex1, ey1 in cfg.get('erase', []):
        keep[int(ey0 * H):int(ey1 * H), int(ex0 * W):int(ex1 * W)] = False
    m &= keep
    if cfg.get('open'):
        m = ndi.binary_opening(m, structure=disk(cfg['open']))
    if cfg.get('close'):
        m = ndi.binary_closing(m, structure=disk(cfg['close']))
    if cfg.get('fill_holes_max'):
        holes = ndi.binary_fill_holes(m) & ~m
        lab, n = ndi.label(holes)
        sizes = ndi.sum(holes, lab, range(1, n + 1))
        for i, s in enumerate(sizes, 1):
            if s <= cfg['fill_holes_max']:
                m[lab == i] = True
    m = remove_small_objects(m, max_size=cfg.get('min_size', 300))
    if cfg.get('keep', 'largest') == 'largest':
        lab, n = ndi.label(m, structure=np.ones((3, 3)))
        if n > 1:
            sizes = ndi.sum(m, lab, range(1, n + 1))
            m = lab == (1 + int(np.argmax(sizes)))
    pts = _skeleton_points(m)
    if debug:
        dbg = (np.clip(rgb, 0, 1) * 255).astype(np.uint8) // 2 + 127
        dbg[m] = (120, 160, 255)
        sk = np.zeros_like(m)
        ij = np.c_[(-pts[:, 1]).astype(int), pts[:, 0].astype(int)]
        sk[ij[:, 0], ij[:, 1]] = True
        dbg[ndi.binary_dilation(sk, iterations=1)] = (220, 0, 0)
        Image.fromarray(dbg).save(debug)
    return pts, {'mode': 'mask', 'n': int(m.sum())}


def extract_official(path, cfg, debug=None):
    mode = cfg.get('mode', 'mask')
    if mode == 'f1':
        return extract_f1(path)
    return extract_mask(path, cfg, debug)


if __name__ == '__main__':
    import json
    path, cfg = sys.argv[1], json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    pts, info = extract_official(path, cfg, debug=os.path.splitext(path)[0] + '_extract.png')
    print(info, len(pts))
