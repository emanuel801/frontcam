
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, WifiOff, PlayCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string | null; // Allow null src for initial state
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  // Player states: idle (no src/ready), loading (src set, initializing/buffering), playing, paused, error
  const [playerState, setPlayerState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUserInteracted, setIsUserInteracted] = useState(false); // Track user interaction (play/pause click)

  const cleanupHls = () => {
      if (hlsRef.current) {
          console.log("Destroying HLS instance for", hlsRef.current.url);
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
          hlsRef.current = null;
      }
      // Also reset video element if needed
      if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
           try { videoRef.current.load(); } catch (e) { console.warn("Error calling load() during cleanup:", e); }
      }
  };

  const initializeHls = (videoElement: HTMLVideoElement, streamSrc: string) => {
      cleanupHls(); // Ensure previous instance is destroyed

      console.log("Initializing HLS for:", streamSrc);
      setPlayerState('loading'); // Set loading state as soon as we start initializing
      setErrorMessage(null);
      setIsUserInteracted(false); // Reset interaction state for new source

      const hls = new Hls({
          // Sensible defaults, adjust as needed
          startPosition: -1,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          manifestLoadingRetryDelay: 500,
          manifestLoadingMaxRetry: 2, // Reduce retries slightly
          levelLoadingRetryDelay: 500,
          levelLoadingMaxRetry: 2,
          fragLoadingRetryDelay: 1000,
          fragLoadingMaxRetry: 3,
          fragLoadingTimeOut: 10000, // 10 seconds timeout for fragments
          enableWorker: true,
          lowLatencyMode: true, // Attempt low latency
          backBufferLength: 60, // Keep more back buffer for seeking
          maxBufferHole: 0.8, // Allow slightly larger holes before stall
          recoverMediaError: true,
          recoverNetworkError: true,
      });
      hlsRef.current = hls;

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          console.log("HLS attached, loading source:", streamSrc);
          hls.loadSource(streamSrc);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log("Manifest parsed, attempting play...");
          // Autoplay attempt, handled by browser policy
          videoElement.play().catch(error => {
              console.warn("Autoplay was prevented:", error.name);
              // If autoplay fails, stay in loading or move to paused/idle based on user interaction
              if (!isUserInteracted) {
                  setPlayerState('paused'); // Ready but needs user click
                  setErrorMessage("Tap video to play.");
              }
          });
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          // Quality level loaded - good sign, might transition from loading soon
          console.log(`Level ${data.level} loaded. Bitrate: ${hls.levels[data.level].bitrate}`);
          // If we were stuck loading, this might indicate progress
          if (playerState === 'loading') {
            // Don't force playing state, let video events handle it
            console.log("Level loaded, waiting for playback events...");
          }
      });

       hls.on(Hls.Events.ERROR, (event, data) => {
          console.error(`HLS Error: Type=${data.type}, Details=${data.details}, Fatal=${data.fatal}`, data);
          if (data.fatal) {
               console.error("HLS Fatal error encountered.");
               let userMessage = `Stream error (${data.details}).`;
               // Specific error handling
               switch (data.type) {
                   case Hls.ErrorTypes.NETWORK_ERROR:
                       userMessage = `Network error (${data.details}). Check connection.`;
                       // Consider if retry is handled by HLS config
                       break;
                   case Hls.ErrorTypes.MEDIA_ERROR:
                       userMessage = `Media error (${data.details}).`;
                       // If buffer related, HLS might recover. Otherwise, might be fatal.
                       if (data.details === 'bufferStalledError' || data.details === 'bufferSeekOverHole') {
                           userMessage = "Stream interrupted. Trying to recover.";
                           hls.recoverMediaError(); // Attempt recovery
                       } else if (data.details === 'fragParsingError') {
                           userMessage = "Video data corrupted. Trying to skip.";
                           hls.swapAudioCodec(); // Might help sometimes
                           hls.recoverMediaError();
                       } else {
                           userMessage = `Media playback error (${data.details}).`;
                           // Consider cleanup for unrecoverable media errors
                           // cleanupHls(); // Maybe too aggressive?
                       }
                       break;
                   case Hls.ErrorTypes.MANIFEST_LOAD_ERROR:
                   case Hls.ErrorTypes.LEVEL_LOAD_ERROR:
                   case Hls.ErrorTypes.MANIFEST_PARSING_ERROR:
                        userMessage = `Could not load video data (${data.details}).`;
                        cleanupHls(); // These are usually unrecoverable
                        break;
                   default:
                        userMessage = `Unrecoverable stream error (${data.details}).`;
                        cleanupHls();
                        break;
               }
               setErrorMessage(userMessage);
               setPlayerState('error'); // Set error state *only* for fatal issues
          } else {
               // Non-fatal errors (like fragLoadTimeOut) - log but don't necessarily change state
               console.warn(`HLS Non-fatal error: Type=${data.type}, Details=${data.details}`);
                if(data.details === 'fragLoadTimeOut' && playerState !== 'error') {
                    // Stay in loading or current state, HLS retries might succeed
                    console.warn("Fragment load timeout, retrying...");
                    if (playerState === 'playing' || playerState === 'paused') {
                        setPlayerState('loading'); // Show buffering indicator
                    }
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
        setErrorMessage(null);
        setIsUserInteracted(true);
    };
    const handlePause = () => {
        console.log("Video event: pause");
        // Only set to paused if not already in error state
        if (playerState !== 'error') {
            setPlayerState('paused');
        }
        setIsUserInteracted(true);
    };
     const handleWaiting = () => {
        console.log("Video event: waiting (buffering)");
        if (playerState !== 'error') {
            setPlayerState('loading');
        }
    };
     const handlePlaying = () => {
        console.log("Video event: playing (resumed after buffer/seek)");
        if (playerState !== 'error') {
            setPlayerState('playing');
            setErrorMessage(null); // Clear any temporary messages
        }
    };
     const handleError = (e: Event) => {
        const error = videoElement.error;
        console.error('Native video element error:', `Code: ${error?.code}, Message: ${error?.message}`, e);
        // Don't override HLS errors if already set
        if (playerState !== 'error') {
            setPlayerState('error');
            setErrorMessage(`Video playback error (Code: ${error?.code}).`);
        }
     };
      const handleEnded = () => {
        console.log("Video event: ended");
        setPlayerState('paused'); // Treat ended as paused, allowing replay
        // setIsUserInteracted(false); // Keep interaction state?
    };

    // Add listeners
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('ended', handleEnded);

    // --- Initialization Logic ---
    if (src) {
        if (Hls.isSupported()) {
          initializeHls(videoElement, src);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          console.log("Native HLS supported, using video.src");
          cleanupHls();
          setPlayerState('loading');
          videoElement.src = src;
          videoElement.load();
          const nativePlay = () => {
             videoElement.play().catch(error => {
                  console.warn("Native Autoplay prevented:", error.name);
                  setPlayerState('paused');
                  setErrorMessage("Tap video to play.");
              });
             videoElement.removeEventListener('loadedmetadata', nativePlay); // Remove listener after first attempt
          }
           videoElement.addEventListener('loadedmetadata', nativePlay);
        } else {
          console.error("HLS is not supported in this browser.");
          setPlayerState('error');
          setErrorMessage("Video format not supported.");
        }
    } else {
        // No src provided, ensure cleanup and idle state
        cleanupHls();
        setPlayerState('idle');
        setErrorMessage(null);
    }

    // --- Effect Cleanup ---
    return () => {
        console.log("Running cleanup for VideoPlayer useEffect, src:", src);
        cleanupHls();
        // Remove video element listeners
        if (videoElement) {
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('waiting', handleWaiting);
            videoElement.removeEventListener('playing', handlePlaying);
            videoElement.removeEventListener('error', handleError);
            videoElement.removeEventListener('ended', handleEnded);
            // Avoid removing loadedmetadata listener here if it was added conditionally
        }
        setPlayerState('idle'); // Reset state on cleanup
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]); // Re-run effect ONLY if the src changes

  const handleManualPlay = () => {
        if (videoRef.current && (playerState === 'paused' || playerState === 'idle')) {
            console.log("Manual play triggered");
            setIsUserInteracted(true);
            setPlayerState('loading'); // Show loading immediately on click
            videoRef.current.play().catch(e => {
                console.error("Manual play failed:", e);
                 setPlayerState('error');
                 setErrorMessage(`Could not start playback: ${e.message}`);
            });
        }
    };

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center text-white overflow-hidden rounded-lg"> {/* Removed shadow */}
        <video
            ref={videoRef}
            controls
            className={cn(
                "w-full h-full object-contain", // Always visible unless overlay is shown
                // Dimming can be distracting, rely on overlays
                 (playerState === 'loading' || playerState === 'error' || playerState === 'paused' || playerState === 'idle') && "opacity-80" // Slightly dim video when not actively playing for overlay contrast
            )}
            aria-label="Camera Stream Player"
            playsInline
            muted={!isUserInteracted} // Start muted, unmute on first play interaction
            // autoPlay // Handled in useEffect
        />

        {/* Loading Overlay - Show when initializing or buffering */}
         {playerState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 pointer-events-none backdrop-blur-sm z-10">
                <LoadingSpinner size={40} className="text-white/80" />
                <p className="mt-3 text-sm font-medium text-white/80 animate-pulse">Loading stream...</p>
            </div>
        )}

        {/* Error Overlay */}
         {playerState === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-destructive/80 to-destructive/95 p-5 text-center pointer-events-none backdrop-blur-sm z-10">
                 <AlertCircle size={48} className="text-destructive-foreground mb-3 drop-shadow-md" />
                 <p className="text-lg font-semibold text-destructive-foreground">Playback Error</p>
                <p className="mt-1 text-sm text-destructive-foreground/90 max-w-xs">{errorMessage || "An unknown error occurred."}</p>
            </div>
        )}

         {/* Paused/Idle Overlay (Prompt to Play) */}
        {(playerState === 'paused' || (playerState === 'idle' && src)) && ( // Show only if src is available but paused/idle
            <button
                 className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4 text-center cursor-pointer group backdrop-blur-sm z-10 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-black rounded-lg"
                 onClick={handleManualPlay}
                 aria-label={playerState === 'paused' ? "Resume video" : "Play video"}
                >
                 <PlayCircle size={72} className="text-white/80 mb-3 transition-transform duration-300 group-hover:scale-110 drop-shadow-lg" strokeWidth={1.5}/>
                 <p className="text-base font-medium text-white/90">
                     {playerState === 'paused' ? (errorMessage || "Paused") : (errorMessage || "Tap to Play")}
                </p>
                 {playerState === 'idle' && !errorMessage && <p className="text-xs text-white/60 mt-1">Stream is ready</p>}
            </button>
        )}

        {/* Initial Idle State (No Source) */}
        {playerState === 'idle' && !src && (
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
