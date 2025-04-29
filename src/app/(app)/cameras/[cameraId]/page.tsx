
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCameras, getStreamUrlForTimestamp } from '@/services/stream-service';
import VideoPlayer from '@/components/features/cameras/VideoPlayer';
import DateTimeSearch from '@/components/features/cameras/DateTimeSearch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Video, ChevronLeft, AlertTriangle, RefreshCw, Clock, RadioTower } from 'lucide-react';
import type { Camera } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // To display timestamp

export default function CameraPlayerPage() {
  const params = useParams();
  const cameraId = params.cameraId as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch camera data
  const { data: camera, isLoading: isLoadingCamera, isError: isErrorCamera, error: errorCamera, refetch: refetchCamera } = useQuery<Camera | undefined>({
      queryKey: ['camera', cameraId],
      queryFn: async () => {
          const cameras = await queryClient.fetchQuery<Camera[]>({ queryKey: ['cameras'], queryFn: getCameras });
          const foundCamera = cameras?.find(c => c.id === cameraId);
          if (!foundCamera) {
              throw new Error(`Camera with ID ${cameraId} not found.`);
          }
          return foundCamera;
      },
      enabled: !!cameraId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
  });

  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [searchedTimestamp, setSearchedTimestamp] = useState<Date | null>(null); // Track start time of searched recording

   // Effect to set the initial stream URL (Live feed)
   useEffect(() => {
       if (camera?.streamUrl && !currentStreamUrl && !searchedTimestamp && !isLoadingSearch) {
           console.log("Setting initial live stream URL:", camera.streamUrl);
           setCurrentStreamUrl(camera.streamUrl);
           setSearchedTimestamp(null); // Ensure we are in live mode
       } else if (!camera && !isLoadingCamera) {
           setCurrentStreamUrl(null);
       }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [camera, isLoadingCamera]);


  const backLink = camera ? `/cameras/environment/${camera.environmentId}` : '/cameras';

  // Mutation for timestamp search (still uses single timestamp for now)
  const { mutate: searchTimestampMutation } = useMutation({
    mutationFn: async ({ timestamp }: { timestamp: number }) => { // Still uses single timestamp
        if (!cameraId) throw new Error("Camera ID is missing");
        console.log(`Searching for timestamp ${timestamp} for camera ${cameraId}`);
        setIsLoadingSearch(true);
        // Reset playback state before loading new stream (browser will handle this)
        // NOTE: In a real implementation, the backend would handle the time range.
        // Here, we just use the start timestamp for demonstration.
        return getStreamUrlForTimestamp(cameraId, timestamp);
    },
    onSuccess: (newUrl, variables) => {
        console.log("Timestamp search successful, new URL:", newUrl);
        setCurrentStreamUrl(newUrl);
        // Convert seconds back to Date object for display (using the start timestamp)
        const timestampDate = new Date(variables.timestamp * 1000);
        setSearchedTimestamp(timestampDate);
        setIsLoadingSearch(false);
        toast({
          title: "Recording Found",
          description: `Loading video from ${format(timestampDate, 'PPpp')}.`, // Displaying start time
          className: "bg-green-100 border-green-300 text-green-800",
        });
         // Browser controls will handle play state
         setTimeout(() => {
            videoRef.current?.play().catch(err => console.warn("Autoplay after search prevented:", err));
        }, 500);
    },
    onError: (error) => {
        console.error('Error fetching stream URL for timestamp:', error);
         toast({
            title: "Search Error",
            description: `Failed to find recording: ${(error as Error).message}. Reverting to live feed.`,
            variant: "destructive",
         });
         setIsLoadingSearch(false);
         // Revert to live feed
         if (camera?.streamUrl) {
             console.log("Search failed, reverting to live stream URL:", camera.streamUrl);
             setCurrentStreamUrl(camera.streamUrl);
             setSearchedTimestamp(null); // Back to live mode
         } else {
             setCurrentStreamUrl(null);
         }
         // Browser controls handle state
    },
  });

  // Updated handleSearch to accept start and end dateTime, but currently only uses start.
  const handleSearch = (startDateTime: Date, endDateTime: Date) => {
    console.log(`Search requested for range: ${startDateTime} - ${endDateTime}`);
    // TODO: In a real application, you would likely pass both start and end timestamps
    // to the backend mutation. For now, we only use the start time for getStreamUrlForTimestamp.
    const startTimestampInSeconds = Math.floor(startDateTime.getTime() / 1000);
    searchTimestampMutation({ timestamp: startTimestampInSeconds });
  };

   const switchToLive = () => {
      if (camera?.streamUrl) {
          console.log("Switching back to live stream.");
          setCurrentStreamUrl(camera.streamUrl);
          setSearchedTimestamp(null);
          toast({
              title: "Live Feed",
              description: "Switched back to the live camera feed.",
          });
           // Let browser controls manage play state
           setTimeout(() => {
                videoRef.current?.play().catch(err => console.warn("Autoplay after switch to live prevented:", err));
           }, 500);
      }
   };


  // --- Render Logic ---

  if (isLoadingCamera) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-12rem)] space-y-4">
        {/* Enhanced loading state */}
        <LoadingSpinner size={64} className="text-primary animate-spin-slow" />
        <p className="text-muted-foreground text-lg animate-pulse">Loading camera details...</p>
      </div>
    );
  }

  if (isErrorCamera || !camera) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <Link href={backLink} passHref>
            {/* Enhanced back button */}
            <Button variant="outline" size="sm" className="mb-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out transform hover:-translate-y-0.5">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back to Cameras
            </Button>
        </Link>
        {/* Enhanced error alert */}
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

  const showSearchLoadingOverlay = isLoadingSearch;
  const isLive = !searchedTimestamp; // Determine if currently viewing live feed

  return (
    <div className="space-y-6 pb-20"> {/* Adjusted spacing */}
         {/* Enhanced Header Section */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
                {/* Icon with gradient background and border */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 text-primary border border-primary/30 shadow-md">
                    <Video className="h-8 w-8 stroke-[2]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{camera.name}</h1>
                    <p className="text-muted-foreground mt-1 line-clamp-2 max-w-prose">{camera.description}</p>
                     {/* Enhanced Back link */}
                     <Link href={backLink} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center mt-1.5 transition-colors duration-200 group">
                         <ChevronLeft className="mr-0.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" /> Back to {camera.environmentName}
                     </Link>
                </div>
            </div>
         </div>

         {/* Enhanced Status Indicator (Live or Recording Time) */}
         <div className="flex justify-start mb-3">
             {/* Using Tailwind classes for background, color, shadow, and rounded corners */}
             <div className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md",
                isLive ? "bg-red-600/80 text-white" : "bg-blue-600/80 text-white"
             )}>
                {isLive ? (
                    <>
                       <RadioTower className="h-3.5 w-3.5 animate-pulse" /> LIVE
                    </>
                ) : (
                   <>
                       <Clock className="h-3.5 w-3.5" /> Recording: {searchedTimestamp ? format(searchedTimestamp, 'dd/MM/yyyy HH:mm') : '...'} {/* Updated format */}
                   </>
                )}
             </div>
         </div>

        {/* Enhanced Video Player Area */}
        <div className="relative aspect-video w-full max-w-5xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-border/60">
            {/* Status Indicator Removed from here */}

            {currentStreamUrl ? (
                 <VideoPlayer
                    key={currentStreamUrl} // Force re-mount on URL change
                    src={currentStreamUrl}
                    videoRef={videoRef} // Pass the ref
                    controls={true} // Use default browser controls
                 />
            ) : (
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-muted-foreground bg-gradient-to-br from-muted/70 to-muted/80 backdrop-blur-sm">
                     <WifiOff size={56} className="mb-3 text-muted-foreground/60 opacity-70"/>
                     <p className="text-lg font-medium">Stream Unavailable</p>
                     <p className="text-sm text-muted-foreground/80 mt-1">Waiting for stream details...</p>
                 </div>
            )}

            {/* Enhanced Timestamp Search Loading Overlay */}
            {showSearchLoadingOverlay && (
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black/80 z-10 backdrop-blur-md transition-opacity duration-300">
                    <LoadingSpinner size={48} className="text-white/90 animate-spin-slow" />
                    <p className="mt-3 text-base font-medium animate-pulse">Searching for recording...</p>
                </div>
            )}
        </div>

         {/* Enhanced "Go Live" Button */}
         {!isLive && (
             <div className="flex justify-center mt-4">
                 <Button
                     onClick={switchToLive}
                     variant="outline"
                     size="sm"
                     className="rounded-lg shadow-md transition-all hover:shadow-lg hover:bg-primary/10 border-primary/50 text-primary flex items-center gap-1.5"
                     disabled={isLoadingSearch}
                 >
                     <RadioTower className="h-4 w-4" /> Go Live
                 </Button>
             </div>
         )}

         {/* Enhanced DateTimeSearch component styling */}
         <div className="flex justify-center px-2 mt-4">
            <DateTimeSearch
                onSearch={handleSearch}
                isLoading={isLoadingSearch}
                // Added shadow, rounded corners, border, background blur, and transition
                className="w-full max-w-xl shadow-xl rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm transition-all duration-300 ease-in-out"
            />
         </div>
    </div>
  );
}
