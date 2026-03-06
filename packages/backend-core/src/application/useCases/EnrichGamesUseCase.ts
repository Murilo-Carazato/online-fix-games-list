import { IGameGateway } from '../../domain/gateways/IGameGateway';
import { IHydraGateway } from '../../domain/gateways/IHydraGateway';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { ITitleCleanerService } from '../../domain/services/ITitleCleanerService';
import { IGameDataMergerService } from '../../domain/services/IGameDataMergerService';
import { ILoggerService } from '../../domain/services/ILoggerService';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { HydraGameEntity } from '../../domain/entities/HydraGameEntity';
import { Result } from '../../domain/common/Result';
import { Failure } from '../../domain/common/Failure';

export class EnrichGamesParams {
    constructor(
        public readonly inputFilePath: string,
        public readonly limit?: number,
        public readonly chunkSize: number = 10
    ) { }
}

export class EnrichGamesResponse {
    constructor(
        public readonly processed: number,
        public readonly enriched: number,
        public readonly failed: number
    ) { }
}

export class EnrichGamesUseCase {
    constructor(
        private readonly gameGateway: IGameGateway,
        private readonly hydraGateway: IHydraGateway,
        private readonly gameRepository: IGameRepository,
        private readonly titleCleaner: ITitleCleanerService,
        private readonly gameDataMerger: IGameDataMergerService,
        private readonly logger: ILoggerService
    ) { }

    /**
     * Executes the use case: loads raw games, fetches external data, merges, and saves.
     */
    public async execute(params: EnrichGamesParams): Promise<Result<EnrichGamesResponse, Failure>> {
        this.logger.info(`Loading games from ${params.inputFilePath}...`);

        const loadResult = await this.hydraGateway.loadGames(params.inputFilePath);
        if (loadResult.isFailure) {
            return Result.fail(loadResult.getError());
        }

        const rawGames = loadResult.getValue();
        this.logger.info(`Successfully loaded ${rawGames.length} games.`);

        const gamesToProcess = params.limit ? rawGames.slice(0, params.limit) : rawGames;
        this.logger.info(`Starting enrichment for ${gamesToProcess.length} games in groups of ${params.chunkSize}...`);

        const enrichedGames: EnrichedGameEntity[] = [];
        let processedCount = 0;
        let enrichedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < gamesToProcess.length; i += params.chunkSize) {
            const chunk = gamesToProcess.slice(i, i + params.chunkSize);
            const promises = chunk.map(async (game: HydraGameEntity) => {
                const cleanTitle = this.titleCleaner.clean(game.title);

                const externalDataRes = await this.gameGateway.getGameDetails(cleanTitle);

                if (externalDataRes.isFailure) {
                    this.logger.warn(`[${cleanTitle}] Gateway Error: ${externalDataRes.getError().message}`);
                    failedCount++;
                    return new EnrichedGameEntity(game);
                }

                const externalData = externalDataRes.getValue();

                if (!externalData) {
                    this.logger.warn(`[${cleanTitle}] No external data found.`);
                    failedCount++;
                    return new EnrichedGameEntity(game);
                }

                const finalGame = this.gameDataMerger.merge(externalData, game);

                if (!finalGame) {
                    this.logger.warn(`[${cleanTitle}] Failed to merge data.`);
                    failedCount++;
                    return new EnrichedGameEntity(game);
                }

                this.logger.info(`[${cleanTitle}] Enriched! Rating: ${finalGame.totalRating ?? 'N/A'}`);
                enrichedCount++;
                return finalGame;
            });

            const results = await Promise.all(promises);
            for (const res of results) {
                enrichedGames.push(res);
            }
            processedCount += results.length;
        }

        this.logger.info(`Saving ${enrichedGames.length} games to repository...`);

        const saveResult = await this.gameRepository.saveGames(enrichedGames);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getError());
        }

        this.logger.info('Save complete!');

        return Result.ok(new EnrichGamesResponse(processedCount, enrichedCount, failedCount));
    }
}
