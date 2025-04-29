"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, ShieldCheck, Loader2, Mail, PackageCheck, UserCircle2 } from 'lucide-react'; // Added Mail, PackageCheck, UserCircle2
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator'; // Added Separator

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
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

  const getInitials = (name: string | undefined) => {
    // Handle potential undefined name
    return name?.split(' ')?.map(n => n[0])?.join('')?.toUpperCase() || user.username.charAt(0).toUpperCase() || 'U';
  }

  return (
    // Center content vertically and horizontally, more padding
    <div className="flex justify-center items-start min-h-[calc(100vh-8rem)] px-4 py-10"> {/* Changed items-center to items-start */}
        {/* Enhanced card styling: added shadow, rounded corners, border, bg-blur */}
        <Card className="w-full max-w-md shadow-xl rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="items-center text-center bg-gradient-to-b from-primary/10 to-transparent pt-8 pb-6 border-b border-border/50">
                 {/* Larger, more prominent avatar with border and ring */}
                 <Avatar className="w-28 h-28 mb-5 border-[6px] border-background shadow-lg ring-2 ring-primary">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} alt={user.name || user.username} />
                    <AvatarFallback className="text-5xl bg-secondary text-secondary-foreground font-semibold border border-muted">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                {/* Display Name if available, otherwise username, added icon */}
                <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2.5">
                   <UserCircle2 className="h-7 w-7"/> {user.name || user.username}
                </CardTitle>
                {/* Display Username if Name is displayed */}
                {user.name && <CardDescription className="text-muted-foreground !mt-1">@{user.username}</CardDescription>}
                <CardDescription className="text-muted-foreground !mt-1">Your StreamWatch Profile</CardDescription>
            </CardHeader>
            <CardContent className="px-6 py-8 space-y-6"> {/* Reduced space-y */}
                 {/* User Details Section */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-center mb-4 text-primary border-b pb-2">Account Information</h3>
                    <div className="flex items-center gap-3 text-sm">
                         <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0"/>
                         <span className="text-muted-foreground">Email:</span>
                         <span className="font-medium text-foreground truncate">{user.email || 'Not Provided'}</span>
                    </div>
                     <Separator className="my-3"/>
                    <div className="flex items-center gap-3 text-sm">
                         <PackageCheck className="h-5 w-5 text-muted-foreground flex-shrink-0"/>
                         <span className="text-muted-foreground">Plan:</span>
                         <span className="font-medium text-foreground">{user.plan || 'Basic'}</span>
                    </div>
                    <Separator className="my-3"/>
                     <div className="flex items-center gap-3 text-sm">
                         <ShieldCheck className="h-5 w-5 text-muted-foreground flex-shrink-0"/>
                         <span className="text-muted-foreground">Status:</span>
                         <span className="font-medium text-green-600">Active</span>
                     </div>
                 </div>

                 {/* Logout Button - Moved to CardFooter */}

            </CardContent>
             <CardFooter className="px-6 pb-8 pt-4 border-t border-border/50">
                 {/* Enhanced Logout Button styling */}
                 <Button
                    onClick={handleLogout}
                    variant="destructive"
                    className="w-full rounded-lg py-3 text-base font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:bg-destructive/90 flex items-center justify-center gap-2"
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
            </CardFooter>
        </Card>
    </div>
  );
}
