"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CameraOff } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Import cn utility

// Define desired preview image dimensions
const PREVIEW_WIDTH = 300;
const PREVIEW_HEIGHT = 200;
const CAPTURE_TIMEOUT = 10000; // Increased timeout slightly to 10s
const FRAGMENT_LOAD_TIMEOUT = 8000; // Increased fragment load timeout
const FRAGMENT_LOAD_RETRIES = 2; // Allow a couple of retries

const StreamPreviewImage = ({ streamUrl, alt }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const hlsRef = useRef(null);
  const timeoutRef = useRef(null);

  const [previewSrc, setPreviewSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


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
       // Remove specific listeners added in effect
      videoRef.current.removeEventListener('loadeddata', captureFrame);
      videoRef.current.removeEventListener('canplay', captureFrame);
      videoRef.current.removeEventListener('timeupdate', captureFrame);
    }
  };

  // Moved captureFrame definition outside useEffect but within component scope
  // Need to wrap it in useCallback or handle refs carefully if dependencies change.
  // For now, defining inside useEffect ensures access to current refs and state.
  const captureFrame = () => {
      // Use local variables inside the function to avoid stale closure issues with refs/state
      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const currentHls = hlsRef.current;
      const currentTimeout = timeoutRef.current;

      if (!previewSrc && !isError && videoElement && canvasElement && currentHls) { // Check if preview already captured or errored
          if (videoElement.readyState >= videoElement.HAVE_CURRENT_DATA && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
              console.log(`Capturing frame for ${streamUrl}`);
              const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
              if (!ctx) {
                  console.error('Failed to get canvas context.');
                  setIsError(true);
                  setErrorMessage('Canvas context error.');
                  setIsLoading(false);
                  cleanup();
                  return;
              }
              // Draw the video frame to the canvas
              ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

              try {
                  // Get the image data URL from the canvas
                  const dataUrl = canvasElement.toDataURL('image/jpeg', 0.8); // Use JPEG with quality 0.8
                  setPreviewSrc(dataUrl);
                  setIsLoading(false);
                  setIsError(false);
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
              console.log(`Video not ready or dimensions 0, waiting for valid frame for ${streamUrl}... state: ${videoElement.readyState}`);
          }
      }
  };


  useEffect(() => {
    // Reset state on streamUrl change
    setPreviewSrc(null);
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    if (!streamUrl) {
      setIsError(true);
      setErrorMessage('No stream URL provided.');
      setIsLoading(false);
      return;
    }

    if (!videoRef.current || !canvasRef.current || !Hls.isSupported()) {
      setIsError(true);
      setErrorMessage(Hls.isSupported() ? 'Component refs not ready.' : 'HLS not supported by browser.');
      setIsLoading(false);
      return;
    }

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    // Set canvas dimensions
    canvasElement.width = PREVIEW_WIDTH;
    canvasElement.height = PREVIEW_HEIGHT;

    // Set a timeout for the capture process
    timeoutRef.current = setTimeout(() => {
        // Check isLoading flag within the timeout callback
        if (isLoading && !previewSrc && !isError) { // Only trigger if still loading and no success/error yet
            console.warn(`Timeout reached for capturing frame from ${streamUrl}`);
            setIsError(true);
            setErrorMessage('Preview capture timed out.');
            setIsLoading(false);
            cleanup();
        }
    }, CAPTURE_TIMEOUT);

    console.log(`Initializing HLS for preview: ${streamUrl}`);
    const hls = new Hls({
        startPosition: -1, // Try to get latest frame
        maxBufferLength: 10, // Slightly larger buffer
        maxMaxBufferLength: 20,
        fragLoadingTimeOut: FRAGMENT_LOAD_TIMEOUT,
        manifestLoadingMaxRetry: FRAGMENT_LOAD_RETRIES,
        levelLoadingMaxRetry: FRAGMENT_LOAD_RETRIES,
        fragLoadingMaxRetry: FRAGMENT_LOAD_RETRIES,
        // Attempt to recover from media errors if possible
        recoverMediaError: true,
        // Limit initial load size
        maxBufferSize: 5 * 1024 * 1024, // Limit buffer to 5MB initially
        maxBufferHole: 0.5, // Reduce gap jumping
    });
    hlsRef.current = hls;

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      console.log(`HLS attached for preview: ${streamUrl}`);
      hls.loadSource(streamUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log(`Manifest parsed for preview: ${streamUrl}`);
        // Don't auto-play, rely on loadeddata/canplay
    });

    // Use listeners to attempt capture
    // Need to re-add listeners if component re-renders or captureFrame changes identity
    videoElement.addEventListener('loadeddata', captureFrame);
    videoElement.addEventListener('canplay', captureFrame);
    videoElement.addEventListener('timeupdate', captureFrame); // Fallback

    hls.on(Hls.Events.ERROR, (event, data) => {
        // Log non-fatal errors as warnings, fatal as errors
        let dataString = 'Error details unavailable';
        try {
           dataString = JSON.stringify(data, (key, value) => {
             if (key === 'frag' || key === 'level' || key === 'buffer' || key === 'request' || key === 'response' || key === 'error' || key === 'networkDetails' || key === 'mediaError' || key === 'networkError') return `[ HLS ${key} Info ]`;
             if (value instanceof Event) return '[ Event Object ]';
             return value;
           }, 2);
         } catch (e) {
           console.error("Error stringifying HLS error data:", e);
           dataString = `Type: ${data?.type}, Details: ${data?.details}, Fatal: ${data?.fatal}`;
         }


        if (data.fatal) {
             console.error(`HLS Fatal Error during preview load for ${streamUrl}:`, dataString);
             setIsError(true);
             // Use a more generic error message for fatal issues
             setErrorMessage(`Failed to load stream preview (${data.details}).`);
             setIsLoading(false);
             cleanup();
         } else {
             // Log non-fatal errors (like timeouts) as warnings to reduce console noise
             console.warn(`HLS Non-Fatal Error for ${streamUrl}: ${dataString}`);
             // Optionally, check if it's a timeout and maybe extend the main timeout slightly?
             // Or just let the main timeout handle persistent failures.
         }
    });

    // Attach HLS to the hidden video element
    hls.attachMedia(videoElement);

    // Trigger loading
    videoElement.load();

    // Set video properties
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.autoplay = false;
    videoElement.preload = 'auto';

    // Cleanup function from useEffect
    return cleanup;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]); // Re-run effect only if streamUrl changes

  return (
    <div className="relative w-full h-full aspect-video bg-muted overflow-hidden rounded-lg"> {/* Ensure rounded corners */}
      {/* Hidden video and canvas elements */}
      <video ref={videoRef} className="absolute -top-[9999px] -left-[9999px] w-px h-px" crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="absolute -top-[9999px] -left-[9999px]" />

      {/* Enhanced Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-muted/70 to-muted/80 backdrop-blur-sm transition-opacity duration-300">
          <LoadingSpinner size={24} className="mb-2 text-primary" />
          <p className="text-xs font-medium animate-pulse">Loading Preview...</p>
        </div>
      )}

      {/* Enhanced Error State */}
      {isError && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive-foreground bg-gradient-to-br from-destructive/70 to-destructive/80 p-2 text-center backdrop-blur-sm transition-opacity duration-300">
          <CameraOff size={28} className="mb-1.5 opacity-80" />
          <p className="text-xs font-semibold">Preview Unavailable</p>
          {/* Hide detailed error message from UI unless debugging */}
          {/* <p className="text-[10px] opacity-80">{errorMessage}</p> */}
        </div>
      )}

      {/* Preview Image */}
      {!isLoading && !isError && previewSrc && (
         <Image
            src={previewSrc}
            alt={alt}
            layout="fill"
            objectFit="cover"
            className="transition-opacity duration-300" // Fade in effect
            unoptimized // Important as data URLs don't need Next.js optimization
          />
      )}

      {/* Fallback display if loading completes without error but no preview was generated */}
      {!isLoading && !isError && !previewSrc && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-black/10 p-2 text-center transition-opacity duration-300">
                <CameraOff size={24} className="mb-1 opacity-60" />
                <p className="text-xs">No Preview</p>
            </div>
      )}
    </div>
  );
};

export default StreamPreviewImage;
