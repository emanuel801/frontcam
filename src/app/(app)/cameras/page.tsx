"use client";
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getCameras } from '@/services/stream-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

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
       <h1 className="text-3xl font-bold text-primary">Available Cameras</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {cameras?.map((camera) => (
          <Link href={`/cameras/${camera.id}`} key={camera.id} passHref>
            <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full flex flex-col">
              <CardHeader className="relative h-48 w-full p-0">
                 <Image
                  src={camera.imageUrl || 'https://picsum.photos/400/300'} // Fallback image
                  alt={camera.name}
                  layout="fill"
                  objectFit="cover"
                  className="transition-transform duration-300 group-hover:scale-105"
                 />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </CardHeader>
              <CardContent className="p-4 flex-grow flex flex-col justify-between">
                 <div>
                  <CardTitle className="text-lg font-semibold mb-1 text-primary">{camera.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">{camera.description}</CardDescription>
                 </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
