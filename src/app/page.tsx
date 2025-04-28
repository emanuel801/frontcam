"use client";

import { useAuth } from '@/context/AuthContext';
import LoginPage from '@/components/features/auth/LoginPage';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/cameras');
    }
  }, [user, loading, router]);


  if (loading) {
    return (
       <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size={48} />
      </div>
    );
  }


  if (!user) {
    return <LoginPage />;
  }

  // Should not reach here if user is logged in due to redirection
  return null;
}
