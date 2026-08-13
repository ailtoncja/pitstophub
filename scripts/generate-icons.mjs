import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

const source = join(iconsDir, 'source.png');

// Cor de fundo do app (mesma de theme_color/background_color no manifest e no
// meta theme-color do index.html), usada onde o icone precisa ficar opaco.
const BG = { r: 10, g: 10, b: 11, alpha: 1 };

await sharp(source).resize(192, 192).png().toFile(join(iconsDir, 'icon-192.png'));
console.log('✓ icon-192.png');

await sharp(source).resize(512, 512).png().toFile(join(iconsDir, 'icon-512.png'));
console.log('✓ icon-512.png');

await sharp(source).resize(48, 48).png().toFile(join(iconsDir, 'favicon-48.png'));
console.log('✓ favicon-48.png');

// iOS aplica sua propria mascara de cantos arredondados e nao lida bem com
// transparencia, entao achata num fundo opaco (como o icone anterior ja era).
await sharp(source)
  .resize(180, 180)
  .flatten({ background: BG })
  .png()
  .toFile(join(iconsDir, 'apple-touch-icon.png'));
console.log('✓ apple-touch-icon.png');

// Icone maskable: conteudo a 80% com 10% de padding de "zona segura" em cada lado
const content = Math.round(512 * 0.8);
const pad = Math.round((512 - content) / 2);
await sharp(source)
  .resize(content, content)
  .extend({ top: pad, bottom: pad, left: pad, right: pad, background: BG })
  .png()
  .toFile(join(iconsDir, 'icon-512-maskable.png'));
console.log('✓ icon-512-maskable.png');
