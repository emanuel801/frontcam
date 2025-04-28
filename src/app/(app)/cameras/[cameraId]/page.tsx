"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCameras, getStreamUrlForTimestamp } from '@/services/stream-service';
import VideoPlayer from '@/components/features/cameras/VideoPlayer';
import DateTimeSearch from '@/components/features/cameras/DateTimeSearch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import type { Camera } from '@/types';

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
            setCurrentStreamUrl(camera.streamUrl); // Set initial stream URL
        }
    }, [camera, currentStreamUrl]);


  // Mutation for fetching stream URL based on timestamp
  const { mutate: searchTimestamp } = useMutation({
    mutationFn: async ({ timestamp }: { timestamp: number }) => {
        setIsLoadingSearch(true);
        return getStreamUrlForTimestamp(cameraId, timestamp);
    },
    onSuccess: (newUrl) => {
        setCurrentStreamUrl(newUrl);
        setIsLoadingSearch(false);
    },
    onError: (error) => {
        console.error('Error fetching stream URL for timestamp:', error);
         // Optionally show a toast or error message to the user
         alert(`Error searching for video: ${(error as Error).message}`);
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
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (isErrorCameras || !camera) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
           <WifiOff className="h-4 w-4"/>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {isErrorCameras ? `Failed to load camera data. ${(errorCameras as Error)?.message}` : 'Camera not found.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <h1 className="text-3xl font-bold text-primary">{camera.name}</h1>
       <p className="text-muted-foreground">{camera.description}</p>

        <div className="aspect-video w-full max-w-4xl mx-auto bg-black rounded-lg overflow-hidden shadow-lg">
            {currentStreamUrl ? (
                <VideoPlayer src={currentStreamUrl} />
            ) : (
                 <div className="flex justify-center items-center h-full text-muted-foreground">
                    {isLoadingSearch ? <LoadingSpinner size={32} /> : 'Loading stream...'}
                </div>
            )}
        </div>

      <DateTimeSearch onSearch={handleSearch} isLoading={isLoadingSearch} />
    </div>
  );
}
