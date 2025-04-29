"use client";

import React, { useState } from 'react'; // Import useState
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, ShieldCheck, Loader2 } from 'lucide-react'; // Added Loader2
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast"; // Import useToast

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth(); // Get auth loading state
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
        // Simulate async logout operation
        await new Promise(resolve => setTimeout(resolve, 500));
        logout();
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
        router.replace('/'); // Redirect to login page after logout
    } catch (error) {
        console.error("Logout error:", error);
         toast({
            title: "Logout Failed",
            description: "Could not log out. Please try again.",
            variant: "destructive",
         });
         setIsLoggingOut(false);
    }
  };


  if (authLoading) {
     return (
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }


  if (!user) {
    // Redirect if user somehow lands here without being logged in (after loading)
    if (!authLoading) {
        router.replace('/');
    }
    return null; // Render nothing while redirecting or during initial load check
  }

  const getInitials = (name: string) => {
    return name?.split(' ')?.map(n => n[0])?.join('')?.toUpperCase() || 'U';
  }

  return (
    // Center content vertically and horizontally, more padding
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)] px-4 py-10">
        {/* Enhanced card styling */}
        <Card className="w-full max-w-md shadow-xl rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="items-center text-center bg-gradient-to-b from-primary/10 to-transparent pt-8 pb-6 border-b border-border/50">
                 {/* Larger, more prominent avatar */}
                 <Avatar className="w-28 h-28 mb-5 border-[6px] border-background shadow-lg ring-2 ring-primary">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} alt={user.username} />
                    <AvatarFallback className="text-5xl bg-secondary text-secondary-foreground font-semibold border border-muted">
                        {getInitials(user.username)}
                    </AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2.5">
                    <UserIcon className="h-7 w-7"/> {user.username}
                </CardTitle>
                <CardDescription className="text-muted-foreground !mt-1">Your StreamWatch Profile</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-8 px-6 py-8">
                 {/* Account Status Section */}
                 <div className="text-center w-full p-5 bg-muted/40 rounded-lg border border-border/50">
                     <ShieldCheck className="h-7 w-7 text-primary mx-auto mb-2.5"/>
                     <p className="text-base font-medium text-foreground">Account Status: Active</p>
                     {/* You could add more details like join date, etc. */}
                     {/* <p className="text-xs text-muted-foreground mt-1">Member since: Jan 2024</p> */}
                 </div>

                 {/* Logout Button */}
                <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full max-w-xs rounded-lg py-3 text-base font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:bg-destructive/90 flex items-center justify-center gap-2"
                    disabled={isLoggingOut}
                >
                   {isLoggingOut ? (
                       <>
                           <Loader2 className="h-5 w-5 animate-spin" /> Logging Out...
                       </>
                   ) : (
                       <>
                           <LogOut className="h-5 w-5" /> Logout
                       </>
                   )}
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
