
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, WifiOff, PlayCircle, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string | null; // Allow null src for initial state
  videoRef?: React.RefObject<HTMLVideoElement>; // Optional external ref
  controls?: boolean; // Option to disable default controls
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, videoRef: externalRef, controls = true }) => {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef || internalRef; // Use external ref if provided
  const hlsRef = useRef<Hls | null>(null);
  const [playerState, setPlayerState] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUserInteracted, setIsUserInteracted] = useState(false);

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
      setPlayerState('loading');
      setErrorMessage(null);
      setIsUserInteracted(false); // Reset interaction for new source

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
          console.log("Manifest parsed, attempting play...");
          // Attempt to play only if controls are enabled OR user has interacted before
          // If using custom controls, parent component handles play attempt
          if (controls || isUserInteracted) {
              videoElement.play().catch(error => {
                  console.warn("Autoplay was prevented:", error.name);
                  if (!isUserInteracted) { // Only show prompt if it wasn't a user click
                      setPlayerState('paused');
                      setErrorMessage("Tap video to play.");
                  }
              });
          } else {
             // If no controls and no interaction, set to paused, waiting for external trigger
             setPlayerState('paused');
          }
      });

      hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
          console.log(`Level ${data.level} loaded. Bitrate: ${hls.levels[data.level].bitrate}`);
          if (playerState === 'loading') {
            console.log("Level loaded, waiting for playback events...");
          }
      });

       hls.on(Hls.Events.ERROR, (event, data) => {
           console.error(`HLS Error: Type=${data.type}, Details=${data.details}, Fatal=${data.fatal}`, data);
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
                            hls.recoverMediaError();
                        } else if (data.details === 'fragParsingError') {
                            userMessage = "Video data corrupted. Trying to skip.";
                            hls.swapAudioCodec();
                            hls.recoverMediaError();
                        } else {
                            userMessage = `Media playback error (${data.details}).`;
                        }
                        break;
                    case Hls.ErrorTypes.MANIFEST_LOAD_ERROR:
                    case Hls.ErrorTypes.LEVEL_LOAD_ERROR:
                    case Hls.ErrorTypes.MANIFEST_PARSING_ERROR:
                         userMessage = `Could not load video data (${data.details}).`;
                         cleanupHls();
                         break;
                    default:
                         userMessage = `Unrecoverable stream error (${data.details}).`;
                         cleanupHls();
                         break;
                }
                setErrorMessage(userMessage);
                setPlayerState('error');
           } else {
                console.warn(`HLS Non-fatal error: Type=${data.type}, Details=${data.details}`);
                 if(data.details === 'fragLoadTimeOut' && playerState !== 'error') {
                     console.warn("Fragment load timeout, retrying...");
                     if (playerState === 'playing' || playerState === 'paused') {
                         setPlayerState('loading');
                     }
                 }
           }
       });

      hls.attachMedia(videoElement);
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // --- Video Element Event Listeners (Internal State Sync) ---
    // These listeners sync the internal player state for UI overlays,
    // independent of whether default controls are shown or custom ones are used.
    const handlePlay = () => {
        console.log("Internal Video event: play");
        setPlayerState('playing');
        setErrorMessage(null); // Clear error messages on successful play
        //setIsUserInteracted(true); // Set interaction on play/pause click instead
    };
    const handlePause = () => {
        console.log("Internal Video event: pause");
        if (playerState !== 'error') setPlayerState('paused');
        //setIsUserInteracted(true);
    };
     const handleWaiting = () => {
        console.log("Internal Video event: waiting (buffering)");
        if (playerState !== 'error') setPlayerState('loading');
    };
     const handlePlaying = () => {
        console.log("Internal Video event: playing (resumed)");
        if (playerState !== 'error') {
            setPlayerState('playing');
            setErrorMessage(null); // Clear temporary messages
        }
    };
     const handleError = (e: Event) => {
        const error = videoElement.error;
        console.error('Native video element error:', `Code: ${error?.code}, Message: ${error?.message}`, e);
        if (playerState !== 'error') { // Don't override existing HLS error
            setPlayerState('error');
            setErrorMessage(`Video playback error (Code: ${error?.code}).`);
        }
     };
      const handleEnded = () => {
        console.log("Internal Video event: ended");
        setPlayerState('paused');
        // setIsUserInteracted(false); // Keep interaction state?
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('ended', handleEnded);


    // --- Initialization ---
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
             // Only try to play if using default controls or interaction happened
             if (controls || isUserInteracted) {
                 videoElement.play().catch(error => {
                     console.warn("Native Autoplay prevented:", error.name);
                     if (!isUserInteracted) { // Only show prompt if it wasn't a user click
                         setPlayerState('paused');
                         setErrorMessage("Tap video to play.");
                     }
                 });
             } else {
                 setPlayerState('paused'); // Wait for external trigger
             }
              // Remove listener regardless of play success/failure
              videoElement.removeEventListener('loadedmetadata', nativePlay);
           }
            videoElement.addEventListener('loadedmetadata', nativePlay);
        } else {
          console.error("HLS is not supported in this browser.");
          setPlayerState('error');
          setErrorMessage("Video format not supported.");
        }
    } else {
        cleanupHls();
        setPlayerState('idle');
        setErrorMessage(null);
    }

    // --- Cleanup ---
    return () => {
        console.log("Running cleanup for VideoPlayer useEffect, src:", src);
        cleanupHls();
        if (videoElement) {
            videoElement.removeEventListener('play', handlePlay);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('waiting', handleWaiting);
            videoElement.removeEventListener('playing', handlePlaying);
            videoElement.removeEventListener('error', handleError);
            videoElement.removeEventListener('ended', handleEnded);
            // Avoid removing loadedmetadata conditionally, ensure it's removed if added
             // videoElement.removeEventListener('loadedmetadata', nativePlay); // This is tricky, listener might not be set
        }
        setPlayerState('idle'); // Reset state on cleanup
    };
    // Add `controls` to dependency array if its change should re-trigger effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, videoRef]); // Rerun if src or ref changes

  const handleManualPlay = () => {
        if (videoRef.current && (playerState === 'paused' || playerState === 'idle')) {
            console.log("Manual play triggered");
            setIsUserInteracted(true); // Mark interaction
            setPlayerState('loading');
            videoRef.current.play().catch(e => {
                console.error("Manual play failed:", e);
                 setPlayerState('error');
                 setErrorMessage(`Could not start playback: ${e.message}`);
            });
        }
    };

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center text-white overflow-hidden rounded-lg">
        <video
            ref={videoRef}
            controls={controls} // Use prop to control visibility of default controls
            className={cn(
                "w-full h-full object-contain",
                // Only dim if overlays are shown and video isn't playing
                 (playerState === 'loading' || playerState === 'error' || (playerState === 'paused' && controls) || (playerState === 'idle' && src && controls)) && "opacity-80"
            )}
            aria-label="Camera Stream Player"
            playsInline
            // Muted state might be controlled by the parent if using custom controls
            muted={!isUserInteracted && !controls} // Start muted if no controls or no interaction yet
            // autoPlay // Handled in useEffect
        />

        {/* Loading Overlay */}
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

         {/* Paused/Idle Overlay (Prompt to Play) - Only show if default controls are enabled */}
        {(playerState === 'paused' || (playerState === 'idle' && src)) && controls && (
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
