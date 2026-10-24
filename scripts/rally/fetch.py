"""Downloads what build_map.py reads into the cache dir (scripts/rally/.cache or $RALLY_CACHE).

usage: python -I scripts/rally/fetch.py [id ...]     (no id or "all" = every rally)

- the OpenStreetMap land polygons (osmdata.openstreetmap.de, ODbL), once;
- each rally's "downloads" ([{url, file}]): the organiser's stage files, e.g. the KML export of the
  Google My Maps linked from the official stage pages (https://www.google.com/maps/d/kml?mid=...&forcekml=1)
  or an official KMZ. Files are only parsed as data (see lib.py).
Existing files are kept; pass --force to download again.
"""
import os
import sys
import urllib.request
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import CACHE, LAND_SHP, LAND_ZIP_URL, cache, ids_from_argv, load_rally  # noqa: E402

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 pitstophub-rally-maps'


def download(url, path, force=False):
    if os.path.exists(path) and not force:
        return False
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=120) as r, open(path + '.part', 'wb') as f:
        while True:
            chunk = r.read(1 << 16)
            if not chunk:
                break
            f.write(chunk)
    os.replace(path + '.part', path)
    return True


def main(argv):
    force = '--force' in argv
    land_zip = cache('land', 'simplified-land-polygons-complete-3857.zip')
    if download(LAND_ZIP_URL, land_zip, force) or not os.path.exists(os.path.join(CACHE, LAND_SHP)):
        with zipfile.ZipFile(land_zip) as z:
            for name in z.namelist():
                if name.endswith(('.shp', '.shx', '.prj', '.txt')):
                    z.extract(name, os.path.join(CACHE, 'land'))
        print('land polygons ok')
    for rid in ids_from_argv([a for a in argv if a != '--force']):
        for item in load_rally(rid).get('downloads', []):
            got = download(item['url'], cache(item['file']), force)
            print(f"{rid}: {item['file']} {'downloaded' if got else 'cached'}")


if __name__ == '__main__':
    main(sys.argv[1:])
