export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  name?: string; // Optional name field
  email?: string; // Optional email field
  plan?: string; // Optional plan field
  role?: UserRole; // Added role field
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
