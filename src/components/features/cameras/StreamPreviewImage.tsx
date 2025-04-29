
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertTriangle, CameraOff } from 'lucide-react';
import Image from 'next/image';

interface StreamPreviewImageProps {
  streamUrl: string;
  alt: string;
}

// Define desired preview image dimensions
const PREVIEW_WIDTH = 300;
const PREVIEW_HEIGHT = 200;
const CAPTURE_TIMEOUT = 8000; // Max time (ms) to wait for frame capture

const StreamPreviewImage: React.FC<StreamPreviewImageProps> = ({ streamUrl, alt }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const cleanup = () => {
    console.log(`Cleaning up HLS for ${streamUrl}`);
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.stopLoad();
      hlsRef.current.detachMedia();
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src'); // Important for cleanup
      videoRef.current.load(); // Reset element state
    }
  };

  useEffect(() => {
    if (!streamUrl) {
      setIsError(true);
      setErrorMessage('No stream URL provided.');
      setIsLoading(false);
      return;
    }

    // Ensure refs are current and HLS is supported
    if (!videoRef.current || !canvasRef.current || !Hls.isSupported()) {
      setIsError(true);
      setErrorMessage(Hls.isSupported() ? 'Component refs not ready.' : 'HLS not supported by browser.');
      setIsLoading(false);
      return;
    }

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const ctx = canvasElement.getContext('2d', { willReadFrequently: true }); // Opt-in for performance

    if (!ctx) {
      setIsError(true);
      setErrorMessage('Could not get canvas context.');
      setIsLoading(false);
      return;
    }

    // Set canvas dimensions
    canvasElement.width = PREVIEW_WIDTH;
    canvasElement.height = PREVIEW_HEIGHT;

    // Set a timeout for the capture process
    timeoutRef.current = setTimeout(() => {
        if (isLoading) { // Only trigger if still loading
            console.warn(`Timeout reached for capturing frame from ${streamUrl}`);
            setIsError(true);
            setErrorMessage('Preview capture timed out.');
            setIsLoading(false);
            cleanup();
        }
    }, CAPTURE_TIMEOUT);

    console.log(`Initializing HLS for preview: ${streamUrl}`);
    const hls = new Hls({
        // Keep config minimal for preview capture
        startPosition: 0, // Try to get the earliest frame
        // Reduced buffer settings might help speed up initial load
        maxBufferLength: 5,
        maxMaxBufferLength: 10,
         // Abort segment loading if it takes too long
        fragLoadingTimeOut: 5000, // 5 seconds
        // Reduce retries to fail faster if stream is problematic
        manifestLoadingMaxRetry: 1,
        levelLoadingMaxRetry: 1,
        fragLoadingMaxRetry: 1,
    });
    hlsRef.current = hls;

    let frameCaptured = false;

    const captureFrame = () => {
      if (frameCaptured || !videoElement || !ctx || !canvasElement) return;

      // Ensure video has enough data to capture a frame
      if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA) {
        console.log(`Capturing frame for ${streamUrl}`);
        // Draw the video frame to the canvas
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

        try {
            // Get the image data URL from the canvas
            const dataUrl = canvasElement.toDataURL('image/jpeg', 0.8); // Use JPEG with quality 0.8
            setPreviewSrc(dataUrl);
            setIsLoading(false);
            setIsError(false);
            frameCaptured = true;
            console.log(`Frame captured successfully for ${streamUrl}`);
            cleanup(); // Clean up immediately after successful capture
        } catch (error) {
             console.error(`Error converting canvas to data URL for ${streamUrl}:`, error);
             setIsError(true);
             setErrorMessage('Failed to generate preview image.');
             setIsLoading(false);
             cleanup();
        }
      } else {
          console.log(`Video not ready, retrying frame capture for ${streamUrl}...`);
          // Optionally, retry after a short delay if needed, but timeout should handle hangs
          // requestAnimationFrame(captureFrame); // Be cautious with this to avoid infinite loops
      }
    };

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log(`HLS attached for preview: ${streamUrl}`);
      hls.loadSource(streamUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log(`Manifest parsed for preview: ${streamUrl}`);
        // Don't auto-play, just wait for data
    });

    // Use 'loadeddata' or 'canplay' which might fire earlier than 'loadedmetadata' sometimes
    videoElement.addEventListener('loadeddata', captureFrame);
    videoElement.addEventListener('canplay', captureFrame);
    // Fallback: attempt capture when time updates (first frame might be black)
    videoElement.addEventListener('timeupdate', captureFrame);


    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error(`HLS Error during preview load for ${streamUrl}:`, JSON.stringify(data, null, 2));
      if (data.fatal) {
        setIsError(true);
        setErrorMessage(`Failed to load stream preview (${data.details}).`);
        setIsLoading(false);
        cleanup();
      }
      // Non-fatal errors are ignored for preview generation
    });

    // Attach HLS to the hidden video element
    hls.attachMedia(videoElement);

    // Need to trigger loading manually in some cases if autoplay is disabled/prevented
    videoElement.load(); // Explicitly call load

    // Set video properties for silent background loading
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = false; // Explicitly false, rely on event listeners
    videoElement.preload = 'auto'; // Hint browser to load data

    // Initial attempt to play might be needed on some browsers even if muted
    // videoElement.play().catch(e => console.warn(`Preview play() call failed for ${streamUrl}: ${e}`));

    // Cleanup function
    return cleanup;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]); // Only re-run if streamUrl changes

  return (
    <div className="relative w-full h-full aspect-video bg-muted overflow-hidden">
      {/* Hidden video and canvas elements */}
      <video ref={videoRef} className="absolute -top-[9999px] -left-[9999px] w-px h-px" crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="absolute -top-[9999px] -left-[9999px]" />

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-black/30">
          <LoadingSpinner size={24} />
          <p className="text-xs mt-1">Loading Preview...</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive-foreground bg-destructive/80 p-2 text-center">
          <CameraOff size={24} className="mb-1" />
          <p className="text-xs font-medium">Preview Unavailable</p>
          {/* <p className="text-[10px] opacity-80">{errorMessage}</p> */}
        </div>
      )}

      {!isLoading && !isError && previewSrc && (
         <Image
            src={previewSrc}
            alt={alt}
            layout="fill"
            objectFit="cover"
            className="transition-opacity duration-300"
            unoptimized // Important as data URLs don't need Next.js optimization
          />
      )}

      {/* Fallback display if loading fails or no preview generated but not explicitly an error */}
      {!isLoading && !isError && !previewSrc && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-black/10 p-2 text-center">
                <CameraOff size={24} className="mb-1" />
                <p className="text-xs">No Preview</p>
            </div>
      )}
    </div>
  );
};

export default StreamPreviewImage;
