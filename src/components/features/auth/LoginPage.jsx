"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { LogIn, ShieldCheck, Loader2 } from 'lucide-react'; // Changed icon, added Loader2
import { useRouter } from 'next/navigation'; // Import useRouter

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Get router instance

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Basic validation
    if (!username || !password) {
       toast({
        title: "Error",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // Replace with actual authentication logic
      // For demo: hardcode credentials
      if ((username === 'testuser' || username === 'user') && password === 'password') {
        login(username); // Call login (no role returned)
         toast({
          title: "Welcome!",
          description: "Logged in successfully.",
        });
        // Always redirect to cameras page
        router.replace('/cameras');
        // No need to set isLoading to false here, as redirection happens
      } else {
         toast({
          title: "Login Failed",
          description: "Invalid username or password.",
          variant: "destructive",
        });
         setIsLoading(false); // Only set loading false on failure
      }
    }, 1000);
  };

  return (
    // Changed background gradient direction and colors slightly
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background via-muted/30 to-background px-4 py-12">
        {/* Enhanced card shadow and subtle border, added background blur and adjusted bg color */}
      <Card className="w-full max-w-sm shadow-xl rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm overflow-hidden">
        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          {/* Larger icon, primary color */}
          <ShieldCheck className="mx-auto h-14 w-14 text-primary mb-3" />
          <CardTitle className="text-3xl font-bold text-primary">StreamWatch</CardTitle>
          <CardDescription className="text-muted-foreground !mt-1">Secure access to your cameras</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g., user" // Updated placeholder (removed admin example)
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                aria-label="Username"
                className="rounded-lg focus:border-primary" // Rounded, focus style
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password"  className="font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (use 'password')" // Updated placeholder
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
                className="rounded-lg focus:border-primary" // Rounded, focus style
                autoComplete="current-password"
              />
            </div>
            {/* Enhanced button styling with shadow and transition */}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-3 text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-primary/30" disabled={isLoading}>
             {isLoading ? (
                <>
                    {/* Use Loader2 for a better spinning animation */}
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                </>
                ) : (
                <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                </>
                )}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4 pb-6"> {/* Adjusted padding */}
            <p>Demo: Use <code className="font-mono bg-muted px-1.5 py-0.5 rounded-sm">user</code> / <code className="font-mono bg-muted px-1.5 py-0.5 rounded-sm">password</code></p>
        </CardFooter>
      </Card>
    </div>
  );
}
