"""Contact sheet of the drawings on the site's card colour.

usage: python contact_sheet.py OUT.png [key ...]
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import PUBLIC, keys_from_argv, load_layout  # noqa: E402

CELL_W, CELL_H, LABEL = 400, 225, 34
COLS = 5


def main(out, keys):
    keys = [k for k in keys if os.path.exists(os.path.join(PUBLIC, k + '.png'))]
    rows = (len(keys) + COLS - 1) // COLS
    sheet = Image.new('RGB', (COLS * CELL_W, rows * (CELL_H + LABEL)), (0, 0, 0))
    try:
        font = ImageFont.truetype('arial.ttf', 15)
    except OSError:
        font = ImageFont.load_default()
    for i, k in enumerate(keys):
        x, y = (i % COLS) * CELL_W, (i // COLS) * (CELL_H + LABEL)
        card = Image.new('RGBA', (CELL_W - 8, CELL_H - 8), (14, 14, 16, 255))
        im = Image.open(os.path.join(PUBLIC, k + '.png')).convert('RGBA')
        im.thumbnail((card.width, card.height), Image.LANCZOS)
        card.alpha_composite(im, ((card.width - im.width) // 2, (card.height - im.height) // 2))
        sheet.paste(card.convert('RGB'), (x + 4, y + 4))
        layout = load_layout(k)
        d = ImageDraw.Draw(sheet)
        d.text((x + 6, y + CELL_H), f"{k} - {layout['name']}"[:52], fill=(255, 255, 255), font=font)
        d.text((x + 6, y + CELL_H + 17), layout.get('layout', '')[:52], fill=(185, 185, 192), font=font)
    sheet.save(out)
    print(out, len(keys), 'drawings')


if __name__ == '__main__':
    main(sys.argv[1], keys_from_argv(sys.argv[2:]))
