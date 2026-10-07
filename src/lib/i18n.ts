import { useMemo } from 'react';
import { useSettings } from '../state/settings';
import { dictionary } from './dictionary';
import type { Lang } from './format';

export type TParams = Record<string, string | number>;

/** Substitui {chave} pelos parametros; se a chave nao existir no idioma, cai no portugues e, por fim, na propria chave. */
export function translate(lang: Lang, key: string, params?: TParams): string {
  const template = dictionary[lang][key] ?? dictionary.pt[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

export function useT() {
  const { language } = useSettings();
  return useMemo(
    () => ({
      lang: language,
      t: (key: string, params?: TParams) => translate(language, key, params),
    }),
    [language],
  );
}
