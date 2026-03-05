import { GameGatewayFactory } from '@hydra/backend-core/src/infrastructure/factories/GameGatewayFactory';
import { JsonHydraGateway } from '@hydra/backend-core/src/infrastructure/gateways/JsonHydraGateway';
import { PostgresGameRepository } from '@hydra/backend-core/src/infrastructure/repositories/PostgresGameRepository';
import { TitleCleanerService } from '@hydra/backend-core/src/domain/services/TitleCleanerService';
import { GameDataMergerService } from '@hydra/backend-core/src/domain/services/GameDataMergerService';
import { EnrichGamesUseCase } from '@hydra/backend-core/src/application/useCases/EnrichGamesUseCase';
import { loadConfig } from './config/AppConfig';

async function main() {
    console.log("=== HYDRA GAMES ENRICHER ===");
    console.log("Initializing Services...");

    // 1. Load configuration at the application boundary
    const config = loadConfig();

    // 2. Compose dependencies — each with a single, clear responsibility
    const apiGateway = GameGatewayFactory.createGateway(config);
    const hydraGateway = new JsonHydraGateway();        // reads raw OnlineFix JSON
    const gameRepository = new PostgresGameRepository(); // persists enriched data
    const titleCleaner = new TitleCleanerService();
    const gameDataMerger = new GameDataMergerService();

    const enricherUseCase = new EnrichGamesUseCase(
        apiGateway,
        hydraGateway,
        gameRepository,
        titleCleaner,
        gameDataMerger
    );

    console.log(`Starting execution to enrich up to ${config.enrichmentLimit ?? 'ALL'} games...`);
    console.log(`Reading from: ${config.inputFilePath}`);

    const result = await enricherUseCase.enrichDataset(config.inputFilePath, config.enrichmentLimit);

    console.log("=== DONE ===");
    console.log(`Processed: ${result.processed} | Enriched: ${result.enriched} | Failed: ${result.failed}`);
}

main().catch(error => {
    console.error("Fatal Error:", error);
    process.exit(1);
});
