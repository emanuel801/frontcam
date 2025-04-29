"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { LogIn, ShieldAlert } from 'lucide-react'; // Added icons

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
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
      if (username === 'testuser' && password === 'password') {
        login(username);
         toast({
          title: "Success",
          description: "Logged in successfully!",
          // variant: "success", // Consider adding a success variant to toast
        });
        // No need to set isLoading to false here, as redirection will happen
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
    // Added px-4 for padding on smallest screens
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/50 to-background px-4 py-8">
        {/* Adjusted max-w-sm and added w-full for better mobile fit, rounded-lg */}
      <Card className="w-full max-w-sm shadow-xl rounded-lg border border-border bg-card">
        <CardHeader className="space-y-1 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary mb-2" /> {/* Security Icon */}
          <CardTitle className="text-2xl font-bold text-primary">StreamWatch Secure Login</CardTitle>
          <CardDescription className="text-muted-foreground">Enter credentials to access your cameras.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5"> {/* Reduced spacing */}
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g., testuser" // Placeholder example
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                aria-label="Username"
                className="rounded-md" // Ensure inputs have rounded corners
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5"> {/* Reduced spacing */}
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••" // Password placeholder
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
                className="rounded-md" // Ensure inputs have rounded corners
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow transition-shadow hover:shadow-md" disabled={isLoading}>
             {isLoading ? (
                <>
                    <LogIn className="mr-2 h-4 w-4 animate-spin" /> {/* Replace with spinner if preferred */}
                    Authenticating...
                </>
                ) : (
                <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                </>
                )}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-xs text-muted-foreground pt-4"> {/* Added padding-top */}
            <p>Demo: Use <code className="font-mono bg-muted px-1 rounded">testuser</code> / <code className="font-mono bg-muted px-1 rounded">password</code></p>
        </CardFooter>
      </Card>
    </div>
  );
}
