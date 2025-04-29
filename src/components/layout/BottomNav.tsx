"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, UserCircle } from 'lucide-react'; // Removed LayoutDashboard
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
// Removed useAuth import as it's no longer needed here

const navItems = [ // Only default items now
  { href: '/cameras', label: 'Cameras', icon: Camera },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

// Removed adminNavItems

export default function BottomNav() {
  const pathname = usePathname();
  // Removed isAdmin check

  // Always use default navItems now
  // const navItems = isAdmin ? adminNavItems : defaultNavItems;

  return (
    // Applied gradient background, increased blur, stronger shadow
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-card/95 via-card/90 to-card/95 backdrop-blur-md border-t border-border/50 shadow-2xl md:hidden z-50 h-18">
      {/* Adjust grid columns based on number of items */}
      <div className={cn(
        "grid items-center h-full max-w-md mx-auto px-2",
         `grid-cols-${navItems.length}` // Dynamically set grid columns (will be 2)
      )}>
        {navItems.map((item) => {
           const isActive = item.href === '/cameras'
            ? pathname.startsWith('/cameras') // Make cameras active for sub-routes
            : pathname.startsWith(item.href);

          return (
            <Link href={item.href} key={item.href} passHref legacyBehavior>
              <Button
                variant="ghost"
                className={cn(
                  "relative flex flex-col items-center justify-center h-full px-1 transition-all duration-300 ease-out transform focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none group overflow-hidden w-full hover:bg-transparent focus:bg-transparent", // Added hover/focus:bg-transparent
                  isActive
                    ? 'text-primary scale-105 font-semibold' // Simpler active state - primary color, slight scale, bold
                    : 'text-muted-foreground hover:text-foreground' // Hover to foreground for inactive
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                 {/* Active Indicator (subtle line) */}
                 <span
                    className={cn(
                        "absolute top-0 left-1/2 -translate-x-1/2 h-1 w-10 bg-primary rounded-b-full transition-all duration-300 ease-out",
                        isActive ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0" // Animate in/out
                    )}
                    aria-hidden="true"
                 />

                <item.icon
                    className={cn(
                        "h-6 w-6 mb-1 transition-transform duration-200 group-hover:scale-110", // Slightly smaller icon, hover scale
                        isActive ? "text-primary" : "" // Icon color matches text
                    )}
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.25 : 1.75} // Slightly adjusted stroke
                 />
                <span className={cn(
                    "text-xs",
                    // Font weight handled by parent className
                )}>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
