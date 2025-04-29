// src/app/(app)/cameras/environment/[environmentId]/page.tsx
"use client";
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter
import { getCamerasByEnvironment, getEnvironments } from '@/services/stream-service'; // Use getCamerasByEnvironment
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Video, ChevronLeft, Home, Camera } from 'lucide-react'; // Added Camera icon
import StreamPreviewImage from '@/components/features/cameras/StreamPreviewImage';
import type { Camera as CameraType, Environment } from '@/types'; // Import Environment type, alias Camera type
import { Button } from '@/components/ui/button';

export default function EnvironmentCameraListPage() {
  const params = useParams();
  const router = useRouter(); // Get router instance
  const environmentId = params.environmentId as string;

  // Fetch cameras for the specific environment
  const { data: cameras, isLoading: isLoadingCameras, isError: isErrorCameras, error: errorCameras } = useQuery<CameraType[]>({
      queryKey: ['cameras', environmentId], // Include environmentId in query key
      queryFn: () => getCamerasByEnvironment(environmentId), // Fetch by environment ID
      enabled: !!environmentId, // Only fetch if environmentId is available
      staleTime: 1 * 60 * 1000, // 1 minute stale time for camera list
  });

  // Fetch environment details (for displaying name)
  const { data: environments, isLoading: isLoadingEnvs } = useQuery<Environment[]>({
        queryKey: ['environments'], // Reuse environments query key
        queryFn: getEnvironments,
        staleTime: Infinity, // Cache environments longer as they change less often
  });

  const currentEnvironment = environments?.find(env => env.id === environmentId);


   const isLoading = isLoadingCameras || isLoadingEnvs;
   const isError = isErrorCameras; // Prioritize camera loading error message
   const error = errorCameras;

  if (isLoading) {
    return (
       <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (isError || !currentEnvironment) {
     // Redirect back to environments list if environment not found after loading
     if (!isLoading && !currentEnvironment) {
         console.error("Environment not found:", environmentId);
         router.replace('/cameras'); // Use replace to avoid history entry
         return null; // Render nothing while redirecting
     }

    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/cameras" passHref>
             {/* Improved Button styling */}
             <Button variant="outline" size="sm" className="mb-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <ChevronLeft className="mr-1 h-4 w-4" /> All Environments
            </Button>
        </Link>
        <Alert variant="destructive" className="rounded-lg shadow-md">
         <WifiOff className="h-5 w-5"/>
          <AlertTitle className="font-semibold">Error Loading Data</AlertTitle>
          <AlertDescription>
            {isError ? `Failed to load cameras for this environment. ${(error as Error)?.message}` : 'Environment not found.'}
             Please go back and select another environment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-8">
         {/* Improved Header Section */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-border pb-4">
             <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Home className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{currentEnvironment.name} Cameras</h1>
                     <p className="text-muted-foreground mt-1">{currentEnvironment.description}</p>
                </div>
             </div>
            <Link href="/cameras" passHref>
                <Button variant="outline" size="sm" className="rounded-lg shadow-sm hover:shadow-md transition-shadow w-full sm:w-auto">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to Environments
                </Button>
            </Link>
       </div>

      {/* Enhanced grid and card styling */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cameras?.map((camera) => (
           // Link to the Camera Player Page using the camera ID
          <Link href={`/cameras/${camera.id}`} key={camera.id} passHref legacyBehavior>
            <a className="group block">
                {/* More pronounced shadow, subtle border, hover effect */}
                <Card className="overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col bg-card border border-border/60 hover:border-primary/50 transform hover:-translate-y-1">
                <CardHeader className="relative h-48 w-full p-0 bg-muted overflow-hidden">
                    <StreamPreviewImage
                        streamUrl={camera.streamUrl}
                        alt={`Preview for ${camera.name}`}
                     />
                    {/* Darker gradient for better text contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                     {/* Play icon overlay */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
                        <Video className="h-16 w-16 text-white/90 stroke-[1.5]" />
                     </div>
                     {/* Camera icon badge */}
                     <div className="absolute top-3 right-3 p-1.5 bg-black/50 rounded-full">
                        <Camera className="h-4 w-4 text-white/80"/>
                     </div>
                </CardHeader>
                <CardContent className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                    <CardTitle className="text-xl font-semibold mb-1.5 text-primary group-hover:text-accent transition-colors">{camera.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-3">{camera.description}</CardDescription>
                    </div>
                </CardContent>
                </Card>
            </a>
          </Link>
        ))}
      </div>
        {/* Improved "No Cameras" message */}
        {(!cameras || cameras.length === 0) && (
            <div className="text-center py-16 col-span-full bg-muted/50 rounded-lg border border-dashed border-border">
                <Video className="h-16 w-16 text-muted-foreground mx-auto mb-5 opacity-60" />
                <p className="text-lg text-muted-foreground mb-4">No cameras found in '{currentEnvironment.name}'.</p>
                <Link href="/cameras" passHref>
                    <Button variant="link" className="text-primary hover:text-accent">Go back to Environments</Button>
                </Link>
            </div>
        )}
    </div>
  );
}
