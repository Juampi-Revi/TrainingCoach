"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { createClient } from "./api";
import type { AuthUser, LoginRequest, LoginResponse } from "@regen/types";

const TOKEN_KEY = "regen_token";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  login: (creds: LoginRequest) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  api: ReturnType<typeof createClient>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null, ready: false });

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(TOKEN_KEY);
        if (!stored) {
          setState({ token: null, user: null, ready: true });
          return;
        }
        setState({ token: stored, user: null, ready: false });
      } catch {
        setState({ token: null, user: null, ready: true });
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const stored = state.token;
    if (!stored || state.ready) return;
    const client = createClient(stored);
    client
      .get<AuthUser>("/auth/me")
      .then((user) => setState({ token: stored, user, ready: true }))
      .catch(() => {
        try { window.localStorage.removeItem(TOKEN_KEY); } catch {}
        setState({ token: null, user: null, ready: true });
      });
  }, [state.ready, state.token]);

  const login = useCallback(async (creds: LoginRequest) => {
    const client = createClient(null);
    const res = await client.post<LoginResponse>("/auth/login", creds);
    try { window.localStorage.setItem(TOKEN_KEY, res.token); } catch {}
    setState({ token: res.token, user: res.user, ready: true });
    return res.user;
  }, []);

  const logout = useCallback(() => {
    try { window.localStorage.removeItem(TOKEN_KEY); } catch {}
    setState({ token: null, user: null, ready: true });
  }, []);

  const refreshUser = useCallback(async () => {
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(TOKEN_KEY); } catch {}
    if (!stored) return;
    try {
      const user = await createClient(stored).get<AuthUser>("/auth/me");
      setState((prev) => ({ ...prev, user }));
    } catch {}
  }, []);

  const api = useMemo(() => createClient(state.token), [state.token]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
