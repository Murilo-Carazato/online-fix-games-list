import { GameGatewayFactory } from '@hydra/backend-core/src/infrastructure/factories/GameGatewayFactory';
import { JsonHydraGateway } from '@hydra/backend-core/src/infrastructure/gateways/files/JsonHydraGateway';
import { PostgresGameRepository } from '@hydra/backend-core/src/infrastructure/repositories/PostgresGameRepository';
import { TitleCleanerService } from '@hydra/backend-core/src/domain/services/TitleCleanerService';
import { GameDataMergerService } from '@hydra/backend-core/src/domain/services/GameDataMergerService';
import { ConsoleLoggerService } from '@hydra/backend-core/src/infrastructure/logging/ConsoleLoggerService';
import { StoreMatcherService } from '@hydra/backend-core/src/domain/services/StoreMatcherService';
import { PostgresStoreRepository } from '@hydra/backend-core/src/infrastructure/repositories/PostgresStoreRepository';
import { EnrichGamesUseCase, EnrichGamesParams } from '@hydra/backend-core/src/application/useCases/EnrichGamesUseCase';
import { loadConfig } from './config/AppConfig';

async function main() {
    const logger = new ConsoleLoggerService();
    logger.info('=== HYDRA GAMES ENRICHER ===');
    logger.info('Initializing Services...');

    // 1. Load configuration at the application boundary (composition root)
    const config = loadConfig();

    // 2. Compose dependencies — Dependency Inversion in action
    const storeRepository = new PostgresStoreRepository(logger);
    const storeMatcher = new StoreMatcherService(storeRepository);
    const apiGateway = GameGatewayFactory.createGateway(config, logger, storeMatcher);
    const hydraGateway = new JsonHydraGateway(logger);
    const gameRepository = new PostgresGameRepository(logger);
    const titleCleaner = new TitleCleanerService();
    const gameDataMerger = new GameDataMergerService();

    // 3. Assemble the Use Case with all its dependencies injected
    const enricherUseCase = new EnrichGamesUseCase(
        apiGateway,
        hydraGateway,
        gameRepository,
        titleCleaner,
        gameDataMerger,
        logger
    );

    logger.info(`Starting execution to enrich up to ${config.enrichmentLimit ?? 'ALL'} games...`);
    logger.info(`Reading from: ${config.inputFilePath}`);

    const params = new EnrichGamesParams(config.inputFilePath, config.enrichmentLimit);
    const result = await enricherUseCase.execute(params);

    logger.info('=== DONE ===');
    if (result.isFailure) {
        logger.error(`Enrichment Process Failed: ${result.getError().message}`);
        process.exit(1);
    } else {
        const stats = result.getValue();
        logger.info(`Processed: ${stats.processed} | Enriched: ${stats.enriched} | Failed: ${stats.failed}`);
    }
}

main().catch(error => {
    const logger = new ConsoleLoggerService();
    const msg = error instanceof Error ? error.stack || error.message : String(error);
    logger.error(`Fatal Error: \n${msg}`);
    process.exit(1);
});
