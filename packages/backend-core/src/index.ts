// Domain Entities
export * from './domain/entities/EnrichedGameEntity';
export * from './domain/entities/VideoEntity';
export * from './domain/entities/StoreEntity';
export * from './domain/data/ExternalGameData';

// Domain Shared Types (DTOs)
export type { SortKey, AdvancedFilters, FilterOptions, PaginatedQueryProps } from './domain/repositories/IGameRepository';

// Application Use Cases
export * from './application/useCases/GetGamesPaginatedUseCase';
export * from './application/useCases/GetGameByIdUseCase';
export * from './application/useCases/GetFilterOptionsUseCase';

// Services (Shared Domain)
export * from './domain/services/TitleCleanerService';

// DI Container (Composition Root for backend)
export * from './infrastructure/di/setup';
