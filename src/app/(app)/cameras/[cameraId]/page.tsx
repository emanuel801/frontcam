"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCameras, getStreamUrlForTimestamp } from '@/services/stream-service';
import VideoPlayer from '@/components/features/cameras/VideoPlayer';
import DateTimeSearch from '@/components/features/cameras/DateTimeSearch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Video, ChevronLeft, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import type { Camera } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function CameraPlayerPage() {
  const params = useParams();
  const cameraId = params.cameraId as string;
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // For initial stream load indication
  const { toast } = useToast(); // Initialize toast

   // Fetch camera data to get details including environmentId
  const { data: cameras, isLoading: isLoadingCameras, isError: isErrorCameras, error: errorCameras } = useQuery<Camera[]>({
      queryKey: ['cameras'], // Fetch all cameras initially to find the one needed
      queryFn: getCameras,
      staleTime: Infinity,
      enabled: !!cameraId,
  });

   // Find the specific camera details
   const camera = cameras?.find(c => c.id === cameraId);

   // Determine the correct back link based on camera's environment
   const backLink = camera ? `/cameras/environment/${camera.environmentId}` : '/cameras'; // Default to main environments page if camera not found yet


   useEffect(() => {
        if (camera && !currentStreamUrl && isInitialLoading) {
             // Set the initial stream URL (live feed)
             setCurrentStreamUrl(camera.streamUrl);
             // Set a short timeout to allow the player to initialize before hiding the spinner
             const timer = setTimeout(() => setIsInitialLoading(false), 800); // Adjust timing as needed
             return () => clearTimeout(timer); // Cleanup timer
        } else if (!camera && !isLoadingCameras) {
            // If camera is not found after loading, stop initial load attempt
            setIsInitialLoading(false);
        }
    }, [camera, currentStreamUrl, isInitialLoading, isLoadingCameras]);


  // Mutation for fetching stream URL based on timestamp
  const { mutate: searchTimestamp } = useMutation({
    mutationFn: async ({ timestamp }: { timestamp: number }) => {
        setIsLoadingSearch(true);
        setIsInitialLoading(false); // Stop initial loading if search starts
        setCurrentStreamUrl(null); // Clear current URL immediately for search loading state
        return getStreamUrlForTimestamp(cameraId, timestamp);
    },
    onSuccess: (newUrl) => {
        setCurrentStreamUrl(newUrl); // Set the new URL
        setIsLoadingSearch(false);
        toast({
          title: "Recording Found",
          description: "Loading video from the selected time.",
        });
    },
    onError: (error) => {
        console.error('Error fetching stream URL for timestamp:', error);
         toast({
            title: "Search Error",
            description: `Failed to find recording: ${(error as Error).message}. Please try again.`,
            variant: "destructive",
         });
         setIsLoadingSearch(false);
         // Optionally revert to live stream if search fails?
         if (camera) setCurrentStreamUrl(camera.streamUrl);
    },
  });


  const handleSearch = (date: Date, time: string) => {
    // Combine date and time, then convert to timestamp (seconds since epoch)
    const [hours, minutes] = time.split(':').map(Number);
    const searchDateTime = new Date(date);
    searchDateTime.setHours(hours, minutes, 0, 0); // Set time, clear seconds/ms
    const timestampInSeconds = Math.floor(searchDateTime.getTime() / 1000);
    searchTimestamp({ timestamp: timestampInSeconds });
  };

  // Combine loading states
  const showOverallLoading = isLoadingCameras || isInitialLoading;

  if (showOverallLoading && !isErrorCameras) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-12rem)] space-y-4">
        <LoadingSpinner size={64} className="text-primary" />
        <p className="text-muted-foreground text-lg animate-pulse">
            {isLoadingCameras ? 'Loading camera details...' : 'Initializing live stream...'}
        </p>
      </div>
    );
  }

  if (isErrorCameras || (!isLoadingCameras && !camera)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <Link href={backLink} passHref>
            <Button variant="outline" size="sm" className="mb-6 rounded-lg shadow-sm">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back to Cameras
            </Button>
        </Link>
        <Alert variant="destructive" className="max-w-lg mx-auto rounded-lg shadow-md">
           <AlertTriangle className="h-5 w-5"/> {/* Changed icon */}
          <AlertTitle className="font-semibold">Error Loading Camera</AlertTitle>
          <AlertDescription>
            {isErrorCameras ? `Failed to load camera data. ${(errorCameras as Error)?.message}` : 'Camera details could not be found.'}
             <br/>Please return to the list and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Ensure camera is available before proceeding
  if (!camera) return null; // Should be handled by error state, but good practice

  return (
    <div className="space-y-8 pb-10"> {/* Increased spacing */}
         {/* Back Button and Title Section */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Video className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{camera.name}</h1>
                    <p className="text-muted-foreground mt-1 line-clamp-2">{camera.description}</p>
                     <Link href={backLink} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center mt-1">
                         <ChevronLeft className="mr-0.5 h-4 w-4" /> Back to {camera.environmentName}
                     </Link>
                </div>
            </div>
         </div>

        {/* Video Player Area with Enhanced Styling */}
        <div className="relative aspect-video w-full max-w-4xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-border/50">
            {(isLoadingSearch || isInitialLoading) && ( // Show loading state for both initial load and search
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black/70 z-10 backdrop-blur-sm">
                    <LoadingSpinner size={48} className="text-white" />
                    <p className="mt-3 text-base font-medium animate-pulse">
                        {isLoadingSearch ? 'Searching for recording...' : 'Loading stream...'}
                    </p>
                </div>
            )}
             {/* Render VideoPlayer only when URL is ready and not in a loading state */}
            {currentStreamUrl && !isLoadingSearch && !isInitialLoading && (
                 <VideoPlayer src={currentStreamUrl} />
            )}
             {/* Placeholder/Error if URL is null and not loading */}
             {!currentStreamUrl && !isLoadingSearch && !isInitialLoading && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-muted-foreground bg-black/50">
                     <WifiOff size={48} className="mb-2 text-muted-foreground/70"/>
                     <p>Stream unavailable or not loaded.</p>
                 </div>
             )}
        </div>

         {/* DateTimeSearch component */}
         <div className="flex justify-center px-2">
             {/* Apply shadow and rounded corners directly */}
            <DateTimeSearch
                onSearch={handleSearch}
                isLoading={isLoadingSearch}
                className="w-full max-w-xl shadow-lg rounded-xl border border-border/50 bg-card" // Add styling classes
            />
         </div>
    </div>
  );
}
