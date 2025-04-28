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

  return [
    {
      id: '1',
      name: 'Camera 1',
      description: 'This is camera 1',
      imageUrl: 'https://via.placeholder.com/150',
      streamUrl: 'https://test-streams.mux.dev/pts_sh7.m3u8'
    },
    {
      id: '2',
      name: 'Camera 2',
      description: 'This is camera 2',
      imageUrl: 'https://via.placeholder.com/150',
      streamUrl: 'https://test-streams.mux.dev/pts_sh7.m3u8'
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

  return 'https://test-streams.mux.dev/pts_sh7.m3u8';
}
