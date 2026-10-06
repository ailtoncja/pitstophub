import { createContext, useContext } from 'react';

/** Acoes do cabecalho que qualquer pagina pode disparar (abrir busca, alertas, perfil). */
export type ShellApi = {
  openSearch: () => void;
  openAlerts: () => void;
  openProfile: () => void;
};

const noop = () => undefined;

export const ShellContext = createContext<ShellApi>({ openSearch: noop, openAlerts: noop, openProfile: noop });

export const useShell = () => useContext(ShellContext);
