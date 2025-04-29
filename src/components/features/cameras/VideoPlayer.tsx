
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';


interface VideoPlayerProps {
  src: string | null; // Allow null src for initial state
  videoRef?: React.RefObject<HTMLVideoElement>; // Optional external ref
  controls?: boolean; // Option to enable/disable default controls
  autoPlay?: boolean; // Option for autoplay
}

// Simplified state as browser controls handle play/pause/loading UI
type PlayerStatus = 'idle' | 'loading' | 'ready' | 'error';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, videoRef: externalRef, controls = true, autoPlay = false }) => {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalRef || internalRef; // Use external ref if provided
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


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
           // Try to stop tracks associated with captureStream if they exist
           const stream = (videoRef.current as any).capturedStream as MediaStream | undefined; // Access potentially captured stream
           if (stream && stream.getTracks) {
             stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
             console.log("Stopped tracks from captured stream during cleanup.");
           }
           (videoRef.current as any).capturedStream = null; // Clear reference
      }
  };

   // Function to attempt enabling captureStream
   const tryEnableCaptureStream = (videoElement: HTMLVideoElement) => {
      if (videoElement.captureStream) {
          try {
              const currentStream = (videoElement as any).capturedStream as MediaStream | undefined;
              // Only capture if not already captured or if tracks are inactive
              if (!currentStream || !currentStream.active) {
                  const stream = videoElement.captureStream();
                  (videoElement as any).capturedStream = stream; // Store stream reference
                  console.log("captureStream() enabled successfully.", stream);
              } else {
                  console.log("captureStream() already active.");
              }
          } catch (e) {
              console.error("Failed to enable captureStream:", e);
          }
      } else {
          console.warn("video.captureStream() not available on this element/browser.");
      }
   };


  const initializeHls = (videoElement: HTMLVideoElement, streamSrc: string) => {
      cleanupHls();

      console.log("Initializing HLS for:", streamSrc);
      setStatus('loading'); // Keep track internally, but hide visual overlay
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
          if (autoPlay) {
             videoElement.play().catch(err => console.warn("Autoplay prevented:", err));
          }
           // Try enabling captureStream after HLS is ready
           tryEnableCaptureStream(videoElement);
      });

       hls.on(Hls.Events.ERROR, (event, data) => {
           // Stringify the data object carefully to avoid circular reference errors
           let dataString = 'Error details unavailable';
           try {
               dataString = JSON.stringify(data, (key, value) => {
                   // Avoid logging potentially large or circular structures directly
                   if (key === 'frag' || key === 'level' || key === 'buffer' || key === 'request' || key === 'response' || key === 'error' || key === 'networkDetails' || key === 'mediaError' || key === 'networkError') return `[ HLS ${key} Info ]`;
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
             if (autoPlay) {
                 videoElement.play().catch(err => console.warn("Autoplay after canplay prevented:", err));
             }
         }
         // Try enabling captureStream when video is playable
         tryEnableCaptureStream(videoElement);
     };
       const handleWaiting = () => {
          console.log("Video waiting (buffering)...");
          // Do not set to 'loading' to avoid overlay flicker
      };
      const handlePlaying = () => {
          console.log("Video playing.");
          if (status === 'loading') {
            setStatus('ready');
          }
           // Also try enabling capture stream when playing starts
           tryEnableCaptureStream(videoElement);
      };


    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);


    if (src) {
        if (Hls.isSupported()) {
          initializeHls(videoElement, src);
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          console.log("Native HLS supported, using video.src");
          cleanupHls(); // Ensure previous HLS is cleaned up
          videoElement.src = src;
          setStatus('loading');
          videoElement.load();
           // Try enabling captureStream for native HLS
            tryEnableCaptureStream(videoElement);
          videoElement.addEventListener('loadedmetadata', () => {
              setStatus('ready'); // Set ready when metadata loads for native HLS
              if(autoPlay) {
                 videoElement.play().catch(err => console.warn("Native HLS autoplay prevented:", err));
              }
               // Try enabling captureStream again on loadedmetadata
               tryEnableCaptureStream(videoElement);
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
              // Remove specific native HLS listener if added
              videoElement.removeEventListener('loadedmetadata', () => {
                 setStatus('ready');
                 if(autoPlay) {
                   videoElement.play().catch(err => console.warn("Native HLS autoplay prevented:", err));
                 }
                  tryEnableCaptureStream(videoElement);
               });
        }
        setStatus('idle');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, videoRef, autoPlay]); // Include autoPlay in dependencies


  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center text-white overflow-hidden rounded-lg">
        <video
            ref={videoRef}
            controls={controls}
            className={cn(
                "w-full h-full object-contain",
                 status === 'error' && "opacity-80" // Slightly dim video on error
            )}
            aria-label="Camera Stream Player"
            playsInline
            muted={false} // Start unmuted by default, can be changed
            autoPlay={autoPlay} // Respect the prop
            crossOrigin="anonymous" // Needed for canvas snapshot & potentially stream capture
        />


        {/* Enhanced Error Overlay */}
         {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-destructive/80 to-destructive/95 p-5 text-center pointer-events-none backdrop-blur-sm z-10">
                 <AlertCircle size={48} className="text-destructive-foreground mb-3 drop-shadow-md" />
                 <p className="text-lg font-semibold text-destructive-foreground">Playback Error</p>
                <p className="mt-1 text-sm text-destructive-foreground/90 max-w-xs">{errorMessage || "An unknown error occurred."}</p>
            </div>
        )}

        {/* Enhanced Initial Idle State (No Source) */}
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
