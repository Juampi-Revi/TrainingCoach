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
import { createClient, ApiError } from "./api";
import type { AuthUser, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from "@regen/types";

const TOKEN_KEY = "regen_token";
const REFRESH_TOKEN_KEY = "regen_refresh_token";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  login: (creds: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  api: ReturnType<typeof createClient>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ 
    token: null, 
    refreshToken: null,
    user: null, 
    ready: false 
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const token = window.localStorage.getItem(TOKEN_KEY);
        const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!token) {
          setState({ token: null, refreshToken: null, user: null, ready: true });
          return;
        }
        setState({ token, refreshToken, user: null, ready: false });
      } catch {
        setState({ token: null, refreshToken: null, user: null, ready: true });
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  // Validate token and load user
  useEffect(() => {
    const token = state.token;
    if (!token || state.ready) return;
    
    const client = createClient(token);
    client
      .get<AuthUser>("/auth/me")
      .then((user) => setState({ token, refreshToken: state.refreshToken, user, ready: true }))
      .catch(async (err) => {
        // If 401, try to refresh the token
        if (err instanceof ApiError && err.status === 401 && state.refreshToken) {
          try {
            const refreshed = await refreshAccessToken(state.refreshToken);
            setState({ 
              token: refreshed.token, 
              refreshToken: refreshed.refreshToken,
              user: refreshed.user, 
              ready: true 
            });
            window.localStorage.setItem(TOKEN_KEY, refreshed.token);
            window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshed.refreshToken);
            return;
          } catch {
            // Refresh failed, clear tokens
          }
        }
        
        try { 
          window.localStorage.removeItem(TOKEN_KEY); 
          window.localStorage.removeItem(REFRESH_TOKEN_KEY);
        } catch {}
        setState({ token: null, refreshToken: null, user: null, ready: true });
      });
  }, [state.ready, state.token, state.refreshToken]);

  const login = useCallback(async (creds: LoginRequest) => {
    const client = createClient(null);
    const res = await client.post<LoginResponse>("/auth/login", creds);
    
    try { 
      window.localStorage.setItem(TOKEN_KEY, res.token); 
      if (res.refreshToken) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
      }
    } catch {}
    
    setState({ 
      token: res.token, 
      refreshToken: res.refreshToken || null,
      user: res.user, 
      ready: true 
    });
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    // Try to call logout endpoint if we have a token
    if (state.token) {
      try {
        const client = createClient(state.token);
        await client.post("/auth/logout", {});
      } catch {
        // Ignore errors on logout
      }
    }
    
    try { 
      window.localStorage.removeItem(TOKEN_KEY); 
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {}
    setState({ token: null, refreshToken: null, user: null, ready: true });
  }, [state.token]);

  const refreshUser = useCallback(async () => {
    let token: string | null = null;
    try { token = window.localStorage.getItem(TOKEN_KEY); } catch {}
    if (!token) return;
    try {
      const user = await createClient(token).get<AuthUser>("/auth/me");
      setState((prev) => ({ ...prev, user }));
    } catch {}
  }, []);

  // Create API client with automatic token refresh
  const api = useMemo(() => {
    const client = createClient(state.token);
    
    // Add response interceptor for 401 handling
    const originalRequest = client.request.bind(client);
    client.request = async <T,>(method: string, url: string, body?: unknown): Promise<T> => {
      try {
        return await originalRequest(method, url, body);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && state.refreshToken) {
          // Try to refresh token
          try {
            const refreshed = await refreshAccessToken(state.refreshToken);
            setState(prev => ({
              ...prev,
              token: refreshed.token,
              refreshToken: refreshed.refreshToken,
              user: refreshed.user,
            }));
            window.localStorage.setItem(TOKEN_KEY, refreshed.token);
            window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshed.refreshToken);
            
            // Retry original request with new token
            const retryClient = createClient(refreshed.token);
            return await retryClient.request(method, url, body);
          } catch {
            // Refresh failed, logout
            logout();
          }
        }
        throw err;
      }
    };
    
    return client;
  }, [state.token, state.refreshToken, logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser, api }}>
      {children}
    </AuthContext.Provider>
  );
}

async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const client = createClient(null);
  return client.post<RefreshTokenResponse>("/auth/refresh", { refreshToken } as RefreshTokenRequest);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
