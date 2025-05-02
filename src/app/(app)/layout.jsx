"use client";

import React from 'react';
import BottomNav from '@/components/layout/BottomNav';
import Header from '@/components/layout/Header'; // Import the new Header component
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


export default function AppLayout({ children }) {
 const { user, loading } = useAuth(); // Removed isAdmin
 const router = useRouter();

  useEffect(() => {
    if (!loading) {
        if (!user) {
            // Redirect to login if not authenticated after loading
            router.replace('/');
        }
        // Removed admin check and redirection
    }
  }, [user, loading, router]);

   if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <LoadingSpinner size={48} />
      </div>
    );
  }

   // Render nothing or loading while redirecting or if checks fail
   if (!user) { // Removed isAdmin check
    return (
         <div className="flex justify-center items-center h-screen bg-background">
            <LoadingSpinner size={48} />
            <p className="ml-4 text-muted-foreground">Loading user data...</p>
         </div>
     );
  }

  // User is authenticated, render the app layout
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header /> {/* Add the Header component here */}
      {/* Adjusted padding: pt-20 for header space (mobile & desktop), pb-24 for bottom nav (mobile), pb-8 (desktop) */}
      <main className="flex-grow container mx-auto px-4 pt-20 pb-24 md:pb-8">
        {children}
      </main>
      <BottomNav /> {/* Keep BottomNav at the end */}
    </div>
  );
}
