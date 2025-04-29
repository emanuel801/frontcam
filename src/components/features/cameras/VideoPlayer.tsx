
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, WifiOff, PlayCircle } from 'lucide-react'; // Icons for error states & play prompt
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Re-use loading spinner
import { cn } from '@/lib/utils'; // Import cn utility function

interface VideoPlayerProps {
  src: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playerState, setPlayerState] = useState<'loading' | 'playing' | 'error' | 'idle' | 'paused'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUserInteracted, setIsUserInteracted] = useState(false); // Track if user clicked play

  const cleanupHls = () => {
      if (hlsRef.current) {
          console.log("Destroying HLS instance for", hlsRef.current.url);
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
          hlsRef.current = null;
      }
  };

  const initializeHls = (videoElement: HTMLVideoElement) => {
      cleanupHls(); // Ensure previous instance is destroyed

      if (!src) {
          console.log("No src provided, setting state to idle.");
          setPlayerState('idle');
          return;
      }

      console.log("Initializing HLS for:", src);
      setPlayerState('loading');
      setErrorMessage(null);

      const hls = new Hls({
          startPosition: -1, // Default behavior, start from end for live streams usually
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          manifestLoadingRetryDelay: 500,
          manifestLoadingMaxRetry: 3,
          levelLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 3,
          fragLoadingRetryDelay: 1000, // Slightly longer delay for fragment retries
          fragLoadingMaxRetry: 4, // More retries for fragments
          fragLoadingTimeOut: 15000, // Increase fragment timeout
          enableWorker: true, // Use web workers for better performance
          lowLatencyMode: true, // Attempt low latency if supported by stream
          // Limit initial load size
          maxBufferSize: 10 * 1024 * 1024, // Limit buffer to 10MB initially
          maxBufferHole: 0.5, // Reduce gap jumping
          // Attempt to recover from media errors
          recoverMediaError: true,
          recoverNetworkError: true,

      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS attached, loading source:", src);
          hls.loadSource(src);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log("Manifest parsed, levels:", data.levels.length, "Attempting play...");
          // Don't set to 'playing' here, wait for actual playback event
          // Attempt autoplay only if user hasn't manually paused/played
          if (!isUserInteracted) {
              videoElement.play().then(() => {
                  console.log("Autoplay successful");
                  // State set by 'playing' event listener
              }).catch(error => {
                  console.warn("Autoplay was prevented:", error.name, error.message);
                  setPlayerState('idle'); // Set to idle if autoplay fails, needs user click
                  setErrorMessage("Autoplay blocked. Tap video to play.");
              });
          } else {
               console.log("User has interacted, not attempting autoplay.");
               // If user previously paused, keep it paused.
               if(videoElement.paused) setPlayerState('paused');
          }
      });

       // More granular error logging
      hls.on(Hls.Events.ERROR, (event, data) => {
          console.error(`HLS Error: Type=${data.type}, Details=${data.details}, Fatal=${data.fatal}`, JSON.stringify(data, null, 2));
          let userMessage = "An error occurred.";

          if (data.fatal) {
               console.error("HLS Fatal error encountered.");
               userMessage = `Stream error (${data.details}).`;
               // Decide whether to try recovery or just show error
               switch (data.type) {
                   case Hls.ErrorTypes.NETWORK_ERROR:
                       userMessage = `Network error (${data.details}). Check connection.`;
                       // HLS might attempt recovery based on config (recoverNetworkError)
                       break;
                   case Hls.ErrorTypes.MEDIA_ERROR:
                       userMessage = `Media error (${data.details}). Attempting recovery.`;
                        // HLS might attempt recovery based on config (recoverMediaError)
                       if (data.details === 'bufferStalledError' || data.details === 'bufferSeekOverHole') {
                           console.warn("Buffer stall or hole, seeking might help.");
                           userMessage = "Stream interrupted. Attempting recovery.";
                           // hls.recoverMediaError(); // Already handled by config?
                           // Or maybe try seeking:
                           // videoElement.currentTime += 0.1;
                       } else {
                           hls.recoverMediaError(); // Explicitly try recovery for other media errors
                       }
                       break;
                   case Hls.ErrorTypes.MANIFEST_LOAD_ERROR:
                   case Hls.ErrorTypes.LEVEL_LOAD_ERROR:
                   case Hls.ErrorTypes.MANIFEST_PARSING_ERROR:
                        userMessage = `Could not load video data (${data.details}).`;
                        // Consider these truly fatal, stop HLS
                        cleanupHls();
                        break;
                   default:
                        userMessage = `Unrecoverable stream error (${data.details}).`;
                        cleanupHls(); // Stop HLS on other fatal errors
                        break;
               }
               setErrorMessage(userMessage);
               setPlayerState('error'); // Set error state only for fatal errors
          } else {
               console.warn(`HLS Non-fatal error: Type=${data.type}, Details=${data.details}`);
               // Optionally show temporary warnings for non-fatal issues like fragLoadTimeOut?
                if(data.details === 'fragLoadTimeOut') {
                    // Maybe show a temporary "Reconnecting..." state?
                    // setPlayerState('loading'); // Revert to loading? Could be disruptive.
                }
          }
      });

      // Attach HLS to the video element
      hls.attachMedia(videoElement);
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // --- Video Element Event Listeners ---
    const handlePlay = () => {
        console.log("Video event: play");
        setPlayerState('playing');
        setErrorMessage(null); // Clear error message on successful play
        setIsUserInteracted(true); // Mark interaction
    };
    const handlePause = () => {
        console.log("Video event: pause");
        // Don't set state to idle if paused by user, use 'paused' state
         if (playerState !== 'error' && playerState !== 'loading') {
            setPlayerState('paused');
         }
        setIsUserInteracted(true); // Mark interaction
    };
     const handleWaiting = () => {
        console.log("Video event: waiting (buffering)");
         if (playerState !== 'error') { // Don't show loading if already in error state
            setPlayerState('loading');
         }
    };
     const handlePlaying = () => {
        console.log("Video event: playing (resumed after buffer/seek)");
        if (playerState !== 'error') {
             setPlayerState('playing');
             setErrorMessage(null);
        }
    };
     const handleError = (e: Event) => {
        const error = videoElement.error;
        console.error('Native video element error:', `Code: ${error?.code}, Message: ${error?.message}`, e);
        if (playerState !== 'error') { // Avoid overriding HLS error messages if possible
            setPlayerState('error');
            setErrorMessage(`Video playback error (Code: ${error?.code}).`);
        }
     };
      const handleEnded = () => {
        console.log("Video event: ended");
        setPlayerState('idle'); // Or maybe 'paused'? Idle seems fine.
        setIsUserInteracted(false); // Reset interaction state?
    };


    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('error', handleError);
     videoElement.addEventListener('ended', handleEnded);


    // --- HLS Initialization ---
    if (Hls.isSupported()) {
      initializeHls(videoElement);
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
      console.log("Native HLS supported, using video.src");
      cleanupHls(); // Make sure no HLS instance interferes
      setPlayerState('loading');
      videoElement.src = src;
      videoElement.load(); // Explicitly load
      // Attempt play after metadata is loaded
      const nativePlay = () => {
         videoElement.play().catch(error => {
              console.warn("Native Autoplay was prevented:", error.name, error.message);
              setPlayerState('idle');
              setErrorMessage("Autoplay blocked. Tap video to play.");
          });
      }
       videoElement.addEventListener('loadedmetadata', nativePlay);

       // Use existing listeners for playing, waiting, error etc.

       // Need cleanup for native src usage as well
       return () => {
           console.log("Cleaning up native video source for:", src);
            videoElement.removeEventListener('loadedmetadata', nativePlay);
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('waiting', handleWaiting);
            videoElement.removeEventListener('playing', handlePlaying);
            videoElement.removeEventListener('error', handleError);
            videoElement.removeEventListener('ended', handleEnded);
            videoElement.pause();
            videoElement.removeAttribute('src');
            try { videoElement.load(); } catch(e) { console.warn("Error calling load() during native cleanup:", e); }
            setPlayerState('idle');
       }

    } else {
      console.error("HLS is not supported in this browser.");
      setPlayerState('error');
      setErrorMessage("Video format not supported.");
    }

    // --- Effect Cleanup ---
    return () => {
        console.log("Running cleanup for useEffect, src:", src);
        cleanupHls(); // Destroy HLS instance
        // Remove video element listeners
        if (videoElement) {
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('waiting', handleWaiting);
            videoElement.removeEventListener('playing', handlePlaying);
            videoElement.removeEventListener('error', handleError);
             videoElement.removeEventListener('ended', handleEnded);
            // Reset video element state if necessary (already done in HLS/Native cleanup)
            // videoElement.pause();
            // videoElement.removeAttribute('src');
            // try { videoElement.load(); } catch(e) { console.warn("Error calling load() during effect cleanup:", e); }
        }
        setPlayerState('idle'); // Reset state on full cleanup/unmount
        setIsUserInteracted(false); // Reset interaction state
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]); // Re-run effect ONLY if the src changes


  const handleManualPlay = () => {
        if (videoRef.current) {
            console.log("Manual play triggered");
            setIsUserInteracted(true); // User initiated action
            videoRef.current.play().catch(e => {
                console.error("Manual play failed:", e);
                 setPlayerState('error');
                 setErrorMessage(`Could not start playback: ${e.message}`);
            });
        }
    };


  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center text-white overflow-hidden rounded-lg shadow-inner">
        {/* Added rounded-lg and shadow-inner */}
        <video
            ref={videoRef}
            controls
            className={cn(
                "w-full h-full object-contain transition-opacity duration-300", // Use object-contain to fit video without stretching
                playerState !== 'playing' && 'opacity-60' // Dim video slightly if not actively playing
            )}
            aria-label="Camera Stream Player"
            playsInline // Important for mobile playback
            // Muted is often required for *initial* autoplay, but user might want sound later.
            // Start muted, allow unmuting via controls.
            muted={!isUserInteracted} // Start muted, unmute on interaction (play click)
            // autoPlay // Autoplay is attempted in useEffect
            // Remove onClick here, use overlay for play prompt if needed
        />

        {/* Loading Overlay */}
         {playerState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 pointer-events-none backdrop-blur-sm">
                <LoadingSpinner size={40} className="text-white/80" />
                <p className="mt-3 text-base font-medium text-white/80 animate-pulse">Loading stream...</p>
            </div>
        )}

        {/* Error Overlay */}
         {playerState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-destructive/80 to-destructive/95 p-5 text-center pointer-events-none backdrop-blur-sm">
                 <AlertCircle size={48} className="text-destructive-foreground mb-3 drop-shadow-md" />
                 <p className="text-lg font-semibold text-destructive-foreground">Playback Error</p>
                <p className="mt-1 text-sm text-destructive-foreground/90">{errorMessage || "An unknown error occurred."}</p>
            </div>
        )}

         {/* Idle/Paused Overlay (Prompt to Play) */}
        {(playerState === 'idle' || playerState === 'paused') && (
            <div
                 className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center cursor-pointer group backdrop-blur-sm"
                 onClick={handleManualPlay} // Use dedicated handler
                 role="button"
                 aria-label="Play video"
                 tabIndex={0} // Make it focusable
                 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleManualPlay(); }} // Keyboard interaction
                >
                  {/* Slightly larger icon, subtle animation */}
                 <PlayCircle size={72} className="text-white/80 mb-3 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg" strokeWidth={1.5}/>
                 <p className="text-base font-medium text-white/90">
                     {playerState === 'paused' ? "Paused" : (errorMessage || "Tap to Play")}
                </p>
                 {playerState === 'idle' && !errorMessage && <p className="text-xs text-white/60 mt-1">Stream is ready</p>}
            </div>
        )}
    </div>
    );
};

export default VideoPlayer;

