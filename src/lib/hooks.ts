import { useEffect, useState, type DependencyList } from 'react';

export type AsyncState<T> = { data: T | null; status: 'idle' | 'loading' | 'ready' | 'error' };

/**
 * Executa `load` quando `enabled` e as dependencias mudam; ignora respostas de execucoes antigas.
 * `load` pode devolver null (sem dado) sem contar como erro.
 */
export function useAsync<T>(load: () => Promise<T | null>, deps: DependencyList, enabled = true): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, status: enabled ? 'loading' : 'idle' });

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, status: 'idle' });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ data: prev.data, status: 'loading' }));
    load()
      .then((data) => {
        if (!cancelled) setState({ data, status: 'ready' });
      })
      .catch((error: unknown) => {
        console.error('Falha ao carregar dados.', error);
        if (!cancelled) setState({ data: null, status: 'error' });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return state;
}

/** Rola para o topo quando a rota muda (as paginas de perfil abriam no meio da tela). */
export function useScrollTopOn(key: string) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [key]);
}
