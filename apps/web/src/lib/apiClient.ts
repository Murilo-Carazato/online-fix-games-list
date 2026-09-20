import { hc } from 'hono/client';
import type { AppType } from '@hydra/api/src/index'; // Import the type from the API

// When running on the server (SSR), connect to the internal Docker service.
// When running in the browser, connect to the public URL.
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use the current origin or localhost
    return window.location.origin;
  }
  // Server-side: use the internal Docker service name defined in docker-compose
  // Fallback to localhost if not defined
  return process.env.API_URL || 'http://api:3001';
};

// Create the Hono RPC client with the inferred types
export const apiClient = hc<AppType>(getBaseUrl());
