import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TOKEN_KEY, setUnauthorizedHandler } from '@/api/client';
import { authApi } from '@/api/endpoints';
import type { User } from '@/api/types';

const USER_KEY = 'medbook.user';

interface AuthState {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readStoredUser(): User | null {
  try {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const login = useCallback((token: string, next: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  // Refresh the cached profile once per session; a 401 logs out via the interceptor.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi
      .me()
      .then((fresh) => {
        localStorage.setItem(USER_KEY, JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
