import { GameProviderFactory, JsonStorageProvider } from '@hydra/infrastructure';
import { TitleCleaner } from '@hydra/core-domain';
import { EnrichGamesUseCase } from '@hydra/core-usecases';
import { loadConfig } from './config/AppConfig';
async function main() {
    console.log("=== HYDRA GAMES ENRICHER ===");
    console.log("Initializing Services...");

    // 1. Load configuration safely at the application boundary
    const config = loadConfig();

    // 2. Initialize Dependency Graph (Errors thrown here are caught below)
    const apiProvider = GameProviderFactory.createProvider(config);

    const storageProvider = new JsonStorageProvider();
    const nameCleaner = new TitleCleaner();

    const enricherUseCase = new EnrichGamesUseCase(
        apiProvider,
        storageProvider,
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
