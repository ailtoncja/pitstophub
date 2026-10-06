import { createContext, useContext } from 'react';
import type { AuthUser } from '../auth';

export type AuthContextValue = {
  user: AuthUser | null;
  /** Abre o modal de login/cadastro (renderizado pelo AuthGate). */
  requestLogin: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  requestLogin: () => undefined,
  logout: () => undefined,
});

export const useAuth = () => useContext(AuthContext);
