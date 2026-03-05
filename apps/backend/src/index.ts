import {
    GameProviderFactory,
    JsonStorageProvider,
    PostgresGameDataRepository,
    TitleCleaner,
    type IStorageProvider,
    EnrichGamesUseCase
} from '@hydra/backend-core';
import { loadConfig } from './config/AppConfig';

async function main() {
    console.log("=== HYDRA GAMES ENRICHER ===");
    console.log("Initializing Services...");

    // 1. Load configuration safely at the application boundary
    const config = loadConfig();

    // 2. Initialize Dependency Graph (Errors thrown here are caught below)
    const apiProvider = GameProviderFactory.createProvider(config);

    const jsonStorage = new JsonStorageProvider();
    const pgStorage = new PostgresGameDataRepository();

    // Hybrid adapter: reads from JSON file, writes enriched results to Postgres.
    // Satisfies IStorageProvider without modifying the use case.
    const hybridStorage: IStorageProvider = {
        loadGames: (path) => jsonStorage.loadGames(path),
        saveGames: (_path, games) => pgStorage.saveGames(games),
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
