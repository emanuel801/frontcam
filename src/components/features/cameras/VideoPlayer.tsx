"use client";

import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

     // Clean up previous HLS instance if source changes
    if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
    }


    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls; // Store instance for cleanup
      hls.loadSource(src);
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoElement.play().catch(error => {
            console.warn("Autoplay was prevented:", error);
            // User interaction might be needed to start playback
        });
      });
       hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS Fatal Error:', data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error - Retrying or handling appropriately');
               // Example: Try to recover connection
               // hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error - Trying to recover');
              hls.recoverMediaError();
              break;
            default:
               // Unable to recover
               console.error('Unrecoverable HLS error - Destroying instance');
               hls.destroy();
               hlsRef.current = null;
              break;
          }
        } else {
             console.warn('HLS Non-Fatal Error:', data);
        }
      });


    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (e.g., Safari)
      videoElement.src = src;
      videoElement.addEventListener('loadedmetadata', () => {
         videoElement.play().catch(error => {
            console.warn("Autoplay was prevented on native HLS:", error);
         });
      });
       videoElement.addEventListener('error', (e) => {
           console.error('Native HLS playback error:', e);
           // Handle native playback errors
       });
    } else {
        console.error("HLS is not supported on this browser.");
        // Display a message to the user?
    }

    // Cleanup function
     return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoElement) {
         // Remove event listeners if added directly
         // videoElement.removeEventListener('loadedmetadata', ...);
         // videoElement.removeEventListener('error', ...);
         videoElement.pause();
         videoElement.removeAttribute('src'); // Prevent memory leaks
         videoElement.load(); // Reset video element state
      }
    };
  }, [src]); // Re-run effect if the src changes

  return (
    <video
        ref={videoRef}
        controls
        className="w-full h-full object-contain" // Use object-contain to fit video without stretching
        aria-label="Camera Stream Player"
        playsInline // Important for mobile playback
        muted // Often required for autoplay on mobile
    />
    );
};

export default VideoPlayer;
