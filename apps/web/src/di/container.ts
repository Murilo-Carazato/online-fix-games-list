import { PostgresGameRepository } from "@hydra/backend-core/src/infrastructure/repositories/PostgresGameRepository";
import { ConsoleLoggerService } from '@hydra/backend-core/src/infrastructure/logging/ConsoleLoggerService';
import { GetGamesPaginatedUseCase } from "@hydra/backend-core/src/application/useCases/GetGamesPaginatedUseCase";

// --- Infrastructure Instances ---
const loggerService = new ConsoleLoggerService();
const gameRepository = new PostgresGameRepository(loggerService);

// --- Use Case Instances ---
export const getGamesPaginatedUseCase = new GetGamesPaginatedUseCase(gameRepository);
