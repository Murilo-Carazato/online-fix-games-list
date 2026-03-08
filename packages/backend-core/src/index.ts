// Domain Entities
export * from './domain/entities/EnrichedGameEntity';

// Domain Shared Types (DTOs)
export type { SortKey, FilterKey, PaginatedQueryProps } from './domain/repositories/IGameRepository';

// Application Use Cases
export * from './application/useCases/GetGamesPaginatedUseCase';

// Services (Shared Domain)
export * from './domain/services/TitleCleanerService';

// DI Container (Composition Root for backend)
export * from './infrastructure/di/setup';
