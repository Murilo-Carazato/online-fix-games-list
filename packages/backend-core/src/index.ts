// Domain Entities
export * from './domain/entities/EnrichedGameEntity';

// Domain Shared Types
export * from './domain/repositories/IGameRepository';

// Application Use Cases
export * from './application/useCases/GetGamesPaginatedUseCase';

// DI Container (Composition Root for backend)
export * from './infrastructure/di/setup';
