"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCameras, getStreamUrlForTimestamp } from '@/services/stream-service';
import VideoPlayer from '@/components/features/cameras/VideoPlayer';
import DateTimeSearch from '@/components/features/cameras/DateTimeSearch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff, Video, ChevronLeft, AlertTriangle, RefreshCw, Clock, RadioTower, Camera as CameraIcon, Download, CircleDot, StopCircle, DownloadCloud, HelpCircle } from 'lucide-react'; // Added HelpCircle as placeholder
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { format } from 'date-fns'; // To display timestamp
import Image from 'next/image'; // For snapshot preview
import DescargarVideo from './DescargarVideo'; // Import the download component


export default function CameraPlayerPage() {
  const params = useParams();
  const cameraId = params.cameraId;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // Ref for snapshot canvas
  const snapshotTimeoutRef = useRef(null); // Ref for snapshot preview timeout
  const mediaRecorderRef = useRef(null); // Ref for MediaRecorder instance
  const recordedChunksRef = useRef([]); // Ref for recorded video chunks

  // Fetch camera data
  const { data: camera, isLoading: isLoadingCamera, isError: isErrorCamera, error: errorCamera, refetch: refetchCamera } = useQuery({
      queryKey: ['camera', cameraId],
      queryFn: async () => {
          const cameras = await queryClient.fetchQuery({ queryKey: ['cameras'], queryFn: getCameras });
          const foundCamera = cameras?.find(c => c.id === cameraId);
          if (!foundCamera) {
              throw new Error(`Camera with ID ${cameraId} not found.`);
          }
          return foundCamera;
      },
      enabled: !!cameraId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
  });

  const [currentStreamUrl, setCurrentStreamUrl] = useState(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false); // Initialize with false
  const [searchedTimestamp, setSearchedTimestamp] = useState(null); // Track start time of searched recording (store as milliseconds)
  const [searchEndDate, setSearchEndDate] = useState(null); // Track end time of searched recording (store as milliseconds)
  const [snapshotUrl, setSnapshotUrl] = useState(null); // State for captured snapshot
  const [showSnapshotPreview, setShowSnapshotPreview] = useState(false); // State to control preview visibility
  const [isRecording, setIsRecording] = useState(false); // State for recording status
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null); // State for the recorded video blob URL
  const [canRecordStream, setCanRecordStream] = useState(false); // State to check if stream capture is possible

   // Effect to set the initial stream URL (Live feed)
   useEffect(() => {
       if (camera?.streamUrl && !currentStreamUrl && !searchedTimestamp && !isLoadingSearch) {
           console.log("Setting initial live stream URL:", camera.streamUrl);
           setCurrentStreamUrl(camera.streamUrl);
           setSearchedTimestamp(null); // Ensure we are in live mode
           setSearchEndDate(null); // Clear end date when going live
       } else if (!camera && !isLoadingCamera) {
           setCurrentStreamUrl(null);
       }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [camera, isLoadingCamera]);

    // Effect to check recording capabilities once video element is ready
    useEffect(() => {
        const checkRecordingSupport = () => {
            const videoElement = videoRef.current;
            const supported = typeof window !== 'undefined' &&
                              !!window.MediaRecorder &&
                              !!videoElement &&
                              typeof videoElement.captureStream === 'function';
            setCanRecordStream(supported);
            if (supported) {
                console.log("MediaRecorder and captureStream are supported.");
            } else {
                console.warn("MediaRecorder or captureStream not supported.");
            }
        };
        // Check initially and potentially after video loads data
        checkRecordingSupport();
        const videoElement = videoRef.current;
        if (videoElement) {
            videoElement.addEventListener('loadeddata', checkRecordingSupport);
            videoElement.addEventListener('canplay', checkRecordingSupport);
        }
        return () => {
            if (videoElement) {
                videoElement.removeEventListener('loadeddata', checkRecordingSupport);
                 videoElement.removeEventListener('canplay', checkRecordingSupport);
            }
        };
    }, []); // Empty dependency array, relies on ref being stable


    // Cleanup snapshot timeout and recorder on unmount
    useEffect(() => {
        return () => {
            if (snapshotTimeoutRef.current) {
                clearTimeout(snapshotTimeoutRef.current);
            }
             // Stop recording and clean up if component unmounts while recording
             if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
             }
             if (recordedVideoUrl) {
                 URL.revokeObjectURL(recordedVideoUrl); // Clean up blob URL
             }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recordedVideoUrl]);


  const backLink = camera ? `/cameras/environment/${camera.environmentId}` : '/cameras';

  // Mutation for timestamp search
  const { mutate: searchTimestampMutation } = useMutation({
    mutationFn: async ({ startDateTime, endDateTime }) => {
        if (!cameraId) throw new Error("Camera ID is missing");
        // Use start time for now, potentially pass range later
        const startTimestampInSeconds = Math.floor(startDateTime.getTime() / 1000);
        const endTimestampInSeconds = Math.floor(endDateTime.getTime() / 1000);
        console.log(`Searching for recordings from ${startDateTime} to ${endDateTime} (using start timestamp ${startTimestampInSeconds}) for camera ${cameraId}`);
        setIsLoadingSearch(true);
        // NOTE: In a real implementation, the backend would handle the time range.
        // Pass both timestamps to the service function (though it might only use start for now)
        return getStreamUrlForTimestamp(cameraId, startTimestampInSeconds, endTimestampInSeconds);
    },
    onSuccess: (newUrl, variables) => {
        console.log("Timestamp search successful, new URL:", newUrl);
        setCurrentStreamUrl(newUrl);
        setSearchedTimestamp(variables.startDateTime.getTime()); // Store start time as milliseconds
        setSearchEndDate(variables.endDateTime.getTime()); // Store end time as milliseconds
        setSnapshotUrl(null); // Clear snapshot when searching for new recording
        setShowSnapshotPreview(false); // Hide previous snapshot preview
        if (snapshotTimeoutRef.current) clearTimeout(snapshotTimeoutRef.current); // Clear existing timeout
        setIsLoadingSearch(false);
        setRecordedVideoUrl(null); // Clear previous recording
        toast({
          title: "Recording Found",
          description: `Loading video from ${format(variables.startDateTime, 'PPpp')} to ${format(variables.endDateTime, 'PPpp')}.`,
          className: "bg-green-100 border-green-300 text-green-800",
        });
         // Let browser controls handle play
         setTimeout(() => {
            videoRef.current?.play().catch(err => console.warn("Autoplay after search prevented:", err));
        }, 500);
    },
    onError: (error) => {
        console.error('Error fetching stream URL for timestamp:', error);
         toast({
            title: "Search Error",
            description: `Failed to find recording: ${error.message}. Reverting to live feed.`,
            variant: "destructive",
         });
         setIsLoadingSearch(false);
         // Revert to live feed
         if (camera?.streamUrl) {
             console.log("Search failed, reverting to live stream URL:", camera.streamUrl);
             setCurrentStreamUrl(camera.streamUrl);
             setSearchedTimestamp(null); // Back to live mode
             setSearchEndDate(null); // Clear end date
             setSnapshotUrl(null); // Clear snapshot
             setShowSnapshotPreview(false);
             if (snapshotTimeoutRef.current) clearTimeout(snapshotTimeoutRef.current);
             setRecordedVideoUrl(null); // Clear recording
         } else {
             setCurrentStreamUrl(null);
         }
         // Browser controls handle state
    },
  });

  const handleSearch = (startDateTime, endDateTime) => {
    console.log(`Search requested for range: ${startDateTime} - ${endDateTime}`);
    searchTimestampMutation({ startDateTime, endDateTime });
  };

   const switchToLive = () => {
      if (camera?.streamUrl) {
          console.log("Switching back to live stream.");
          setCurrentStreamUrl(camera.streamUrl);
          setSearchedTimestamp(null);
          setSearchEndDate(null); // Clear end date
          setSnapshotUrl(null); // Clear snapshot
          setShowSnapshotPreview(false); // Hide snapshot preview
          if (snapshotTimeoutRef.current) clearTimeout(snapshotTimeoutRef.current); // Clear timeout
          setRecordedVideoUrl(null); // Clear recording
          toast({
              title: "Live Feed",
              description: "Switched back to the live camera feed.",
          });
           // Let browser controls manage play state
           setTimeout(() => {
                videoRef.current?.play().catch(err => console.warn("Autoplay after switch to live prevented:", err));
           }, 500);
      }
   };

   const handleCaptureSnapshot = () => {
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;

        if (!videoElement || !canvasElement || videoElement.readyState < videoElement.HAVE_CURRENT_DATA) {
             toast({
                title: "Cannot Capture Snapshot",
                description: "Video is not ready or unavailable.",
                variant: "destructive",
             });
             return;
        }

        try {
            // Clear previous timeout if any
            if (snapshotTimeoutRef.current) {
                clearTimeout(snapshotTimeoutRef.current);
            }

            // Set canvas dimensions to video's actual dimensions
            canvasElement.width = videoElement.videoWidth;
            canvasElement.height = videoElement.videoHeight;

            const ctx = canvasElement.getContext('2d');
            if (!ctx) {
                 throw new Error('Failed to get canvas context.');
            }

            // Draw the current video frame onto the canvas
            ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

            // Get the image data URL from the canvas (JPEG format)
            const dataUrl = canvasElement.toDataURL('image/jpeg', 0.9); // Quality 0.9
            setSnapshotUrl(dataUrl);
            setShowSnapshotPreview(true); // Show the preview

             toast({
                title: "Snapshot Captured",
                description: "Preview shown below. It will disappear shortly.",
             });

             // Set timeout to hide the preview after 3 seconds
             snapshotTimeoutRef.current = setTimeout(() => {
                 setShowSnapshotPreview(false);
                 toast({
                     title: "Snapshot Preview Hidden",
                     description: "You can still download the snapshot.",
                     duration: 2000, // Shorter duration for this notice
                 });
             }, 3000); // 3 seconds

        } catch (error) {
             console.error('Error capturing snapshot:', error);
             toast({
                title: "Snapshot Failed",
                description: `Could not capture snapshot: ${error.message}`,
                variant: "destructive",
             });
             setSnapshotUrl(null);
             setShowSnapshotPreview(false);
             if (snapshotTimeoutRef.current) clearTimeout(snapshotTimeoutRef.current);
        }
    };

    const handleDownloadSnapshot = () => {
        if (!snapshotUrl) return;
        const link = document.createElement('a');
        link.href = snapshotUrl;
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        link.download = `snapshot_${camera?.name.replace(/\s+/g, '_') || cameraId}_${timestamp}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Recording Logic ---

    const handleStartRecording = () => {
        if (!videoRef.current) {
             toast({ title: "Error", description: "Video element not available.", variant: "destructive" });
             return;
        }
         // Check for MediaRecorder support (already done by canRecordStream check, but good to double-check)
         if (!window.MediaRecorder || !canRecordStream) {
             toast({ title: "Unsupported Browser", description: "Video recording is not supported in your browser or for this video element.", variant: "destructive" });
             return;
         }

         let stream = null;
         try {
            // Attempt to capture the stream from the video element
            stream = videoRef.current.captureStream();
            console.log("Attempting captureStream(), result:", stream);
         } catch (e) {
             console.error("Error calling captureStream():", e);
             toast({
                 title: "Recording Error",
                 description: `Failed to capture video stream: ${e.message}. Recording may not be possible for this stream type.`,
                 variant: "destructive",
                 duration: 5000,
             });
             return;
         }


         if (!stream || !(stream instanceof MediaStream) || stream.getTracks().length === 0) {
            toast({
                title: "Recording Error",
                description: "Cannot access the video stream for recording. The stream might be protected or incompatible (e.g., certain HLS configurations).",
                variant: "destructive",
                duration: 6000,
            });
            console.error("Failed to get a valid MediaStream from video element. Stream:", stream);
            return;
         }


        // Determine available MIME type
        const options = { mimeType: 'video/webm; codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn(`${options.mimeType} is not Supported, trying vp8`);
            options.mimeType = 'video/webm; codecs=vp8';
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.warn(`${options.mimeType} is not Supported, trying default`);
                options.mimeType = 'video/webm';
                 if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.warn(`${options.mimeType} is not Supported`);
                     toast({ title: "Recording Error", description: "No supported video format found for recording.", variant: "destructive" });
                     return;
                 }
            }
        }
        console.log("Using MIME type for recording:", options.mimeType);

        try {
             // Clean up previous recording if any
             if (recordedVideoUrl) {
                 URL.revokeObjectURL(recordedVideoUrl);
                 setRecordedVideoUrl(null);
             }
             recordedChunksRef.current = []; // Clear previous chunks

            const recorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                    console.log("Recording chunk received:", event.data.size);
                }
            };

            recorder.onstop = () => {
                console.log("Recording stopped. Chunks:", recordedChunksRef.current.length);
                if (recordedChunksRef.current.length > 0) {
                    const blob = new Blob(recordedChunksRef.current, { type: options.mimeType });
                    const url = URL.createObjectURL(blob);
                    setRecordedVideoUrl(url);
                     toast({ title: "Recording Complete", description: "Recording finished. Ready for download." });
                } else {
                     toast({ title: "Recording Issue", description: "No video data was recorded.", variant: "destructive" });
                }
                setIsRecording(false);
                mediaRecorderRef.current = null; // Clear the ref
                recordedChunksRef.current = []; // Clear chunks after processing
                // Stop the tracks obtained from captureStream
                stream?.getTracks().forEach(track => track.stop());
                console.log("Stopped captured stream tracks.");
            };

             recorder.onerror = (event) => {
                console.error("MediaRecorder Error:", event);
                toast({ title: "Recording Error", description: `An error occurred during recording.`, variant: "destructive" });
                setIsRecording(false);
                 // Clean up resources on error as well
                 if (mediaRecorderRef.current) {
                     mediaRecorderRef.current = null;
                 }
                 recordedChunksRef.current = [];
                 stream?.getTracks().forEach(track => track.stop());
                 console.log("Stopped captured stream tracks after error.");
            };

            recorder.start(1000); // Record in 1-second chunks
            setIsRecording(true);
            toast({ title: "Recording Started", description: "Video recording is in progress..." });

        } catch (error) {
            console.error('Error starting recording:', error);
             toast({ title: "Recording Error", description: `Could not start recording: ${error.message}`, variant: "destructive" });
             // Clean up stream if recorder setup failed
             stream?.getTracks().forEach(track => track.stop());
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
             // State update (setIsRecording(false)) and further actions happen in recorder.onstop
        } else {
             toast({ title: "Info", description: "Recording is not currently active." });
        }
    };

    const handleDownloadRecording = () => {
        if (!recordedVideoUrl) return;
        const link = document.createElement('a');
        link.href = recordedVideoUrl;
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
        link.download = `recording_${camera?.name.replace(/\s+/g, '_') || cameraId}_${timestamp}.webm`; // Save as webm
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Download Segment Logic is now in DescargarVideo component ---


  // --- Render Logic ---

  if (isLoadingCamera) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-12rem)] space-y-4">
        {/* Enhanced loading state */}
        <LoadingSpinner size={64} className="text-primary animate-spin-slow" />
        <p className="text-muted-foreground text-lg animate-pulse">Loading camera details...</p>
      </div>
    );
  }

  if (isErrorCamera || !camera) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
         <Link href={backLink} passHref>
            {/* Enhanced back button */}
            <Button variant="outline" size="sm" className="mb-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out transform hover:-translate-y-0.5">
                <ChevronLeft className="mr-1 h-4 w-4" /> Back to Cameras
            </Button>
        </Link>
        {/* Enhanced error alert */}
        <Alert variant="destructive" className="max-w-lg mx-auto rounded-lg shadow-lg border-destructive/60 bg-destructive/10 backdrop-blur-sm">
           <AlertTriangle className="h-5 w-5 text-destructive stroke-[2]"/>
          <AlertTitle className="font-semibold text-destructive">Error Loading Camera</AlertTitle>
          <AlertDescription className="text-destructive/90">
            {isErrorCamera ? `Failed to load camera data: ${errorCamera?.message}` : 'Camera details could not be found.'}
             <br/>Please return to the list and try again, or try refreshing.
             {isErrorCamera && (
                  <Button variant="secondary" size="sm" onClick={() => refetchCamera()} className="mt-3">
                      <RefreshCw className="mr-2 h-4 w-4" /> Retry
                  </Button>
             )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const showSearchLoadingOverlay = isLoadingSearch;
  const isLive = !searchedTimestamp; // Determine if currently viewing live feed


  return (
    <div className="space-y-6 pb-20"> {/* Adjusted spacing */}
         {/* Enhanced Header Section */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-4">
                {/* Icon with gradient background and border */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 text-primary border border-primary/30 shadow-md">
                    <Video className="h-8 w-8 stroke-[2]" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">{camera.name}</h1>
                    <p className="text-muted-foreground mt-1 line-clamp-2 max-w-prose">{camera.description}</p>
                     {/* Enhanced Back link */}
                     <Link href={backLink} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center mt-1.5 transition-colors duration-200 group">
                         <ChevronLeft className="mr-0.5 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" /> Back to {camera.environmentName}
                     </Link>
                </div>
            </div>
         </div>

         {/* Status Indicator (Live or Recording Time) - Moved outside player */}
         <div className="flex justify-start mb-3">
             <div className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md",
                isLive ? "bg-red-600/80 text-white" : "bg-blue-600/80 text-white"
             )}>
                {isLive ? (
                    <>
                       <RadioTower className="h-3.5 w-3.5 animate-pulse" /> LIVE
                    </>
                ) : (
                   <>
                       <Clock className="h-3.5 w-3.5" /> Recording: {searchedTimestamp ? format(new Date(searchedTimestamp), 'dd/MM/yyyy HH:mm') : '...'}
                       {searchEndDate && ` to ${format(new Date(searchEndDate), 'dd/MM/yyyy HH:mm')}`}
                   </>
                )}
             </div>
         </div>

        {/* Enhanced Video Player Area */}
        <div className="relative aspect-video w-full max-w-5xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-border/60">
            {currentStreamUrl ? (
                 <VideoPlayer
                    key={currentStreamUrl} // Force re-mount on URL change
                    src={currentStreamUrl}
                    videoRef={videoRef} // Pass the ref
                    controls={true} // Use default browser controls
                    autoPlay={true} // Enable autoplay
                 />
            ) : (
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-muted-foreground bg-gradient-to-br from-muted/70 to-muted/80 backdrop-blur-sm">
                     <WifiOff size={56} className="mb-3 text-muted-foreground/60 opacity-70"/>
                     <p className="text-lg font-medium">Stream Unavailable</p>
                     <p className="text-sm text-muted-foreground/80 mt-1">Waiting for stream details...</p>
                 </div>
            )}

            {/* Enhanced Timestamp Search Loading Overlay */}
            {showSearchLoadingOverlay && (
                 <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black/80 z-10 backdrop-blur-md transition-opacity duration-300">
                    <LoadingSpinner size={48} className="text-white/90 animate-spin-slow" />
                    <p className="mt-3 text-base font-medium animate-pulse">Searching for recording...</p>
                </div>
            )}
        </div>

        {/* Hidden canvas for snapshot */}
        <canvas ref={canvasRef} className="hidden"></canvas>

         {/* Control Buttons Area (Go Live, Capture Snapshot, Recording Controls, Download Segment) */}
         <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
             {!isLive && (
                 <Button
                     onClick={switchToLive}
                     variant="outline"
                     size="sm"
                     className="rounded-lg shadow-md transition-all hover:shadow-lg hover:bg-primary/10 border-primary/50 text-primary flex items-center gap-1.5"
                     disabled={isLoadingSearch || isRecording} // Disable if searching or recording
                 >
                     <RadioTower className="h-4 w-4" /> Go Live
                 </Button>
             )}
              <Button
                  onClick={handleCaptureSnapshot}
                  variant="secondary"
                  size="sm"
                  className="rounded-lg shadow-md transition-all hover:shadow-lg hover:bg-secondary/80 flex items-center gap-1.5"
                  disabled={isLoadingSearch || !currentStreamUrl} // Disable if loading or no stream
              >
                  <CameraIcon className="h-4 w-4" /> Capture Snapshot
              </Button>
               {/* Show download snapshot button only if a snapshot has been captured */}
               {snapshotUrl && (
                   <Button
                       onClick={handleDownloadSnapshot}
                       variant="link"
                       className="text-accent flex items-center gap-1.5"
                       size="sm"
                   >
                       <Download className="h-4 w-4"/> Download Snapshot
                   </Button>
               )}

               {/* Download Segment Button - Show only when viewing a recording */}
                {!isLive && (
                    <DescargarVideo
                        camera={camera}
                        startTimestamp={searchedTimestamp}
                        endTimestamp={searchEndDate}
                    />
                )}

               {/* Recording Controls - Conditionally Rendered */}
               {currentStreamUrl && ( // Show only if stream is active
                   <>
                       {canRecordStream ? ( // Check if basic support exists
                            <>
                                {!isRecording ? (
                                    <Button
                                        onClick={handleStartRecording}
                                        variant="destructive"
                                        size="sm"
                                        className="rounded-lg shadow-md transition-all hover:shadow-lg hover:bg-destructive/90 flex items-center gap-1.5"
                                        disabled={isLoadingSearch} // Disable if searching
                                    >
                                        <CircleDot className="h-4 w-4 animate-pulse" /> Start Recording
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleStopRecording}
                                        variant="outline"
                                        size="sm"
                                        className="rounded-lg shadow-md transition-all hover:shadow-lg hover:bg-muted/80 border-destructive/50 text-destructive flex items-center gap-1.5"
                                    >
                                        <StopCircle className="h-4 w-4" /> Stop Recording
                                    </Button>
                                )}
                                {/* Download Recording Button */}
                                {recordedVideoUrl && !isRecording && (
                                    <Button
                                        onClick={handleDownloadRecording}
                                        variant="link"
                                        className="text-accent flex items-center gap-1.5"
                                        size="sm"
                                    >
                                        <Download className="h-4 w-4"/> Download Recording
                                    </Button>
                                )}
                            </>
                       ) : (
                            <p className="text-xs text-muted-foreground italic w-full text-center">
                                (Browser recording not supported)
                            </p>
                       )}
                   </>
               )}
         </div>

         {/* Snapshot Preview Area (Conditional Render based on showSnapshotPreview) */}
         {snapshotUrl && showSnapshotPreview && (
            <div className="mt-6 flex flex-col items-center transition-opacity duration-500 ease-in-out opacity-100">
                <h3 className="text-lg font-semibold mb-3 text-primary">Snapshot Preview</h3>
                <div className="relative w-full max-w-sm rounded-lg overflow-hidden shadow-lg border border-border">
                    <Image
                        src={snapshotUrl}
                        alt="Captured snapshot"
                        width={canvasRef.current?.width || 320} // Use canvas width or default
                        height={canvasRef.current?.height || 180} // Use canvas height or default
                        layout="responsive"
                        unoptimized // Data URLs don't need optimization
                    />
                </div>
                 {/* Keep download button visible even when preview is hidden */}
            </div>
         )}


         {/* Enhanced DateTimeSearch component styling */}
         <div className="flex justify-center px-2 mt-6">
            <DateTimeSearch
                onSearch={handleSearch}
                isLoading={isLoadingSearch}
                // Added shadow, rounded corners, border, background blur, and transition
                className="w-full max-w-xl shadow-xl rounded-xl border border-border/60 bg-card/95 backdrop-blur-sm transition-all duration-300 ease-in-out"
            />
         </div>
    </div>
  );
}
