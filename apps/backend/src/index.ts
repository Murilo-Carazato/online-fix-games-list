import { GameGatewayFactory } from '@hydra/backend-core/src/infrastructure/factories/GameGatewayFactory';
import { JsonGameRepository } from '@hydra/backend-core/src/infrastructure/repositories/JsonGameRepository';
import { PostgresGameDataRepository } from '@hydra/backend-core/src/infrastructure/repositories/PostgresGameDataRepository';
import { TitleCleaner } from '@hydra/backend-core/src/domain/services/TitleCleaner';
import type { IGameRepository } from '@hydra/backend-core/src/domain/interfaces/IGameRepository';
import { EnrichGamesUseCase } from '@hydra/backend-core/src/application/useCases/EnrichGamesUseCase';
import { loadConfig } from './config/AppConfig';

async function main() {
    console.log("=== HYDRA GAMES ENRICHER ===");
    console.log("Initializing Services...");

    // 1. Load configuration safely at the application boundary
    const config = loadConfig();

    const apiProvider = GameGatewayFactory.createGateway(config);

    const jsonStorage = new JsonGameRepository();
    const pgStorage = new PostgresGameDataRepository();

    // Hybrid adapter: reads from JSON file, writes enriched results to Postgres.
    // Satisfies IGameRepository without modifying the use case.
    const hybridStorage: IGameRepository = {
        loadGames: (path) => jsonStorage.loadGames(path),
        saveGames: (path, games) => pgStorage.saveGames(path, games),
    };

    const nameCleaner = new TitleCleaner();

    const enricherUseCase = new EnrichGamesUseCase(
        apiProvider,
        hybridStorage,
        nameCleaner
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
