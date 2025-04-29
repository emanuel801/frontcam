
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
      staleTime: Infinity, // Keep camera list fresh longer
      enabled: !!cameraId,
  });

   // Find the specific camera details
   const camera = cameras?.find(c => c.id === cameraId);

   // Determine the correct back link based on camera's environment
   const backLink = camera ? `/cameras/environment/${camera.environmentId}` : '/cameras'; // Default to main environments page if camera not found yet


   useEffect(() => {
        if (camera && !currentStreamUrl && isInitialLoading) {
             console.log("Camera found, setting initial stream URL:", camera.streamUrl);
             // Set the initial stream URL (live feed)
             setCurrentStreamUrl(camera.streamUrl);
             // Set a short timeout to allow the player to initialize before hiding the spinner
             const timer = setTimeout(() => {
                 console.log("Initial loading period ended.");
                 setIsInitialLoading(false);
             }, 800); // Adjust timing as needed
             return () => clearTimeout(timer); // Cleanup timer
        } else if (!camera && !isLoadingCameras && isInitialLoading) {
            console.log("Camera not found after loading, stopping initial load attempt.");
            // If camera is not found after loading, stop initial load attempt
            setIsInitialLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camera, currentStreamUrl, isInitialLoading, isLoadingCameras]); // Add isInitialLoading dependency


  // Mutation for fetching stream URL based on timestamp
  const { mutate: searchTimestamp } = useMutation({
    mutationFn: async ({ timestamp }: { timestamp: number }) => {
        console.log(`Searching timestamp ${timestamp} for camera ${cameraId}`);
        setIsLoadingSearch(true);
        setIsInitialLoading(false); // Stop initial loading if search starts
        // Don't clear currentStreamUrl here, let VideoPlayer handle its own loading state
        // setCurrentStreamUrl(null); // Keep player mounted
        return getStreamUrlForTimestamp(cameraId, timestamp);
    },
    onSuccess: (newUrl) => {
        console.log("Timestamp search successful, new URL:", newUrl);
        setCurrentStreamUrl(newUrl); // Set the new URL, VideoPlayer will re-init
        setIsLoadingSearch(false);
        toast({
          title: "Recording Found",
          description: "Loading video from the selected time.",
          className: "bg-green-100 border-green-300 text-green-800", // Success styling
        });
    },
    onError: (error) => {
        console.error('Error fetching stream URL for timestamp:', error);
         toast({
            title: "Search Error",
            description: `Failed to find recording: ${(error as Error).message}. Reverting to live feed.`,
            variant: "destructive",
         });
         setIsLoadingSearch(false);
         // Revert to live stream if search fails and camera data is available
         if (camera) {
             console.log("Search failed, reverting to live stream URL:", camera.streamUrl);
             setCurrentStreamUrl(camera.streamUrl);
         } else {
             console.log("Search failed, camera data not available to revert.");
             setCurrentStreamUrl(null); // Set to null if no camera data to revert to
         }
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

  // Combine loading states for initial page load (fetching camera details)
  const showPageLoading = isLoadingCameras && !camera; // Show only if camera details are loading

  if (showPageLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-12rem)] space-y-4">
        <LoadingSpinner size={64} className="text-primary animate-spin-slow" />
        <p className="text-muted-foreground text-lg animate-pulse">
            Loading camera details...
        </p>
      </div>
    );
  }

  if (isErrorCameras || (!isLoadingCameras && !camera)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <Link href={backLink} passHref>
            <Button variant="outline" size="sm" className="mb-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out transform hover:-translate-y-0.5">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back to Cameras
            </Button>
        </Link>
        <Alert variant="destructive" className="max-w-lg mx-auto rounded-lg shadow-lg border-destructive/60 bg-destructive/10 backdrop-blur-sm">
           <AlertTriangle className="h-5 w-5 text-destructive stroke-[2]"/> {/* Changed icon */}
          <AlertTitle className="font-semibold text-destructive">Error Loading Camera</AlertTitle>
          <AlertDescription className="text-destructive/90">
            {isErrorCameras ? `Failed to load camera data. ${(errorCameras as Error)?.message}` : 'Camera details could not be found.'}
             <br/>Please return to the list and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Ensure camera is available before proceeding
  if (!camera) return null; // Should be handled by error state, but good practice

  const showStreamLoadingOverlay = isLoadingSearch || isInitialLoading;

  return (
    <div className="space-y-8 pb-16"> {/* Increased bottom padding */}
         {/* Back Button and Title Section */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
                {/* Enhanced icon presentation */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 text-primary border border-primary/30 shadow-md">
                    <Video className="h-8 w-8 stroke-[2]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{camera.name}</h1>
                    <p className="text-muted-foreground mt-1 line-clamp-2 max-w-prose">{camera.description}</p>
                     <Link href={backLink} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center mt-1.5 transition-colors duration-200 group">
                         <ChevronLeft className="mr-0.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" /> Back to {camera.environmentName}
                     </Link>
                </div>
            </div>
         </div>

        {/* Video Player Area with Enhanced Styling */}
        {/* Keep VideoPlayer mounted, overlay loading indicator */}
        <div className="relative aspect-video w-full max-w-5xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-border/60">
            {/* Always render VideoPlayer if we have a URL or are loading */}
            {(currentStreamUrl || showStreamLoadingOverlay) && (
                 <VideoPlayer src={currentStreamUrl || ''} /> // Pass empty string if URL is null but loading
            )}

            {/* Loading Overlay - Shown on top of the player */}
            {showStreamLoadingOverlay && (
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black/80 z-10 backdrop-blur-md transition-opacity duration-300">
                    <LoadingSpinner size={48} className="text-white/90 animate-spin-slow" />
                    <p className="mt-3 text-base font-medium animate-pulse">
                        {isLoadingSearch ? 'Searching for recording...' : 'Initializing stream...'}
                    </p>
                </div>
            )}

             {/* Placeholder/Error if URL is null AND not loading */}
             {!currentStreamUrl && !showStreamLoadingOverlay && (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-muted-foreground bg-gradient-to-br from-muted/70 to-muted/80 backdrop-blur-sm">
                     <WifiOff size={56} className="mb-3 text-muted-foreground/60 opacity-70"/>
                     <p className="text-lg font-medium">Stream Unavailable</p>
                     <p className="text-sm text-muted-foreground/80 mt-1">Could not load video feed.</p>
                 </div>
             )}
        </div>

         {/* DateTimeSearch component */}
         <div className="flex justify-center px-2">
             {/* Apply shadow and rounded corners directly */}
            <DateTimeSearch
                onSearch={handleSearch}
                isLoading={isLoadingSearch}
                // Enhanced styling for the search card
                className="w-full max-w-xl shadow-xl rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm transition-all duration-300 ease-in-out"
            />
         </div>
    </div>
  );
}
