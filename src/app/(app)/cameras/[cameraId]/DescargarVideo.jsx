"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DownloadCloud, Loader2 } from 'lucide-react';

// Extracted download logic into a reusable component
function DescargarVideo({ camera, startTimestamp, endTimestamp }) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDescargar = async () => {
    if (!camera || startTimestamp === null || endTimestamp === null) {
      toast({
        title: "Cannot Download",
        description: "Camera details or a valid time range are missing.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    const start = Math.floor(startTimestamp / 1000); // Ensure timestamps are in seconds
    const end = Math.floor(endTimestamp / 1000);
    // Use a fixed URL for now as per the user's last request, but ideally, this would be dynamic
    const url = `http://8.243.113.166:8083/manage/dvr/export_mp4/live/DataCenter_01?start=${start}&end=${end}`;
    const filename = `segment_${camera.name.replace(/[^a-zA-Z0-9]/g, '_')}_${start}_${end}.mp4`;

    console.log(`Attempting to download segment: ${filename} from URL: ${url}`);

    // Simulate backend fetch (won't work directly from frontend due to CORS)
    toast({
      title: "Download Segment (Simulated)",
      description: `Initiating download for ${filename}. Requires backend proxy. Check console for URL.`,
      duration: 7000,
    });
    console.warn(`Direct frontend download from ${url} will likely fail due to CORS. A backend proxy is needed.`);

    // --- Actual Fetch (likely to fail with CORS) ---
    try {
      // Note: This fetch call will likely fail due to CORS restrictions
      // unless the target server is configured to allow this origin.
      console.log(`Attempting fetch from: ${url}. Expecting potential CORS error.`);
      const response = await fetch(url);
      console.log(`Fetch response status: ${response.status}`);

      if (!response.ok) {
        // Handle HTTP errors (e.g., 404, 500)
        throw new Error(`Download failed: Server responded with status ${response.status}`);
      }

      const blob = await response.blob();
      console.log(`Received blob of size: ${blob.size}, type: ${blob.type}`);

      // Create a link to download the blob
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href); // Clean up the object URL

      toast({
        title: "Download Started",
        description: `${filename} should be downloading.`,
      });

    } catch (error) {
      console.error("Download Error:", error);
      let errorMessage = "Could not start download.";
      if (error instanceof Error) {
          errorMessage = error.message.includes('Failed to fetch') || error.message.includes('NetworkError')
              ? "Network error or CORS issue. Check browser console and ensure backend proxy if needed."
              : `Download failed: ${error.message}`;
      }
       toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Button is disabled if no valid time range is selected
  const isDisabled = !camera || startTimestamp === null || endTimestamp === null || isDownloading;

  return (
    <Button
      onClick={handleDescargar}
      variant="outline"
      size="sm"
      className="rounded-lg shadow-md transition-all hover:shadow-lg hover:bg-accent/10 border-accent/50 text-accent flex items-center gap-1.5"
      disabled={isDisabled}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Downloading...
        </>
      ) : (
        <>
          <DownloadCloud className="h-4 w-4" /> Download Segment
        </>
      )}
    </Button>
  );
}

export default DescargarVideo;
