export interface User {
  id: string;
  username: string;
}

export interface Camera {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  streamUrl: string;
  environmentId: string; // Added environment ID
  environmentName: string; // Added environment name
}

export interface Environment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}
