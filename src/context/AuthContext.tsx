"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User } from '@/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AuthContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading initially

  useEffect(() => {
    // Simulate checking auth status on mount
    const storedUser = localStorage.getItem('streamwatch_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    // Simulate async check (e.g., token validation)
    setTimeout(() => {
        setLoading(false);
    }, 500); // Simulate network latency
  }, []);

  const login = (username: string) => {
    const userData: User = { id: '1', username: username }; // Mock user data
    setUser(userData);
    localStorage.setItem('streamwatch_user', JSON.stringify(userData));
    setLoading(false); // Ensure loading is false after login
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('streamwatch_user');
    setLoading(false); // Ensure loading is false after logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
