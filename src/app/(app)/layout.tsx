
"use client";

import React from 'react';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header'; // Import the new Header component
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
      <Header /> {/* Add the Header component here */}
      {/* Adjusted padding: pt-20 for header space, pb-24 for bottom nav */}
      <main className="flex-grow container mx-auto px-4 pt-20 pb-24 md:pt-8 md:pb-8">
        {children}
      </main>
      <BottomNav /> {/* Keep BottomNav at the end */}
    </div>
  );
}

