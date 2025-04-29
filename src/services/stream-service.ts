/**
 * Represents a camera.
 */
export interface Camera {
  /**
   * The unique identifier of the camera.
   */
  id: string;
  /**
   * The name of the camera.
   */
  name: string;
  /**
   * The description of the camera.
   */
  description: string;
  /**
   * The URL of the camera image.
   */
  imageUrl: string;
  /**
   * The URL of the m3u8 stream.
   */
  streamUrl: string;
}

/**
 * Asynchronously retrieves the list of cameras.
 *
 * @returns A promise that resolves to an array of Camera objects.
 */
export async function getCameras(): Promise<Camera[]> {
  // TODO: Implement this by calling an API.

  const streamUrl = 'https://ott1.hdlatam.tv/live_abr/Will3X_TV/playlist.m3u8';

  return [
    {
      id: '1',
      name: 'Living Room Cam',
      description: 'Wide angle view of the main living area.',
      imageUrl: 'https://picsum.photos/300/200?random=1', // Use picsum for placeholders
      streamUrl: streamUrl
    },
    {
      id: '2',
      name: 'Kitchen Cam',
      description: 'Overlooking the kitchen counter and stove.',
      imageUrl: 'https://picsum.photos/300/200?random=2', // Use picsum for placeholders
      streamUrl: streamUrl
    },
    {
      id: '3',
      name: 'Front Door Cam',
      description: 'Monitoring the main entrance.',
      imageUrl: 'https://picsum.photos/300/200?random=3', // Use picsum for placeholders
      streamUrl: streamUrl
    },
    {
      id: '4',
      name: 'Backyard Cam',
      description: 'Covering the backyard and patio area.',
      imageUrl: 'https://picsum.photos/300/200?random=4', // Use picsum for placeholders
      streamUrl: streamUrl
    },
     {
      id: '5',
      name: 'Garage Cam',
      description: 'Inside view of the garage.',
      imageUrl: 'https://picsum.photos/300/200?random=5', // Use picsum for placeholders
      streamUrl: streamUrl
    },
     {
      id: '6',
      name: 'Office Cam',
      description: 'View of the home office space.',
      imageUrl: 'https://picsum.photos/300/200?random=6', // Use picsum for placeholders
      streamUrl: streamUrl
    }
  ];
}

/**
 * Asynchronously retrieves the stream URL for a given camera and timestamp.
 *
 * @param cameraId The ID of the camera.
 * @param timestamp The timestamp to search for.
 * @returns A promise that resolves to the m3u8 stream URL.
 */
export async function getStreamUrlForTimestamp(
  cameraId: string,
  timestamp: number
): Promise<string> {
  // TODO: Implement this by calling an API.
  // For now, return the same live stream URL regardless of timestamp
  // In a real scenario, this would fetch a recording URL based on the timestamp.
  console.log(`Searching for timestamp: ${timestamp} for camera: ${cameraId}`);
  // Simulate a slight delay for timestamp search
  await new Promise(resolve => setTimeout(resolve, 300));
  return 'https://ott1.hdlatam.tv/live_abr/Will3X_TV/playlist.m3u8';
}
