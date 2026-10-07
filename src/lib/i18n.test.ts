import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dictionary } from './dictionary';

const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(name) && !name.endsWith('.test.ts') && name !== 'dictionary.ts' ? [path] : [];
  });
}

describe('dicionario', () => {
  it('tem as mesmas chaves em portugues e ingles', () => {
    expect(Object.keys(dictionary.en).sort()).toEqual(Object.keys(dictionary.pt).sort());
  });

  it('usa os mesmos marcadores {valor} nos dois idiomas', () => {
    for (const key of Object.keys(dictionary.pt)) {
      expect(params(dictionary.en[key]), key).toEqual(params(dictionary.pt[key]));
    }
  });

  it('nao deixa texto vazio', () => {
    for (const lang of ['pt', 'en'] as const) {
      for (const [key, text] of Object.entries(dictionary[lang])) expect(text.trim(), `${lang}:${key}`).not.toBe('');
    }
  });

  it('define toda chave usada no codigo com t()', () => {
    const used = new Map<string, string>();
    for (const file of sourceFiles('src')) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) used.set(match[1], file);
      // Chaves escolhidas em tempo de execucao, listadas em mapas dentro das paginas.
      for (const match of text.matchAll(/'((?:ses|cir\.cond|search\.kind)\.[a-zA-Z0-9]+)'/g)) used.set(match[1], file);
    }
    const missing = [...used].filter(([key]) => !(key in dictionary.pt)).map(([key, file]) => `${key} (${file})`);
    expect(missing).toEqual([]);
  });

  it('cobre as condicoes de tempo e os tipos de busca montados dinamicamente', () => {
    for (const condition of ['clear', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'storm']) expect(dictionary.pt[`cir.cond.${condition}`]).toBeTruthy();
    for (const kind of ['category', 'driver', 'team', 'race']) expect(dictionary.pt[`search.kind.${kind}`]).toBeTruthy();
  });
});
