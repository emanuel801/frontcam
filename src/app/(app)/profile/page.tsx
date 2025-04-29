"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, ShieldCheck } from 'lucide-react'; // Added ShieldCheck icon
import { useRouter } from 'next/navigation';


export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/'); // Redirect to login page after logout
  };


  if (!user) {
     // This should ideally not happen due to the layout check, but added as a safeguard
     // You might want to redirect here as well, or show a loading state from context
    return (
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
            <p>Loading profile or please log in.</p>
        </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }

  return (
    // Added pt-8 for more top padding on mobile
    <div className="flex justify-center items-start pt-8 px-4">
        <Card className="w-full max-w-md shadow-lg rounded-lg border border-border">
            <CardHeader className="items-center text-center pt-6 pb-4">
                 <Avatar className="w-24 h-24 mb-4 border-4 border-primary shadow-md">
                    {/* Using a generic security avatar or user-specific one */}
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} alt={user.username} />
                    <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground border border-muted">
                        {getInitials(user.username)}
                    </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                    <UserIcon className="h-6 w-6"/> {user.username}
                </CardTitle>
                <CardDescription className="text-muted-foreground">Manage your StreamWatch account.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 px-6 pb-6">
                 {/* Example Section - could add more details here */}
                 <div className="text-center w-full p-4 bg-muted/50 rounded-md border border-border">
                     <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-2"/>
                     <p className="text-sm text-muted-foreground">Account status: Active</p>
                     {/* <p>User ID: {user.id}</p> */}
                 </div>

                <Button onClick={handleLogout} variant="destructive" className="w-full max-w-xs rounded-md shadow hover:shadow-md transition-shadow">
                   <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
