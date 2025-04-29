import type { Camera, Environment } from '@/types'; // Import Environment type

/**
 * Asynchronously retrieves the list of all cameras with environment details.
 *
 * @returns A promise that resolves to an array of Camera objects.
 */
export async function getCameras(): Promise<Camera[]> {
  // TODO: Implement this by calling an API.

  const streamUrl = 'https://ott1.hdlatam.tv/live_abr/Will3X_TV/playlist.m3u8';

  // Assign cameras to environments
  return [
    {
      id: '1',
      name: 'Living Room Cam 1',
      description: 'Wide angle view of the main living area.',
      imageUrl: 'https://picsum.photos/seed/lr1/300/200',
      streamUrl: streamUrl,
      environmentId: 'living-room',
      environmentName: 'Living Room',
    },
     {
      id: '7',
      name: 'Living Room Cam 2',
      description: 'Corner view near the window.',
      imageUrl: 'https://picsum.photos/seed/lr2/300/200',
      streamUrl: streamUrl,
      environmentId: 'living-room',
      environmentName: 'Living Room',
    },
    {
      id: '2',
      name: 'Kitchen Cam',
      description: 'Overlooking the kitchen counter and stove.',
      imageUrl: 'https://picsum.photos/seed/kitchen1/300/200',
      streamUrl: streamUrl,
      environmentId: 'kitchen',
      environmentName: 'Kitchen',
    },
    {
      id: '3',
      name: 'Front Door Cam',
      description: 'Monitoring the main entrance.',
      imageUrl: 'https://picsum.photos/seed/frontdoor1/300/200',
      streamUrl: streamUrl,
      environmentId: 'exterior',
      environmentName: 'Exterior',
    },
    {
      id: '4',
      name: 'Backyard Cam',
      description: 'Covering the backyard and patio area.',
      imageUrl: 'https://picsum.photos/seed/backyard1/300/200',
      streamUrl: streamUrl,
      environmentId: 'exterior',
      environmentName: 'Exterior',
    },
     {
      id: '5',
      name: 'Garage Cam',
      description: 'Inside view of the garage.',
      imageUrl: 'https://picsum.photos/seed/garage1/300/200',
      streamUrl: streamUrl,
      environmentId: 'garage',
      environmentName: 'Garage',
    },
     {
      id: '6',
      name: 'Office Cam',
      description: 'View of the home office space.',
      imageUrl: 'https://picsum.photos/seed/office1/300/200',
      streamUrl: streamUrl,
      environmentId: 'office',
      environmentName: 'Office',
    },
    {
      id: '8',
      name: 'Driveway Cam',
      description: 'View of the driveway approach.',
      imageUrl: 'https://picsum.photos/seed/driveway1/300/200',
      streamUrl: streamUrl,
      environmentId: 'exterior',
      environmentName: 'Exterior',
    },
     {
      id: '9',
      name: 'Patio Cam',
      description: 'Close up view of the patio door.',
      imageUrl: 'https://picsum.photos/seed/patio1/300/200',
      streamUrl: streamUrl,
      environmentId: 'exterior',
      environmentName: 'Exterior',
    },
      {
      id: '10',
      name: 'Upstairs Hallway',
      description: 'Monitoring the upstairs landing.',
      imageUrl: 'https://picsum.photos/seed/hallway1/300/200',
      streamUrl: streamUrl,
      environmentId: 'upstairs',
      environmentName: 'Upstairs',
    },

  ];
}

/**
 * Asynchronously retrieves the list of unique environments.
 *
 * @returns A promise that resolves to an array of Environment objects.
 */
export async function getEnvironments(): Promise<Environment[]> {
    // In a real app, this might fetch from an API or derive from cameras.
    // For now, return a static list based on the assigned cameras.
    const cameras = await getCameras(); // Fetch cameras to derive environments
    const environmentsMap = new Map<string, Environment>();

    cameras.forEach(camera => {
        if (!environmentsMap.has(camera.environmentId)) {
            environmentsMap.set(camera.environmentId, {
                id: camera.environmentId,
                name: camera.environmentName,
                // Add default description and image, maybe the first camera's image?
                description: `Cameras in the ${camera.environmentName}`, // Generic description
                imageUrl: camera.imageUrl, // Use first camera image as placeholder
            });
        }
    });

     // Assign more specific images/descriptions if needed
     const staticEnvironments: Environment[] = [
        { id: 'living-room', name: 'Living Room', description: 'Main communal area cameras.', imageUrl: 'https://picsum.photos/seed/env1/300/200' },
        { id: 'kitchen', name: 'Kitchen', description: 'Cameras monitoring the kitchen.', imageUrl: 'https://picsum.photos/seed/env2/300/200' },
        { id: 'office', name: 'Office', description: 'Cameras in the workspace.', imageUrl: 'https://picsum.photos/seed/env3/300/200' },
        { id: 'exterior', name: 'Exterior', description: 'Cameras outside the house.', imageUrl: 'https://picsum.photos/seed/env4/300/200' },
        { id: 'garage', name: 'Garage', description: 'Cameras monitoring the garage.', imageUrl: 'https://picsum.photos/seed/env5/300/200' },
        { id: 'upstairs', name: 'Upstairs', description: 'Cameras on the upper floor.', imageUrl: 'https://picsum.photos/seed/env6/300/200' },
     ];


     // Merge derived with static data if necessary, or just use static
     // return Array.from(environmentsMap.values());
     return staticEnvironments; // Using static list for consistency
}

/**
 * Asynchronously retrieves cameras belonging to a specific environment.
 *
 * @param environmentId The ID of the environment.
 * @returns A promise that resolves to an array of Camera objects.
 */
export async function getCamerasByEnvironment(environmentId: string): Promise<Camera[]> {
    const allCameras = await getCameras();
    return allCameras.filter(camera => camera.environmentId === environmentId);
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
