"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav'; // Keep BottomNav for mobile admin access

export default function AdminLayout({ children }: { children: React.ReactNode }) {
 const { user, isAdmin, loading } = useAuth();
 const router = useRouter();

  useEffect(() => {
    if (!loading) {
        if (!user) {
            // If not loading and no user, redirect to login
             console.warn("No user found. Redirecting to login...");
            router.replace('/');
        } else if (!isAdmin) {
            // If not loading, user exists, but is NOT admin, redirect away
             console.warn("Non-admin user attempting to access admin area. Redirecting...");
             router.replace('/cameras'); // Or '/' for login page if preferred
        }
    }
  }, [user, isAdmin, loading, router]);

   if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

   // If checks above passed, but user somehow became non-admin or null during render/redirect
   if (!user || !isAdmin) {
    // Render loading/redirecting state or null
    return (
         <div className="flex justify-center items-center h-screen bg-background">
            <LoadingSpinner size={48} />
            <p className="ml-4 text-muted-foreground">Redirecting...</p>
         </div>
    );
  }

  // User is confirmed to be an admin, render the admin layout
  return (
    <div className="flex flex-col min-h-screen bg-muted/40"> {/* Slightly different bg for admin */}
      <Header /> {/* Use the same header */}
      {/* Adjusted padding: pt-20 for header space, pb-24 for bottom nav (mobile), pb-8 (desktop) */}
      <main className="flex-grow container mx-auto px-4 pt-20 pb-24 md:pb-8">
        {children}
      </main>
      <BottomNav /> {/* Keep BottomNav for mobile navigation */}
    </div>
  );
}
