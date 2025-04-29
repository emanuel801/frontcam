"use client";

import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/features/auth/LoginPage';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


export default function Home() {
  const { user, loading } = useAuth(); // Removed isAdmin
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Always redirect logged-in users to cameras
      router.replace('/cameras');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, router]);


  if (loading) {
    return (
       <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }


  if (!user) {
    // If not loading and no user, show the login page
    return <LoginPage />;
  }

  // Should not reach here if user is logged in due to redirection logic in useEffect
  // Render loading state while redirection is happening or if useEffect hasn't run yet
  return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size={48} />
        <p className="ml-2">Redirecting...</p>
      </div>
  );
}
