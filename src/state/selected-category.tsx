import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MOTORSPORT_DATA } from '../types';
import { useSettings } from './settings';

// A categoria escolhida comanda Inicio, Calendario, Classificacao e Grid (como no app). Fica guardada no aparelho.
const KEY = 'pitstophub_selected_category';
const VALID = new Set(MOTORSPORT_DATA.map((category) => category.id));
const isValid = (id: string | null | undefined): id is string => !!id && VALID.has(id);

function readStored(): string | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return isValid(value) ? value : null;
  } catch {
    return null;
  }
}

type SelectedCategoryValue = {
  selectedId: string;
  select: (categoryId: string) => void;
};

const SelectedCategoryContext = createContext<SelectedCategoryValue | null>(null);

export function SelectedCategoryProvider({ children }: { children: ReactNode }) {
  const { prefs } = useSettings();
  const [params, setParams] = useSearchParams();
  const [stored, setStored] = useState<string | null>(readStored);

  // Links como /classificacao?c=wec abrem aquela categoria e passam a ser a escolhida.
  const fromUrl = params.get('c');
  const urlChoice = isValid(fromUrl) ? fromUrl : null;
  const selectedId = urlChoice ?? stored ?? (isValid(prefs.favoriteCategoryId) ? prefs.favoriteCategoryId : 'f1');

  const persist = useCallback((categoryId: string) => {
    setStored(categoryId);
    try {
      window.localStorage.setItem(KEY, categoryId);
    } catch {
      // storage indisponivel: vale so nesta sessao
    }
  }, []);

  useEffect(() => {
    if (urlChoice && urlChoice !== stored) persist(urlChoice);
  }, [urlChoice, stored, persist]);

  const select = useCallback(
    (categoryId: string) => {
      if (!isValid(categoryId)) return;
      persist(categoryId);
      if (params.has('c')) {
        const next = new URLSearchParams(params);
        next.delete('c');
        setParams(next, { replace: true });
      }
    },
    [params, persist, setParams],
  );

  const value = useMemo(() => ({ selectedId, select }), [selectedId, select]);
  return <SelectedCategoryContext.Provider value={value}>{children}</SelectedCategoryContext.Provider>;
}

export function useSelectedCategory(): SelectedCategoryValue {
  const value = useContext(SelectedCategoryContext);
  if (!value) throw new Error('useSelectedCategory fora do SelectedCategoryProvider');
  return value;
}
