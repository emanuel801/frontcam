"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, WifiOff } from 'lucide-react'; // Icons for error states
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Re-use loading spinner

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playerState, setPlayerState] = useState<'loading' | 'playing' | 'error' | 'idle'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !src) {
        setPlayerState('idle');
        return;
    };

    setPlayerState('loading'); // Set loading state when src changes or component mounts
    setErrorMessage(null); // Clear previous errors

    // Clean up previous HLS instance if source changes
    if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
        console.log("Previous HLS instance destroyed");
    }

    if (Hls.isSupported()) {
      console.log("HLS.js is supported, initializing...");
      const hls = new Hls({
        // More robust configuration
        startPosition: -1, // Default behavior, start from end for live streams usually
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        // Enable CEA-608/708 captions if needed
        // enableCEA708Captions: true,
        // enableWebVTT: true,
        // Retry settings
        manifestLoadingRetryDelay: 500,
        manifestLoadingMaxRetry: 3,
        levelLoadingRetryDelay: 500,
        levelLoadingMaxRetry: 3,
        fragLoadingRetryDelay: 500,
        fragLoadingMaxRetry: 3,
      });
      hlsRef.current = hls; // Store instance for cleanup

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("HLS.js attached to video element");
        hls.loadSource(src);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("Manifest parsed, levels:", data.levels.length);
        setPlayerState('playing'); // Consider playing only after first fragment loaded?
        videoElement.play().catch(error => {
            console.warn("Autoplay was prevented:", error);
            // Might need user interaction. Update state to reflect this?
            setPlayerState('idle'); // Set to idle if autoplay fails, needs user click
            setErrorMessage("Autoplay blocked. Click video to play.");
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error(`HLS Error: Type=${data.type}, Details=${data.details}, Fatal=${data.fatal}`, data);
        setPlayerState('error');
        let userMessage = "An error occurred while loading the video.";

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              userMessage = `Network error: ${data.details}. Check connection.`;
              // HLS.js might retry automatically based on config.
              // If retries fail, manual recovery or user notification is needed.
              // hls.startLoad(); // Example: attempt to restart loading
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
               userMessage = `Media error: ${data.details}. Trying to recover.`;
               // Try to recover from media errors
               if (data.details !== 'bufferStalledError') { // Avoid infinite loops on stall
                    hls.recoverMediaError();
               } else {
                   console.warn("Buffer stalled, might need seeking or stream restart.");
                   userMessage = "Stream stalled. Please wait or try seeking.";
               }
              break;
            case Hls.ErrorTypes.MANIFEST_LOAD_ERROR:
            case Hls.ErrorTypes.MANIFEST_PARSING_ERROR:
                 userMessage = "Could not load or parse the video manifest.";
                 hls.destroy(); // Destroy on unrecoverable manifest errors
                 hlsRef.current = null;
                 break;
            default:
               userMessage = `An unrecoverable error occurred (${data.details}).`;
               hls.destroy();
               hlsRef.current = null;
              break;
          }
           setErrorMessage(userMessage);
        } else {
            // Non-fatal errors (e.g., frag parsing errors) might be logged but not shown to user
            console.warn(`Non-fatal HLS Error: Type=${data.type}, Details=${data.details}`);
             // Optionally update state for minor issues if needed
        }
      });

       hls.attachMedia(videoElement);

    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      console.log("Native HLS playback supported (e.g., Safari)");
      videoElement.src = src;
      videoElement.addEventListener('loadedmetadata', () => {
        console.log("Native HLS metadata loaded");
         videoElement.play().catch(error => {
            console.warn("Autoplay was prevented on native HLS:", error);
            setPlayerState('idle');
            setErrorMessage("Autoplay blocked. Click video to play.");
         });
      });
       videoElement.addEventListener('error', (e) => {
           const error = videoElement.error;
           console.error('Native HLS playback error:', `Code: ${error?.code}, Message: ${error?.message}`, e);
           setPlayerState('error');
           setErrorMessage(`Video playback error (Code: ${error?.code}).`);
       });
        videoElement.addEventListener('playing', () => setPlayerState('playing'));
        videoElement.addEventListener('waiting', () => setPlayerState('loading')); // Show loading on buffer
        videoElement.addEventListener('stalled', () => {
             console.warn("Native HLS stalled");
             // Optionally set to loading or show a message
        });


    } else {
        console.error("HLS is not supported on this browser.");
        setPlayerState('error');
        setErrorMessage("This browser does not support HLS video playback.");
    }

    // Cleanup function
     return () => {
      console.log("Cleaning up VideoPlayer for src:", src);
      if (hlsRef.current) {
        console.log("Destroying HLS.js instance");
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoElement) {
         // Remove event listeners specifically added in this effect
         // Note: Basic listeners like 'error', 'playing' might not need manual removal if using React's lifecycle correctly
         videoElement.pause();
         videoElement.removeAttribute('src'); // Important to prevent memory leaks
         try { videoElement.load(); } catch(e) { console.warn("Error calling load() during cleanup:", e); } // Reset video element state
      }
       setPlayerState('idle'); // Reset state on cleanup
    };
  }, [src]); // Re-run effect ONLY if the src changes

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center text-white">
        <video
            ref={videoRef}
            controls
            className={cn(
                "w-full h-full object-contain", // Use object-contain to fit video without stretching
                playerState !== 'playing' && 'opacity-50' // Dim video if not playing
            )}
            aria-label="Camera Stream Player"
            playsInline // Important for mobile playback
            muted // Muted often required for autoplay
            // autoPlay // Autoplay is attempted in useEffect, remove from here
            onClick={() => { // Allow clicking video to play if needed
                if (playerState === 'idle' && videoRef.current) {
                    videoRef.current.play().catch(e => console.error("Manual play failed:", e));
                }
            }}
        />
         {playerState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none">
                <LoadingSpinner size={32} className="text-white" />
                <p className="mt-2 text-sm text-white/80">Loading stream...</p>
            </div>
        )}
         {playerState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-4 text-center pointer-events-none">
                 <AlertCircle size={40} className="text-destructive mb-2" />
                 <p className="text-destructive font-medium">Playback Error</p>
                <p className="mt-1 text-sm text-white/80">{errorMessage || "An unknown error occurred."}</p>
            </div>
        )}
        {playerState === 'idle' && errorMessage && ( // Show message if idle due to autoplay block
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center cursor-pointer"
                 onClick={() => {
                     if (videoRef.current) videoRef.current.play().catch(e => console.error("Manual play failed:", e));
                 }}>
                <WifiOff size={40} className="text-muted-foreground mb-2" />
                <p className="text-sm text-white/80">{errorMessage}</p>
            </div>
        )}
    </div>
    );
};

export default VideoPlayer;
