"use client";

import React from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


export default function AppLayout({ children }: { children: React.ReactNode }) {
 const { user, loading } = useAuth();
 const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/'); // Redirect to login if not authenticated
    }
  }, [user, loading, router]);

   if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

   if (!user) {
    // Avoid rendering layout content if user is not authenticated and redirection hasn't happened yet
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Increased padding-bottom to pb-24 to avoid overlap with BottomNav */}
      <main className="flex-grow container mx-auto px-4 py-6 pb-24 md:py-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
