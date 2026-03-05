import { GameGatewayFactory } from '@hydra/backend-core/src/infrastructure/factories/GameGatewayFactory';
import { JsonGameRepository } from '@hydra/backend-core/src/infrastructure/repositories/JsonGameRepository';
import { PostgresGameRepository } from '@hydra/backend-core/src/infrastructure/repositories/PostgresGameRepository';
import { TitleCleanerService } from '@hydra/backend-core/src/domain/services/TitleCleanerService';
import { GameDataMergerService } from '@hydra/backend-core/src/domain/services/GameDataMergerService';
import type { IGameRepository } from '@hydra/backend-core/src/domain/repositories/IGameRepository';
import { EnrichGamesUseCase } from '@hydra/backend-core/src/application/useCases/EnrichGamesUseCase';
import { loadConfig } from './config/AppConfig';

async function main() {
    console.log("=== HYDRA GAMES ENRICHER ===");
    console.log("Initializing Services...");

    // 1. Load configuration safely at the application boundary
    const config = loadConfig();

    const apiProvider = GameGatewayFactory.createGateway(config);

    const jsonStorage = new JsonGameRepository();
    const pgStorage = new PostgresGameRepository();

    // Hybrid adapter: reads from JSON file, writes enriched results to Postgres.
    // Satisfies IGameRepository without modifying the use case.
    const hybridStorage: IGameRepository = {
        loadGames: (path) => jsonStorage.loadGames(path),
        saveGames: (path, games) => pgStorage.saveGames(path, games),
    };

    const nameCleaner = new TitleCleanerService();
    const gameDataMerger = new GameDataMergerService();

    const enricherUseCase = new EnrichGamesUseCase(
        apiProvider,
        hybridStorage,
        nameCleaner,
        gameDataMerger
    );

    console.log(`Starting execution to enrich up to ${config.enrichmentLimit ?? 'ALL'} games...`);
    console.log(`Reading from: ${config.inputFilePath}`);
    console.log(`Writing to: ${config.outputFilePath}`);

    await enricherUseCase.enrichDataset(config.inputFilePath, config.outputFilePath, config.enrichmentLimit);

    console.log("=== DONE ===");
}

main().catch(error => {
    console.error("Fatal Error:", error);
    process.exit(1);
});
