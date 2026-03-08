import { createBackendContainer } from '@hydra/backend-core';

// Initialize the core domain and infrastructure layer
const backendContainer = createBackendContainer();

// --- Export required Use Case Instances for the Web App ---
export const getGamesPaginatedUseCase = backendContainer.getGamesPaginatedUseCase;
export const getGameByIdUseCase = backendContainer.getGameByIdUseCase;
