import { GameProviderFactory } from './infrastructure/factories/GameProviderFactory';
import { JsonStorageProvider } from './infrastructure/storage/JsonStorageProvider';
import { TitleCleaner } from './domain/services/TitleCleaner';
import { EnrichGamesUseCase } from './application/useCases/EnrichGamesUseCase';
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
