"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, UserCircle } from 'lucide-react'; // Using UserCircle for better visual
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/cameras', label: 'Cameras', icon: Camera },
  { href: '/profile', label: 'Profile', icon: UserCircle }, // Changed icon
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    // Added backdrop-blur-sm and bg-opacity-95 for subtle transparency effect (optional)
    // Increased height slightly to h-18 for better touch targets
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg md:hidden z-50 h-18">
      {/* Adjusted justify-around and padding */}
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-2">
        {navItems.map((item) => {
          // Improved active state check for camera details page
          const isActive = pathname === item.href || (item.href === '/cameras' && pathname.startsWith('/cameras/'));

          return (
            <Link href={item.href} key={item.href} passHref legacyBehavior>
              <Button
                variant="ghost"
                className={cn(
                  "flex flex-col items-center justify-center h-full px-3 transition-all duration-200 ease-in-out transform hover:scale-105 rounded-none", // Remove default button rounding
                  isActive
                    ? 'text-primary scale-110 font-medium border-t-2 border-primary' // Enhanced active state: bigger, primary color, top border
                    : 'text-muted-foreground hover:text-accent'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Slightly larger icon */}
                <item.icon className={cn(
                    "h-7 w-7 mb-0.5", // Adjusted size and margin
                    isActive ? "text-primary" : ""
                    )}
                    aria-hidden="true"
                    strokeWidth={isActive ? 2.5 : 2} // Thicker stroke when active
                 />
                <span className={cn(
                    "text-xs",
                     isActive ? "font-semibold" : "font-normal" // Bold text when active
                )}>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
