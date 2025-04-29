"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User } from '@/types'; // Removed UserRole import
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (username: string) => void; // Return type changed to void
  logout: () => void;
  loading: boolean;
  // Removed isAdmin flag
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading initially
  // Removed isAdmin state
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth status on mount
    const storedUser = localStorage.getItem('streamwatch_user');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // Ensure all expected fields are present or provide defaults
        const completeUser: User = {
            id: parsedUser.id || '1',
            username: parsedUser.username || 'Unknown User',
            name: parsedUser.name || 'Test User',
            email: parsedUser.email || `${parsedUser.username || 'user'}@example.com`,
            plan: parsedUser.plan || 'Premium',
            // Removed role assignment
        };
        setUser(completeUser);
        // Removed setIsAdmin based on role
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

  const login = (username: string): void => { // Return type changed to void
    // Mock user data without role
    const userData: User = {
        id: '1', // Use a more robust ID generation in a real app
        username: username,
        name: 'Test User', // Example name
        email: `${username}@example.com`, // Example email
        plan: 'Premium', // Example plan
        // Removed role
    };
    setUser(userData);
    // Removed setIsAdmin
    localStorage.setItem('streamwatch_user', JSON.stringify(userData));
    setLoading(false); // Ensure loading is false after login
    // Removed return role
  };

  const logout = () => {
    setUser(null);
    // Removed setIsAdmin(false);
    localStorage.removeItem('streamwatch_user');
    setLoading(false); // Ensure loading is false after logout
    router.push('/'); // Redirect to login page on logout
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
