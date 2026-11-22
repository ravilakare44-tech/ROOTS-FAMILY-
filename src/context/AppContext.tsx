import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient, setAuthToken } from '../services/apiClient.ts';
import type { CurrencyCode, UserAccount } from '../shared/types.ts';

interface AppContextValue {
  currentPath: string;
  navigate: (path: string) => void;
  user: UserAccount | null;
  authLoading: boolean;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithDemoAccount: () => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [user, setUser] = useState<UserAccount | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    const [pathname, hash] = path.split('#');
    const targetPath = pathname || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(targetPath);
    } else if (hash) {
      window.history.replaceState({}, '', path);
    }

    if (hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const res = await apiClient.login(email, password);
      setAuthToken(res.token);
      setUser(res.user);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthLoading(true);
      try {
        const res = await apiClient.register(name, email, password);
        setAuthToken(res.token);
        setUser(res.user);
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const loginWithDemoAccount = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await apiClient.loginDemo();
      setAuthToken(res.token);
      setUser(res.user);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    navigate('/');
  }, [navigate]);

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        user,
        authLoading,
        currency,
        setCurrency,
        loginWithEmail,
        registerWithEmail,
        loginWithDemoAccount,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
