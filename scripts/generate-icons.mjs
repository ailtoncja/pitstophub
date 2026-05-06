import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

const svg = readFileSync(join(iconsDir, 'icon-512.svg'));

const BG = { r: 15, g: 23, b: 32, alpha: 1 };

await sharp(svg).resize(192, 192).png().toFile(join(iconsDir, 'icon-192.png'));
console.log('✓ icon-192.png');

await sharp(svg).resize(512, 512).png().toFile(join(iconsDir, 'icon-512.png'));
console.log('✓ icon-512.png');

await sharp(svg).resize(180, 180).png().toFile(join(iconsDir, 'apple-touch-icon.png'));
console.log('✓ apple-touch-icon.png');

// Maskable icon: content at 80% with 10% safe zone padding on each side
const content = Math.round(512 * 0.8);
const pad = Math.round((512 - content) / 2);
await sharp(svg)
  .resize(content, content)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
  .png()
  .toFile(join(iconsDir, 'icon-512-maskable.png'));
console.log('✓ icon-512-maskable.png');
