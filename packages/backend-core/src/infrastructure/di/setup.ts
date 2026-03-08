import { ConsoleLoggerService } from '../logging/ConsoleLoggerService';
import { PostgresGameRepository } from '../repositories/PostgresGameRepository';
import { GetGamesPaginatedUseCase } from '../../application/useCases/GetGamesPaginatedUseCase';

export interface BackendContainer {
    getGamesPaginatedUseCase: GetGamesPaginatedUseCase;
}

/**
 * Initializes the backend core infrastructure components and use cases.
 * This encapsulates the infrastructure details from presentation layers (apps).
 */
export function createBackendContainer(): BackendContainer {
    const loggerService = new ConsoleLoggerService();
    const gameRepository = new PostgresGameRepository(loggerService);

    return {
        getGamesPaginatedUseCase: new GetGamesPaginatedUseCase(gameRepository),
    };
}
