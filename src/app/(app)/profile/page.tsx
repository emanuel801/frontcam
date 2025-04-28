"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';
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
    return <p>Please log in to view your profile.</p>;
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  }

  return (
    <div className="flex justify-center items-start pt-10">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="items-center text-center">
                 <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} alt={user.username} />
                    <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
                        {getInitials(user.username)}
                    </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl font-bold text-primary">{user.username}</CardTitle>
                <CardDescription>Welcome to your StreamWatch profile.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                 {/* Add more profile details here if needed */}
                 {/* <p>User ID: {user.id}</p> */}
                <Button onClick={handleLogout} variant="destructive" className="w-full max-w-xs">
                   <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
