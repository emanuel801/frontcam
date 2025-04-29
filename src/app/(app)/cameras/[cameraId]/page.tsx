
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCameras, getStreamUrlForTimestamp } from '@/services/stream-service';
import VideoPlayer from '@/components/features/cameras/VideoPlayer';
import DateTimeSearch from '@/components/features/cameras/DateTimeSearch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Video, ChevronLeft, AlertTriangle, RefreshCw } from 'lucide-react'; // Added RefreshCw
import type { Camera } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

export default function CameraPlayerPage() {
  const params = useParams();
  const cameraId = params.cameraId as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch camera data to get details including environmentId and initial stream URL
  const { data: camera, isLoading: isLoadingCamera, isError: isErrorCamera, error: errorCamera, refetch: refetchCamera } = useQuery<Camera | undefined>({
      queryKey: ['camera', cameraId],
      queryFn: async () => {
          // Fetch all cameras and find the specific one.
          // In a real API, you'd fetch only the specific camera by ID.
          const cameras = await queryClient.fetchQuery<Camera[]>({ queryKey: ['cameras'], queryFn: getCameras });
          const foundCamera = cameras?.find(c => c.id === cameraId);
          if (!foundCamera) {
              throw new Error(`Camera with ID ${cameraId} not found.`);
          }
          return foundCamera;
      },
      enabled: !!cameraId,
      staleTime: 5 * 60 * 1000, // Stale after 5 minutes
      retry: 1, // Retry once on error
  });

  // State for the *currently displayed* stream URL (can be live or recording)
  // Initialize with the live URL if camera data is available
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  // State for loading indicator during timestamp search ONLY
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

   // Effect to set the initial stream URL when camera data loads or changes
   useEffect(() => {
       if (camera?.streamUrl && !currentStreamUrl && !isLoadingSearch) { // Don't reset to live if a search is loading/succeeded
           console.log("Setting initial live stream URL:", camera.streamUrl);
           setCurrentStreamUrl(camera.streamUrl); // Set to live stream initially
       }
       // If camera data becomes null/undefined (e.g., error), clear the URL
       else if (!camera && !isLoadingCamera) {
           setCurrentStreamUrl(null);
       }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [camera, isLoadingCamera]); // Run when camera data or loading state changes, but respect search results

  // Determine the correct back link based on camera's environment
  const backLink = camera ? `/cameras/environment/${camera.environmentId}` : '/cameras';

  // Mutation for fetching stream URL based on timestamp
  const { mutate: searchTimestamp } = useMutation({
    // Update mutation function signature to accept start and end timestamps
    mutationFn: async ({ startTimestamp, endTimestamp }: { startTimestamp: number, endTimestamp: number }) => {
        if (!cameraId) throw new Error("Camera ID is missing");
        // Log both timestamps for potential future use, but current service only uses start
        console.log(`Searching from ${startTimestamp} to ${endTimestamp} for camera ${cameraId}`);
        setIsLoadingSearch(true);
        // Keep the current video player visible but show overlay
        // Pass only the start timestamp for now as per current service
        return getStreamUrlForTimestamp(cameraId, startTimestamp);
    },
    onSuccess: (newUrl) => {
        console.log("Timestamp search successful, new URL:", newUrl);
        setCurrentStreamUrl(newUrl); // Update the URL, VideoPlayer will re-initialize
        setIsLoadingSearch(false);
        toast({
          title: "Recording Found",
          description: "Loading video from the selected time.",
          className: "bg-green-100 border-green-300 text-green-800",
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
         if (camera?.streamUrl) {
             console.log("Search failed, reverting to live stream URL:", camera.streamUrl);
             setCurrentStreamUrl(camera.streamUrl);
         } else {
             console.log("Search failed, camera data not available to revert.");
             setCurrentStreamUrl(null); // Set to null if no camera data
         }
    },
  });


  // Updated handleSearch to accept start and end dates
  const handleSearch = (startDateTime: Date, endDateTime: Date) => {
    const startTimestampInSeconds = Math.floor(startDateTime.getTime() / 1000);
    const endTimestampInSeconds = Math.floor(endDateTime.getTime() / 1000);
    searchTimestamp({ startTimestamp: startTimestampInSeconds, endTimestamp: endTimestampInSeconds });
  };

  // Show loading spinner for the initial camera detail fetch
  if (isLoadingCamera) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-12rem)] space-y-4">
        <LoadingSpinner size={64} className="text-primary animate-spin-slow" />
        <p className="text-muted-foreground text-lg animate-pulse">
            Loading camera details...
        </p>
      </div>
    );
  }

  // Show error if fetching camera details failed
  if (isErrorCamera || !camera) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <Link href={backLink} passHref>
            <Button variant="outline" size="sm" className="mb-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out transform hover:-translate-y-0.5">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back to Cameras
            </Button>
        </Link>
        <Alert variant="destructive" className="max-w-lg mx-auto rounded-lg shadow-lg border-destructive/60 bg-destructive/10 backdrop-blur-sm">
           <AlertTriangle className="h-5 w-5 text-destructive stroke-[2]"/>
          <AlertTitle className="font-semibold text-destructive">Error Loading Camera</AlertTitle>
          <AlertDescription className="text-destructive/90">
            {isErrorCamera ? `Failed to load camera data: ${(errorCamera as Error)?.message}` : 'Camera details could not be found.'}
             <br/>Please return to the list and try again, or try refreshing.
             {isErrorCamera && (
                  <Button variant="secondary" size="sm" onClick={() => refetchCamera()} className="mt-3">
                      <RefreshCw className="mr-2 h-4 w-4" /> Retry
                  </Button>
             )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading overlay specifically for the timestamp search action
  const showSearchLoadingOverlay = isLoadingSearch;

  return (
    <div className="space-y-8 pb-20"> {/* Reduced bottom padding slightly */}
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

        {/* Video Player Area */}
        <div className="relative aspect-video w-full max-w-5xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-border/60">
            {/* Render VideoPlayer if we have a URL (let it handle its own internal loading state) */}
            {currentStreamUrl ? (
                 <VideoPlayer key={currentStreamUrl} src={currentStreamUrl} /> // Use key to force re-mount on URL change
            ) : (
                 // Show placeholder if URL is null (e.g., initial load error before URL is set)
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-muted-foreground bg-gradient-to-br from-muted/70 to-muted/80 backdrop-blur-sm">
                     <WifiOff size={56} className="mb-3 text-muted-foreground/60 opacity-70"/>
                     <p className="text-lg font-medium">Stream Unavailable</p>
                     <p className="text-sm text-muted-foreground/80 mt-1">Waiting for stream details...</p>
                 </div>
            )}

            {/* Timestamp Search Loading Overlay - Shown on top of the player */}
            {showSearchLoadingOverlay && (
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black/80 z-10 backdrop-blur-md transition-opacity duration-300">
                    <LoadingSpinner size={48} className="text-white/90 animate-spin-slow" />
                    <p className="mt-3 text-base font-medium animate-pulse">
                        Searching for recording...
                    </p>
                </div>
            )}

        </div>

         {/* DateTimeSearch component */}
         <div className="flex justify-center px-2">
            <DateTimeSearch
                onSearch={handleSearch}
                isLoading={isLoadingSearch} // Pass the search loading state
                className="w-full max-w-xl shadow-xl rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm transition-all duration-300 ease-in-out"
            />
         </div>
    </div>
  );
}

