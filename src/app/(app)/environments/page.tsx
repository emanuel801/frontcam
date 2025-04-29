"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid } from 'lucide-react';

// Mock data for environments
const environments = [
  { id: 'env1', name: 'Living Room' },
  { id: 'env2', name: 'Kitchen' },
  { id: 'env3', name: 'Office' },
  { id: 'env4', name: 'Backyard' },
  { id: 'env5', name: 'Garage' },
];

export default function EnvironmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <LayoutGrid className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Environments</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {environments.map((env) => (
          <Card key={env.id} className="shadow-md hover:shadow-lg transition-shadow rounded-lg border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-primary">{env.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Manage cameras and settings for {env.name}.</p>
              {/* Add more content or actions here, e.g., link to view cameras in this environment */}
            </CardContent>
          </Card>
        ))}
      </div>

       <div className="mt-8 p-4 bg-muted/50 rounded-md border border-border text-center">
          <p className="text-muted-foreground text-sm">
              This section is under development. Soon you'll be able to group cameras by environment.
          </p>
       </div>
    </div>
  );
}
