"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User, UserRole } from '@/types'; // Import UserRole
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

interface AuthContextType {
  user: User | null;
  login: (username: string) => UserRole; // Return the role for redirection handling
  logout: () => void;
  loading: boolean;
  isAdmin: boolean; // Convenience flag
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading initially
  const [isAdmin, setIsAdmin] = useState(false); // State for admin status
  const router = useRouter(); // Use router inside provider if needed for complex logic, but prefer handling redirection in components

  useEffect(() => {
    // Simulate checking auth status on mount
    const storedUser = localStorage.getItem('streamwatch_user');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // Ensure all expected fields are present or provide defaults
        // Crucially, validate or assign the role
        const role: UserRole = parsedUser.role || (parsedUser.username === 'testuser' ? 'admin' : 'user');
        const completeUser: User = {
            id: parsedUser.id || '1',
            username: parsedUser.username || 'Unknown User',
            name: parsedUser.name || (role === 'admin' ? 'Admin User' : 'Test User'),
            email: parsedUser.email || `${parsedUser.username || 'user'}@example.com`,
            plan: parsedUser.plan || (role === 'admin' ? 'Enterprise' : 'Premium'),
            role: role, // Assign determined role
        };
        setUser(completeUser);
        setIsAdmin(completeUser.role === 'admin');
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

  const login = (username: string): UserRole => {
    // Mock user data including new fields and role
    const role: UserRole = username === 'testuser' ? 'admin' : 'user'; // Assign admin role to testuser
    const userData: User = {
        id: '1', // Use a more robust ID generation in a real app
        username: username,
        name: role === 'admin' ? 'Admin User' : 'Test User', // Example name based on role
        email: `${username}@example.com`, // Example email
        plan: role === 'admin' ? 'Enterprise' : 'Premium', // Example plan based on role
        role: role,
    };
    setUser(userData);
    setIsAdmin(role === 'admin');
    localStorage.setItem('streamwatch_user', JSON.stringify(userData));
    setLoading(false); // Ensure loading is false after login
    return role; // Return the role
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('streamwatch_user');
    setLoading(false); // Ensure loading is false after logout
    router.push('/'); // Redirect to login page on logout
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
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
