
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, PlusCircle, ArrowLeft } from 'lucide-react'; // Icons

export default function AdminEnvironmentsPage() {
   // TODO: Implement environment fetching and management logic (CRUD operations)

  return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center space-x-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Home className="h-6 w-6" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-primary">Environment Management</h1>
                <p className="text-muted-foreground text-sm">Add, edit, or remove environments.</p>
            </div>
        </div>
         <Link href="/admin" passHref>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
               <ArrowLeft className="h-4 w-4"/> Back to Dashboard
            </Button>
         </Link>
      </div>

       <Card>
         <CardHeader className="flex flex-row items-center justify-between">
             <div>
                <CardTitle>Environment List</CardTitle>
                <CardDescription>List of defined environments.</CardDescription>
             </div>
             <Button size="sm" className="flex items-center gap-1.5">
                <PlusCircle className="h-4 w-4"/> Add Environment
             </Button>
         </CardHeader>
         <CardContent>
           {/* Placeholder for environment table or list */}
           <div className="border border-dashed border-border rounded-lg p-8 text-center">
             <p className="text-muted-foreground">Environment management table/list will be displayed here.</p>
              <p className="text-xs text-muted-foreground mt-2">(Functionality to be implemented)</p>
           </div>
         </CardContent>
       </Card>
     </div>
  );
}
