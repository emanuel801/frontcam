/**
 * Asynchronously retrieves the list of all cameras with environment details.
 *
 * @returns A promise that resolves to an array of Camera objects.
 */
export async function getCameras() {
  // TODO: Implement this by calling an API.

  const streamUrl = 'https://ott1.hdlatam.tv/live/DataCenter_01/playlist_dvr.m3u8'; // Updated Stream URL

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
      {
        id: '11',
        name: 'Nursery Cam',
        description: 'Monitoring the baby\'s room.',
        imageUrl: 'https://picsum.photos/seed/nursery1/300/200',
        streamUrl: streamUrl,
        environmentId: 'upstairs',
        environmentName: 'Upstairs',
      },
      {
        id: '12',
        name: 'Side Gate Cam',
        description: 'View of the side gate access.',
        imageUrl: 'https://picsum.photos/seed/sidegate1/300/200',
        streamUrl: streamUrl,
        environmentId: 'exterior',
        environmentName: 'Exterior',
      },
       {
        id: '13',
        name: 'Basement Cam',
        description: 'Monitoring the basement area.',
        imageUrl: 'https://picsum.photos/seed/basement1/300/200',
        streamUrl: streamUrl,
        environmentId: 'basement', // Added basement environment
        environmentName: 'Basement',
      },
        {
        id: '14',
        name: 'Dining Room Cam',
        description: 'View of the dining area.',
        imageUrl: 'https://picsum.photos/seed/dining1/300/200',
        streamUrl: streamUrl,
        environmentId: 'living-room', // Could be living-room or its own
        environmentName: 'Living Room',
      },
  ];
}

/**
 * Asynchronously retrieves the list of unique environments.
 *
 * @returns A promise that resolves to an array of Environment objects.
 */
export async function getEnvironments() {
    // In a real app, this might fetch from an API or derive from cameras.
    // For now, return a static list based on the assigned cameras.
    const cameras = await getCameras(); // Fetch cameras to derive environments
    const environmentsMap = new Map();

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
     const staticEnvironments = [
        { id: 'living-room', name: 'Living Room', description: 'Main communal area cameras.', imageUrl: 'https://picsum.photos/seed/env1/300/200' },
        { id: 'kitchen', name: 'Kitchen', description: 'Cameras monitoring the kitchen.', imageUrl: 'https://picsum.photos/seed/env2/300/200' },
        { id: 'office', name: 'Office', description: 'Cameras in the workspace.', imageUrl: 'https://picsum.photos/seed/env3/300/200' },
        { id: 'exterior', name: 'Exterior', description: 'Cameras outside the house.', imageUrl: 'https://picsum.photos/seed/env4/300/200' },
        { id: 'garage', name: 'Garage', description: 'Cameras monitoring the garage.', imageUrl: 'https://picsum.photos/seed/env5/300/200' },
        { id: 'upstairs', name: 'Upstairs', description: 'Cameras on the upper floor.', imageUrl: 'https://picsum.photos/seed/env6/300/200' },
        { id: 'basement', name: 'Basement', description: 'Cameras in the basement.', imageUrl: 'https://picsum.photos/seed/env7/300/200' }, // Added basement
     ];


     // Merge derived with static data if necessary, or just use static
     // return Array.from(environmentsMap.values());
     return staticEnvironments; // Using static list for consistency
}

/**
 * Asynchronously retrieves cameras belonging to a specific environment.
 *
 * @param {string} environmentId The ID of the environment.
 * @returns A promise that resolves to an array of Camera objects.
 */
export async function getCamerasByEnvironment(environmentId) {
    const allCameras = await getCameras();
    return allCameras.filter(camera => camera.environmentId === environmentId);
}


/**
 * Asynchronously retrieves the stream URL for a given camera and timestamp.
 *
 * @param {string} cameraId The ID of the camera.
 * @param {number} startTimestamp The start timestamp to search for (in seconds).
 * @param {number} endTimestamp The end timestamp to search for (in seconds).
 * @returns A promise that resolves to the m3u8 stream URL.
 */
export async function getStreamUrlForTimestamp(
  cameraId,
  startTimestamp,
  endTimestamp // Added endTimestamp parameter
) {
  // TODO: Implement this by calling an API that uses the start and end timestamps.
  // For now, return the same DVR stream URL regardless of timestamp
  console.log(`Searching for timestamp range: ${startTimestamp} - ${endTimestamp} for camera: ${cameraId}`);
  // Simulate a slight delay for timestamp search
  await new Promise(resolve => setTimeout(resolve, 300));

  // This URL likely represents a DVR playlist that allows seeking based on time.
  // The actual implementation would depend on the streaming server (e.g., Nimble Streamer, Wowza).
  // The client player (HLS.js) might handle the time seeking based on the DVR manifest.
  // In some cases, the backend might need to generate a specific playlist URL for the requested range.
  return 'https://ott1.hdlatam.tv/live/DataCenter_01/playlist_dvr.m3u8'; // Return the base DVR URL
}
