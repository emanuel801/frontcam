"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Home } from 'lucide-react'; // Added Home icon for environments
import Image from 'next/image';

// Mock data for environments - Replace with actual data fetching later
const environments = [
  { id: 'env1', name: 'Living Room', description: 'Main communal area with TV and seating.', imageUrl: 'https://picsum.photos/seed/env1/300/200' },
  { id: 'env2', name: 'Kitchen', description: 'Cooking and dining space.', imageUrl: 'https://picsum.photos/seed/env2/300/200' },
  { id: 'env3', name: 'Office', description: 'Dedicated workspace area.', imageUrl: 'https://picsum.photos/seed/env3/300/200' },
  { id: 'env4', name: 'Backyard', description: 'Outdoor space with garden and patio.', imageUrl: 'https://picsum.photos/seed/env4/300/200' },
  { id: 'env5', name: 'Garage', description: 'Parking and storage area.', imageUrl: 'https://picsum.photos/seed/env5/300/200' },
  { id: 'env6', name: 'Master Bedroom', description: 'Primary sleeping quarters.', imageUrl: 'https://picsum.photos/seed/env6/300/200' },
];

export default function EnvironmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <LayoutGrid className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Manage Environments</h1>
      </div>

      {/* List of environments */}
      <div className="space-y-4">
        {environments.map((env) => (
          <Card key={env.id} className="shadow-md hover:shadow-lg transition-shadow rounded-lg border border-border overflow-hidden">
            <div className="flex items-start sm:items-center p-4 space-x-4">
              {/* Environment Image */}
              <div className="relative w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                <Image
                  src={env.imageUrl}
                  alt={`Image of ${env.name}`}
                  layout="fill"
                  objectFit="cover"
                   unoptimized // Use if picsum causes issues or for performance
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                 <div className="absolute bottom-1 left-1 p-1 bg-black/50 rounded">
                    <Home className="h-4 w-4 text-white/90"/>
                 </div>
              </div>

              {/* Environment Details */}
              <div className="flex-grow">
                <CardTitle className="text-lg sm:text-xl font-semibold text-primary mb-1">{env.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">{env.description}</CardDescription>
                {/* Future actions could go here, e.g., Edit button */}
                {/*
                <div className="mt-3">
                    <Button variant="outline" size="sm">View Cameras</Button>
                </div>
                 */}
              </div>
            </div>
          </Card>
        ))}
      </div>

       <div className="mt-8 p-4 bg-muted/50 rounded-md border border-border text-center">
          <p className="text-muted-foreground text-sm">
              You can group your cameras within these environments for better organization. (Functionality coming soon).
          </p>
       </div>
    </div>
  );
}
