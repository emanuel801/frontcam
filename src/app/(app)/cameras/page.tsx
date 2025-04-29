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
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
         <WifiOff className="h-4 w-4"/>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load environments. Please check your connection and try again. {(error as Error)?.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center space-x-2 mb-6">
         <Home className="h-8 w-8 text-primary" />
         <h1 className="text-3xl font-bold text-primary">Camera Environments</h1>
       </div>
      <p className="text-muted-foreground">Select an environment to view its cameras.</p>
      {/* Display environments as cards */}
      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {environments?.map((env) => (
          // Link to the specific environment's camera page
          <Link href={`/cameras/environment/${env.id}`} key={env.id} passHref legacyBehavior>
            <a className="group block">
                <Card className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col bg-card border border-border hover:border-primary">
                <CardHeader className="relative h-40 w-full p-0 bg-muted">
                    <Image
                        src={env.imageUrl}
                        alt={`Image of ${env.name}`}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-300 group-hover:scale-105"
                        unoptimized // Use if picsum causes issues or for performance
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-12 w-12 text-white/80" />
                     </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                    <CardTitle className="text-lg font-semibold mb-1 text-primary group-hover:text-accent transition-colors">{env.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2">{env.description}</CardDescription>
                    </div>
                </CardContent>
                </Card>
            </a>
          </Link>
        ))}
      </div>
       {!environments || environments.length === 0 && (
            <div className="text-center py-10">
                 <p className="text-muted-foreground">No environments found.</p>
            </div>
       )}
    </div>
  );
}
