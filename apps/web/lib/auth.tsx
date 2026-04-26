"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setState({ token: null, user: null, ready: true });
      return;
    }
    const client = createClient(stored);
    client
      .get<AuthUser>("/auth/me")
      .then((user) => setState({ token: stored, user, ready: true }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ token: null, user: null, ready: true });
      });
  }, []);

  const login = useCallback(async (creds: LoginRequest) => {
    const client = createClient(null);
    const res = await client.post<LoginResponse>("/auth/login", creds);
    localStorage.setItem(TOKEN_KEY, res.token);
    setState({ token: res.token, user: res.user, ready: true });
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ token: null, user: null, ready: true });
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return;
    try {
      const user = await createClient(stored).get<AuthUser>("/auth/me");
      setState((prev) => ({ ...prev, user }));
    } catch {}
  }, []);

  const api = createClient(state.token);

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
