import { GameProviderFactory, JsonStorageProvider, PostgresGameDataRepository } from '@hydra/infrastructure';
import { TitleCleaner, IStorageProvider } from '@hydra/core-domain';
import { EnrichGamesUseCase } from '@hydra/core-usecases';
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

    // Create a hybrid storage provider: reads from JSON (URL), writes to Postgres
    const hybridStorage: IStorageProvider = {
        loadGames: (path) => jsonStorage.loadGames(path),
        saveGames: (path, games) => pgStorage.saveGames(games)
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
