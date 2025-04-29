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
import { WifiOff, Video, ChevronLeft, Home } from 'lucide-react'; // Add ChevronLeft, Home
import StreamPreviewImage from '@/components/features/cameras/StreamPreviewImage';
import type { Camera, Environment } from '@/types'; // Import Environment type
import { Button } from '@/components/ui/button';

export default function EnvironmentCameraListPage() {
  const params = useParams();
  const router = useRouter(); // Get router instance
  const environmentId = params.environmentId as string;

  // Fetch cameras for the specific environment
  const { data: cameras, isLoading: isLoadingCameras, isError: isErrorCameras, error: errorCameras } = useQuery<Camera[]>({
      queryKey: ['cameras', environmentId], // Include environmentId in query key
      queryFn: () => getCamerasByEnvironment(environmentId), // Fetch by environment ID
      enabled: !!environmentId, // Only fetch if environmentId is available
      staleTime: 5 * 60 * 1000, // 5 minutes
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
        <LoadingSpinner size={48} />
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
             <Button variant="outline" size="sm" className="mb-4">
                <ChevronLeft className="mr-1 h-4 w-4" /> All Environments
            </Button>
        </Link>
        <Alert variant="destructive">
         <WifiOff className="h-4 w-4"/>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {isError ? `Failed to load cameras for this environment. ${(error as Error)?.message}` : 'Environment not found.'}
             Please go back and select another environment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-6">
         <div className="flex items-center justify-between mb-6">
             <div className="flex items-center space-x-2">
                <Home className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">{currentEnvironment.name} Cameras</h1>
                     <p className="text-sm text-muted-foreground">{currentEnvironment.description}</p>
                </div>
             </div>
            <Link href="/cameras" passHref>
                <Button variant="outline" size="sm">
                    <ChevronLeft className="mr-1 h-4 w-4" /> Back to Environments
                </Button>
            </Link>
       </div>

      {/* Adjusted grid columns for better mobile responsiveness */}
      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {cameras?.map((camera) => (
           // Link to the Camera Player Page using the camera ID
          <Link href={`/cameras/${camera.id}`} key={camera.id} passHref legacyBehavior>
            <a className="group block">
                <Card className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col bg-card border border-border hover:border-primary">
                <CardHeader className="relative h-40 w-full p-0 bg-muted">
                    <StreamPreviewImage
                        streamUrl={camera.streamUrl}
                        alt={`Preview for ${camera.name}`}
                     />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Video className="h-12 w-12 text-white/80" />
                     </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                    <CardTitle className="text-lg font-semibold mb-1 text-primary group-hover:text-accent transition-colors">{camera.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground line-clamp-2">{camera.description}</CardDescription>
                    </div>
                </CardContent>
                </Card>
            </a>
          </Link>
        ))}
      </div>
        {/* Message if no cameras are found in this environment */}
        {(!cameras || cameras.length === 0) && (
            <div className="text-center py-10">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No cameras found in the '{currentEnvironment.name}' environment.</p>
                <Link href="/cameras" passHref>
                    <Button variant="link" className="mt-2">Go back to Environments</Button>
                </Link>
            </div>
        )}
    </div>
  );
}
