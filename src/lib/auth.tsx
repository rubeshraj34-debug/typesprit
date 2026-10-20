import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as db from './db';
import type { User } from './db';
import { PageLoader } from '../components/ui';

const KEY = 'typesprint_session';

interface AuthValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    db.getSessionUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (t: string, u: User) => {
    localStorage.setItem(KEY, t);
    setToken(t);
    setUser(u);
  };

  const login = useCallback(async (email: string, password: string) => {
    const r = await db.login(email, password);
    persist(r.token, r.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const r = await db.signup(name, email, password);
    persist(r.token, r.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await db.logout(token);
    } finally {
      localStorage.removeItem(KEY);
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setUser(await db.getSessionUser(token));
    } catch {
      localStorage.removeItem(KEY);
      setToken(null);
      setUser(null);
    }
  }, [token]);

  return (
    <Ctx.Provider value={{ user, token, loading, login, signup, logout, setUser, refresh }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageLoader label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
