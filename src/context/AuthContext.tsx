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
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure all expected fields are present or provide defaults
        setUser({
            id: parsedUser.id || '1',
            username: parsedUser.username || 'Unknown User',
            name: parsedUser.name || 'Test User', // Add default name if missing
            email: parsedUser.email || 'test@example.com', // Add default email if missing
            plan: parsedUser.plan || 'Premium', // Add default plan if missing
        });
      } catch (error) {
          console.error("Failed to parse stored user data:", error);
          localStorage.removeItem('streamwatch_user'); // Clear invalid data
      }
    }
    // Simulate async check (e.g., token validation)
    setTimeout(() => {
        setLoading(false);
    }, 500); // Simulate network latency
  }, []);

  const login = (username: string) => {
    // Mock user data including new fields
    const userData: User = {
        id: '1',
        username: username,
        name: 'Test User', // Example name
        email: 'test@example.com', // Example email
        plan: 'Premium' // Example plan
    };
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
