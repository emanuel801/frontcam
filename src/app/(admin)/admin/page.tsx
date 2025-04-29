
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Camera, Home, LayoutDashboard } from 'lucide-react'; // Icons for dashboard items

export default function AdminDashboardPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !isAdmin) {
      // If not loading and not an admin, redirect away
      router.replace('/cameras'); // Redirect to standard camera view
    }
  }, [loading, isAdmin, router]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  if (!isAdmin) {
    // Render nothing while redirecting
    return null;
  }

  // Admin user is confirmed, render dashboard
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
       <div className="flex items-center space-x-4 mb-6 border-b border-border pb-4">
         <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <LayoutDashboard className="h-8 w-8" />
         </div>
         <div>
             <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Dashboard</h1>
             <p className="text-muted-foreground mt-1">Manage users, environments, and cameras.</p>
         </div>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Users Management Card */}
        <Link href="/admin/users" passHref legacyBehavior>
            <a className="group block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer rounded-xl border border-border/60 hover:border-primary/50 transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold text-primary">Users</CardTitle>
                    <Users className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                    <CardDescription>Manage user accounts and permissions.</CardDescription>
                    {/* Optionally add count or other stats here */}
                </CardContent>
                </Card>
            </a>
        </Link>

        {/* Environments Management Card */}
         <Link href="/admin/environments" passHref legacyBehavior>
             <a className="group block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer rounded-xl border border-border/60 hover:border-primary/50 transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold text-primary">Environments</CardTitle>
                    <Home className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                    <CardDescription>Add, edit, or remove camera environments.</CardDescription>
                </CardContent>
                </Card>
            </a>
        </Link>

        {/* Cameras Management Card */}
         <Link href="/admin/cameras" passHref legacyBehavior>
            <a className="group block">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer rounded-xl border border-border/60 hover:border-primary/50 transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold text-primary">Cameras</CardTitle>
                    <Camera className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardHeader>
                <CardContent>
                    <CardDescription>Manage camera details and stream URLs.</CardDescription>
                </CardContent>
                </Card>
            </a>
         </Link>
      </div>
    </div>
  );
}
