
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCameras, getStreamUrlForTimestamp } from '@/services/stream-service';
import VideoPlayer from '@/components/features/cameras/VideoPlayer';
import DateTimeSearch from '@/components/features/cameras/DateTimeSearch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Video, ChevronLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Camera } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';


export default function CameraPlayerPage() {
  const params = useParams();
  const cameraId = params.cameraId as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null); // Ref for the video element (can still be useful)

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
      staleTime: 5 * 60 * 1000,
      retry: 1,
  });

  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

   // Effect to set the initial stream URL
   useEffect(() => {
       if (camera?.streamUrl && !currentStreamUrl && !isLoadingSearch) {
           console.log("Setting initial live stream URL:", camera.streamUrl);
           setCurrentStreamUrl(camera.streamUrl);
       } else if (!camera && !isLoadingCamera) {
           setCurrentStreamUrl(null);
       }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [camera, isLoadingCamera]);


  const backLink = camera ? `/cameras/environment/${camera.environmentId}` : '/cameras';

  // Mutation for timestamp search
  const { mutate: searchTimestamp } = useMutation({
    mutationFn: async ({ startTimestamp, endTimestamp }: { startTimestamp: number, endTimestamp: number }) => {
        if (!cameraId) throw new Error("Camera ID is missing");
        console.log(`Searching from ${startTimestamp} to ${endTimestamp} for camera ${cameraId}`);
        setIsLoadingSearch(true);
        // Reset playback state before loading new stream (browser will handle this)
        return getStreamUrlForTimestamp(cameraId, startTimestamp);
    },
    onSuccess: (newUrl) => {
        console.log("Timestamp search successful, new URL:", newUrl);
        setCurrentStreamUrl(newUrl);
        setIsLoadingSearch(false);
        toast({
          title: "Recording Found",
          description: "Loading video from the selected time.",
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
         if (camera?.streamUrl) {
             console.log("Search failed, reverting to live stream URL:", camera.streamUrl);
             setCurrentStreamUrl(camera.streamUrl);
         } else {
             setCurrentStreamUrl(null);
         }
         // Browser controls handle state
    },
  });

  const handleSearch = (startDateTime: Date, endDateTime: Date) => {
    const startTimestampInSeconds = Math.floor(startDateTime.getTime() / 1000);
    const endTimestampInSeconds = Math.floor(endDateTime.getTime() / 1000);
    searchTimestamp({ startTimestamp: startTimestampInSeconds, endTimestamp: endTimestampInSeconds });
  };


  // --- Render Logic ---

  if (isLoadingCamera) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-12rem)] space-y-4">
        <LoadingSpinner size={64} className="text-primary animate-spin-slow" />
        <p className="text-muted-foreground text-lg animate-pulse">Loading camera details...</p>
      </div>
    );
  }

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

  const showSearchLoadingOverlay = isLoadingSearch;

  return (
    <div className="space-y-6 pb-20"> {/* Adjusted spacing */}
         {/* Header Section */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
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

            {/* Timestamp Search Loading Overlay */}
            {showSearchLoadingOverlay && (
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black/80 z-10 backdrop-blur-md transition-opacity duration-300">
                    <LoadingSpinner size={48} className="text-white/90 animate-spin-slow" />
                    <p className="mt-3 text-base font-medium animate-pulse">Searching for recording...</p>
                </div>
            )}
        </div>


         {/* DateTimeSearch component */}
         <div className="flex justify-center px-2">
            <DateTimeSearch
                onSearch={handleSearch}
                isLoading={isLoadingSearch}
                className="w-full max-w-xl shadow-xl rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm transition-all duration-300 ease-in-out"
            />
         </div>
    </div>
  );
}
