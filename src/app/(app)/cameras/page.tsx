// src/app/(app)/cameras/page.tsx -> Now serves as the Environment List page
"use client";
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getEnvironments } from '@/services/stream-service'; // Fetch environments now
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Home, WifiOff, ChevronRight } from 'lucide-react'; // Use Home icon for environments
import Image from 'next/image'; // Use next/image for environment images
import type { Environment } from '@/types'; // Import Environment type

export default function EnvironmentListPage() {
  const { data: environments, isLoading, isError, error } = useQuery<Environment[]>({ // Use Environment type
      queryKey: ['environments'], // Changed query key
      queryFn: getEnvironments, // Changed query function
       staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
         {/* Larger spinner for initial load */}
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="rounded-lg shadow-md">
         <WifiOff className="h-5 w-5"/>
          <AlertTitle className="font-semibold">Error Loading Data</AlertTitle>
          <AlertDescription>
            Failed to load environments. Please check your connection and try again. {(error as Error)?.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-8"> {/* Increased spacing */}
       <div className="flex items-center space-x-3 mb-6 border-b border-border pb-4"> {/* Title styling */}
         <Home className="h-10 w-10 text-primary" />
         <div>
             <h1 className="text-3xl font-bold tracking-tight text-primary">Camera Environments</h1>
             <p className="text-muted-foreground mt-1">Select an area to view live cameras.</p>
         </div>
       </div>

      {/* Display environments as cards with enhanced styling */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* Adjusted gap */}
        {environments?.map((env) => (
          // Link to the specific environment's camera page
          <Link href={`/cameras/environment/${env.id}`} key={env.id} passHref legacyBehavior>
            <a className="group block">
                {/* Enhanced Card styling: more prominent shadow, subtle border */}
                <Card className="overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col bg-card border border-border/60 hover:border-primary/50 transform hover:-translate-y-1">
                <CardHeader className="relative h-48 w-full p-0 bg-muted overflow-hidden"> {/* Added overflow-hidden */}
                    <Image
                        src={env.imageUrl}
                        alt={`Image of ${env.name}`}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-110" // Slightly stronger scale effect
                        unoptimized // Use if picsum causes issues or for performance
                    />
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                     {/* Icon overlay on hover */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                        <ChevronRight className="h-16 w-16 text-white/90 stroke-[1.5]" />
                     </div>
                </CardHeader>
                <CardContent className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                    <CardTitle className="text-xl font-semibold mb-1.5 text-primary transition-colors">{env.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-3">{env.description}</CardDescription> {/* Allow more lines */}
                    </div>
                </CardContent>
                </Card>
            </a>
          </Link>
        ))}
      </div>
       {(!environments || environments.length === 0) && (
            <div className="text-center py-16 col-span-full"> {/* Increased padding */}
                 <Home className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-50" />
                 <p className="text-lg text-muted-foreground">No camera environments found.</p>
                 {/* Optionally add a button to refresh or contact support */}
            </div>
       )}
    </div>
  );
}
