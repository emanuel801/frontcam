"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCameras, getStreamUrlForTimestamp } from '@/services/stream-service';
import VideoPlayer from '@/components/features/cameras/VideoPlayer';
import DateTimeSearch from '@/components/features/cameras/DateTimeSearch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Video } from 'lucide-react'; // Added Video icon
import type { Camera } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function CameraPlayerPage() {
  const params = useParams();
  const cameraId = params.cameraId as string;
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

   // Fetch initial camera data to get the default stream URL
  const { data: cameras, isLoading: isLoadingCameras, isError: isErrorCameras, error: errorCameras } = useQuery<Camera[]>({
      queryKey: ['cameras'],
      queryFn: getCameras,
      staleTime: Infinity, // Cache indefinitely as it's unlikely to change often within the player view
      enabled: !!cameraId, // Only run if cameraId is available
  });

   // Find the specific camera details
   const camera = cameras?.find(c => c.id === cameraId);

   useEffect(() => {
        if (camera && !currentStreamUrl) {
            // Simulate loading the initial stream if it's not immediately available
            // Or directly set if streamUrl is the live feed URL
            setTimeout(() => setCurrentStreamUrl(camera.streamUrl), 300); // Small delay to show initial loading
        }
    }, [camera, currentStreamUrl]);


  // Mutation for fetching stream URL based on timestamp
  const { mutate: searchTimestamp } = useMutation({
    mutationFn: async ({ timestamp }: { timestamp: number }) => {
        setIsLoadingSearch(true);
        // Add a slight delay to simulate network latency for search
        await new Promise(resolve => setTimeout(resolve, 500));
        return getStreamUrlForTimestamp(cameraId, timestamp);
    },
    onSuccess: (newUrl) => {
        setCurrentStreamUrl(null); // Clear current URL to show loading
        setTimeout(() => setCurrentStreamUrl(newUrl), 100); // Set new URL after a brief pause
        setIsLoadingSearch(false);
    },
    onError: (error) => {
        console.error('Error fetching stream URL for timestamp:', error);
         // Use toast or a more user-friendly error display
         alert(`Error searching for video: ${(error as Error).message}. Please try again.`);
         setIsLoadingSearch(false);
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

  if (isLoadingCameras) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-10rem)] space-y-4">
        <LoadingSpinner size={48} />
        <p className="text-muted-foreground">Loading camera details...</p>
      </div>
    );
  }

  if (isErrorCameras || !camera) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <Link href="/cameras" passHref>
            <Button variant="outline" className="mb-4">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Cameras
            </Button>
        </Link>
        <Alert variant="destructive" className="max-w-md mx-auto">
           <WifiOff className="h-4 w-4"/>
          <AlertTitle>Error Loading Camera</AlertTitle>
          <AlertDescription>
            {isErrorCameras ? `Failed to load camera data. ${(errorCameras as Error)?.message}` : 'Camera not found.'}
             Please go back and select another camera.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    // Increased vertical spacing with space-y-6
    <div className="space-y-6 pb-8">
         <Link href="/cameras" passHref>
            <Button variant="outline" size="sm" className="mb-2">
                <ChevronLeft className="mr-1 h-4 w-4" /> All Cameras
            </Button>
        </Link>
       <div className="flex items-center space-x-3">
            <Video className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">{camera.name}</h1>
                <p className="text-sm md:text-base text-muted-foreground">{camera.description}</p>
            </div>
       </div>

        {/* Adjusted aspect ratio for better mobile view, max width */}
        <div className="relative aspect-video w-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden shadow-xl border border-border">
            {(isLoadingSearch || !currentStreamUrl) ? (
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-muted-foreground bg-black/50">
                    <LoadingSpinner size={32} />
                    <p className="mt-2 text-sm">{isLoadingSearch ? 'Searching for recording...' : 'Initializing stream...'}</p>
                </div>
            ) : null}
             {/* Render VideoPlayer only when URL is ready and not searching */}
            {currentStreamUrl && !isLoadingSearch && (
                 <VideoPlayer src={currentStreamUrl} />
            )}

        </div>
         {/* DateTimeSearch component centered */}
         <div className="flex justify-center">
            <DateTimeSearch onSearch={handleSearch} isLoading={isLoadingSearch} />
         </div>
    </div>
  );
}
