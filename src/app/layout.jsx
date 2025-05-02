import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/context/QueryProvider';
import { Toaster } from "@/components/ui/toaster"


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'StreamWatch',
  description: 'Watch your camera streams',
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" suppressHydrationWarning>
       <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <AuthProvider>
          <QueryProvider>
              {children}
             <Toaster />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
