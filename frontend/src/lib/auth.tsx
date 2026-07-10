'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from './api';

interface AuthUser {
  id: string;
  email?: string;
  fullName?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  orgId: string | null;
  role: string | null;
  memberId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const PUBLIC_PATHS = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const data = await api<any>('/api/auth/me');
      if (data.ok) {
        setUser(data.user);
        setOrgId(data.orgId);
        setRole(data.role);
        setMemberId(data.memberId);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (!user && !isPublic) {
      router.replace('/login');
    }
    if (user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api<any>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      if (data.ok) {
        setUser(data.user);
        setOrgId(data.orgId);
        setRole(data.role);
        setMemberId(data.memberId);
        router.replace('/dashboard');
      } else {
        throw new Error(data.error || 'Login failed');
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors
    }
    setUser(null);
    setOrgId(null);
    setRole(null);
    setMemberId(null);
    router.replace('/login');
  }, [router]);

  const refresh = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider value={{ user, orgId, role, memberId, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}