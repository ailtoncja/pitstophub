import { createContext, useContext } from 'react';

/** Acoes do cabecalho que qualquer pagina pode disparar (abrir busca, alertas, perfil). */
export type ShellApi = {
  openMenu: () => void;
  openSearch: () => void;
  openAlerts: () => void;
  openProfile: () => void;
};

const noop = () => undefined;

export const ShellContext = createContext<ShellApi>({ openMenu: noop, openSearch: noop, openAlerts: noop, openProfile: noop });

export const useShell = () => useContext(ShellContext);
