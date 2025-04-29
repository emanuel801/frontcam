"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, ShieldCheck } from 'lucide-react'; // Removed LayoutDashboard
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, logout } = useAuth(); // Removed isAdmin
  const { toast } = useToast();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async logout
      logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.replace('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
      setIsLoggingOut(false);
    }
  };

  return (
    // Fixed header with background, shadow, and padding
    <header className="fixed top-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo/Brand - Always links to /cameras now */}
        <Link href={"/cameras"} className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
           <ShieldCheck className="h-7 w-7" />
           <span className="text-xl font-bold tracking-tight">StreamWatch</span>
        </Link>

        {/* Desktop Controls */}
        {user && (
          <div className="hidden md:flex items-center gap-4"> {/* Use flex container for buttons */}
             {/* Removed Admin Dashboard Link */}

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="ghost" // Use ghost for a less intrusive look in the header
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center gap-1.5"
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Logging Out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" /> Logout
                </>
              )}
            </Button>
          </div>
        )}

         {/* Mobile placeholder - keeps spacing consistent, can add menu trigger later */}
         {!user && <div className="w-10 h-10 md:hidden"></div> /* Show placeholder only if no user */}
         {user && <div className="w-10 h-10 md:hidden"></div> /* Placeholder if user exists */}
      </div>
    </header>
  );
}
