"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading initially
  const router = useRouter();

  useEffect(() => {
    // Simulate checking auth status on mount
    const storedUser = localStorage.getItem('streamwatch_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure all expected fields are present or provide defaults
        const completeUser = {
            id: parsedUser.id || '1',
            username: parsedUser.username || 'Unknown User',
            name: parsedUser.name || 'Test User',
            email: parsedUser.email || `${parsedUser.username || 'user'}@example.com`,
            plan: parsedUser.plan || 'Premium',
        };
        setUser(completeUser);
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

  const login = (username) => { // Return type changed to void
    // Mock user data without role
    const userData = {
        id: '1', // Use a more robust ID generation in a real app
        username: username,
        name: 'Test User', // Example name
        email: `${username}@example.com`, // Example email
        plan: 'Premium', // Example plan
    };
    setUser(userData);
    localStorage.setItem('streamwatch_user', JSON.stringify(userData));
    setLoading(false); // Ensure loading is false after login
  };

  const logout = () => {
    setUser(null);
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
