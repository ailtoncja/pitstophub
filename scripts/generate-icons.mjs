import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');
mkdirSync(iconsDir, { recursive: true });

const source = join(iconsDir, 'source.png');

// Cor de fundo usada onde o icone precisa ficar opaco.
const BG = { r: 10, g: 10, b: 11, alpha: 1 };

await sharp(source).resize(192, 192).png().toFile(join(iconsDir, 'icon-192.png'));
console.log('✓ icon-192.png');

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
