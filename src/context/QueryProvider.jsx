"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';


// Create a client
const queryClient = new QueryClient()

export function QueryProvider({ children }) {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
