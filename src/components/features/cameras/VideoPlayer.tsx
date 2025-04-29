
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, WifiOff } from 'lucide-react'; // Removed Loader2 and PlayCircle
import { cn } from '@/lib/utils';
// Removed LoadingSpinner import as the custom overlay is removed

interface VideoPlayerProps {
  src: string | null; // Allow null src for initial state
  videoRef?: React.RefObject<HTMLVideoElement>; // Optional external ref
  controls?: boolean; // Option to enable/disable default controls
}

// Simplified state as browser controls handle play/pause/loading UI
type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, videoRef: externalRef, controls = true }) => {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef || internalRef; // Use external ref if provided
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // No need for isUserInteracted if using default controls primarily

  const cleanupHls = () => {
      if (hlsRef.current) {
          console.log("Destroying HLS instance for", hlsRef.current.url);
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
          hlsRef.current = null;
      }
      if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
           try { videoRef.current.load(); } catch (e) { console.warn("Error calling load() during cleanup:", e); }
      }
  };

  const initializeHls = (videoElement: HTMLVideoElement, streamSrc: string) => {
      cleanupHls();

      console.log("Initializing HLS for:", streamSrc);
      setStatus('loading'); // Set loading status internally, but don't show overlay
      setErrorMessage(null);

      const hls = new Hls({
          startPosition: -1,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          manifestLoadingRetryDelay: 500,
          manifestLoadingMaxRetry: 2,
          levelLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 2,
          fragLoadingRetryDelay: 1000,
          fragLoadingMaxRetry: 3,
          fragLoadingTimeOut: 10000,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          maxBufferHole: 0.8,
          recoverMediaError: true,
          recoverNetworkError: true,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS attached, loading source:", streamSrc);
          hls.loadSource(streamSrc);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log("Manifest parsed, HLS ready.");
          setStatus('ready');
          videoElement.play().catch(err => console.warn("Autoplay prevented:", err));
      });

       hls.on(Hls.Events.ERROR, (event, data) => {
           // Stringify the data object carefully to avoid circular reference errors
           let dataString = 'Error details unavailable';
           try {
               dataString = JSON.stringify(data, (key, value) => {
                   // Handle potential circular references or large objects if necessary
                   if (key === 'frag' || key === 'level' || key === 'buffer') return '[ HLS Segment Info ]';
                   if (value instanceof Event) return '[ Event Object ]';
                   return value;
               }, 2);
           } catch (e) {
               console.error("Error stringifying HLS error data:", e);
               dataString = `Type: ${data?.type}, Details: ${data?.details}, Fatal: ${data?.fatal}`;
           }

           console.error(`HLS Error: ${dataString}`);

           if (data.fatal) {
                console.error("HLS Fatal error encountered.");
                let userMessage = `Stream error (${data.details}).`;
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        userMessage = `Network error (${data.details}). Check connection.`;
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        if (data.details === 'bufferStalledError' || data.details === 'bufferSeekOverHole') {
                            userMessage = "Stream interrupted. Trying to recover.";
                            hls.recoverMediaError(); // Attempt recovery
                        } else if (data.details === 'fragParsingError') {
                            userMessage = "Video data corrupted. Trying to skip.";
                             if(hls.currentLevel >= 0){ // Ensure level is valid before swapping
                                try { hls.swapAudioCodec(); } catch(e) { console.warn("Swap audio codec failed:", e); }
                             }
                             hls.recoverMediaError(); // Attempt recovery
                        } else {
                            userMessage = `Media playback error (${data.details}).`;
                        }
                        break;
                     case Hls.ErrorTypes.MANIFEST_LOAD_ERROR:
                     case Hls.ErrorTypes.LEVEL_LOAD_ERROR:
                     case Hls.ErrorTypes.MANIFEST_PARSING_ERROR:
                         userMessage = `Could not load video data (${data.details}).`;
                         cleanupHls(); // Clean up on manifest/level load errors
                         break;
                    default:
                         userMessage = `Unrecoverable stream error (${data.details}).`;
                         cleanupHls(); // Clean up on other fatal errors
                         break;
                }
                setErrorMessage(userMessage);
                setStatus('error');
           } else {
                console.warn(`HLS Non-fatal error: Type=${data.type}, Details=${data.details}`);
                if(data.details === 'fragLoadTimeOut' && status !== 'error' && status !== 'loading') {
                     console.warn("Fragment load timeout, might cause buffering...");
                 }
           }
       });

      hls.attachMedia(videoElement);
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

     const handleError = (e: Event) => {
        const error = videoElement.error;
        console.error('Native video element error:', `Code: ${error?.code}, Message: ${error?.message}`, e);
        if (status !== 'error') {
            setStatus('error');
            setErrorMessage(`Video playback error (Code: ${error?.code}).`);
        }
     };
     const handleCanPlay = () => {
         if (status === 'loading') {
             console.log("Video can play.");
             setStatus('ready');
              videoElement.play().catch(err => console.warn("Autoplay after canplay prevented:", err));
         }
     };
       const handleWaiting = () => {
          console.log("Video waiting (buffering)...");
          if (status === 'ready' || status === 'idle') {
             setStatus('loading'); // Set status for internal logic, but don't show overlay
          }
      };
      const handlePlaying = () => {
          if (status === 'loading') {
            setStatus('ready');
          }
      };


    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);


    if (src) {
        setStatus('loading');
        if (Hls.isSupported()) {
          initializeHls(videoElement, src);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          console.log("Native HLS supported, using video.src");
          cleanupHls();
          videoElement.src = src;
          videoElement.load();
          videoElement.addEventListener('loadedmetadata', () => {
              videoElement.play().catch(err => console.warn("Native HLS autoplay prevented:", err));
          });
        } else {
          console.error("HLS is not supported in this browser.");
          setStatus('error');
          setErrorMessage("Video format not supported.");
        }
    } else {
        cleanupHls();
        setStatus('idle');
        setErrorMessage(null);
    }

    return () => {
        console.log("Running cleanup for VideoPlayer useEffect, src:", src);
        cleanupHls();
        if (videoElement) {
            videoElement.removeEventListener('error', handleError);
            videoElement.removeEventListener('canplay', handleCanPlay);
            videoElement.removeEventListener('waiting', handleWaiting);
             videoElement.removeEventListener('playing', handlePlaying);
              videoElement.removeEventListener('loadedmetadata', () => {
                videoElement.play().catch(err => console.warn("Native HLS autoplay prevented:", err));
              });
        }
        setStatus('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, videoRef]);


  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center text-white overflow-hidden rounded-lg">
        <video
            ref={videoRef}
            controls={controls}
            className={cn(
                "w-full h-full object-contain",
                // Keep video visible even during loading/error states
                // Opacity is handled by the error overlay if needed
                 status === 'error' && "opacity-80"
            )}
            aria-label="Camera Stream Player"
            playsInline
            muted={false} // Start unmuted
            autoPlay // Add autoPlay attribute
        />

        {/* Loading Overlay - REMOVED */}
        {/* {status === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 pointer-events-none backdrop-blur-sm z-10">
                <LoadingSpinner size={40} className="text-white/80" />
                <p className="mt-3 text-sm font-medium text-white/80 animate-pulse">Loading stream...</p>
            </div>
        )} */}

        {/* Error Overlay */}
         {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-destructive/80 to-destructive/95 p-5 text-center pointer-events-none backdrop-blur-sm z-10">
                 <AlertCircle size={48} className="text-destructive-foreground mb-3 drop-shadow-md" />
                 <p className="text-lg font-semibold text-destructive-foreground">Playback Error</p>
                <p className="mt-1 text-sm text-destructive-foreground/90 max-w-xs">{errorMessage || "An unknown error occurred."}</p>
            </div>
        )}

        {/* Initial Idle State (No Source) */}
        {status === 'idle' && !src && (
             <div className="absolute inset-0 flex flex-col justify-center items-center text-muted-foreground bg-gradient-to-br from-muted/50 to-muted/60 backdrop-blur-sm pointer-events-none z-10">
                 <WifiOff size={56} className="mb-3 text-muted-foreground/60 opacity-70"/>
                 <p className="text-lg font-medium">Stream Unavailable</p>
                 <p className="text-sm text-muted-foreground/80 mt-1">No video source provided.</p>
             </div>
        )}
    </div>
    );
};

export default VideoPlayer;
