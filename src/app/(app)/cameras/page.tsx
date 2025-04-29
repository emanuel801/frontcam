"use client";
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCameras } from '@/services/stream-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Video } from 'lucide-react'; // Added Video icon for visual cue

export default function CameraListPage() {
  const { data: cameras, isLoading, isError, error } = useQuery({
      queryKey: ['cameras'],
      queryFn: getCameras,
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
            Failed to load cameras. Please check your connection and try again. {(error as Error)?.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-6">
       <div className="flex items-center space-x-2">
         <Video className="h-8 w-8 text-primary" />
         <h1 className="text-3xl font-bold text-primary">Available Cameras</h1>
       </div>
      {/* Adjusted grid columns for better mobile responsiveness */}
      <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
        {cameras?.map((camera) => (
          <Link href={`/cameras/${camera.id}`} key={camera.id} passHref legacyBehavior>
            <a className="group block"> {/* Use anchor tag for better semantics and group for hover effects */}
                <Card className="overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col bg-card border border-border hover:border-primary">
                <CardHeader className="relative h-40 w-full p-0"> {/* Slightly reduced height */}
                    <Image
                    src={camera.imageUrl || 'https://picsum.photos/300/200'} // Adjusted placeholder size
                    alt={camera.name}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                     {/* Optional: Add a play icon overlay on hover */}
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
    </div>
  );
}
