import { IGameGateway } from '../../domain/gateways/IGameGateway';
import { IHydraGateway } from '../../domain/gateways/IHydraGateway';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { ITitleCleanerService } from '../../domain/services/TitleCleanerService';
import { IGameDataMergerService } from '../../domain/services/GameDataMergerService';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { Result } from '../../domain/common/Result';
import { Failure } from '../../domain/common/Failure';
import { EnrichmentResult } from './results/EnrichmentResult';

export class EnrichGamesUseCase {
    constructor(
        private gameGateway: IGameGateway,
        private hydraGateway: IHydraGateway,
        private gameRepository: IGameRepository,
        private titleCleaner: ITitleCleanerService,
        private gameDataMerger: IGameDataMergerService
    ) { }

    public async enrichDataset(inputFilePath: string, limit?: number): Promise<Result<EnrichmentResult, Failure>> {
        console.log(`Loading games from ${inputFilePath}...`);

        // Dependency boundary handles formatting its own exceptions into Result
        const loadResult = await this.hydraGateway.loadGames(inputFilePath);
        if (loadResult.isFailure) {
            return Result.fail(loadResult.getError());
        }

        const rawGames = loadResult.getValue();
        console.log(`Successfully loaded ${rawGames.length} games.`);

        const gamesToProcess = limit ? rawGames.slice(0, limit) : rawGames;
        const enrichedGames: EnrichedGameEntity[] = [];

        console.log(`Starting enrichment for ${gamesToProcess.length} games in groups...`);

        const CHUNK_SIZE = 10;
        let processedCount = 0;
        let enrichedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < gamesToProcess.length; i += CHUNK_SIZE) {
            const chunk = gamesToProcess.slice(i, i + CHUNK_SIZE);
            const promises = chunk.map(async (game: import('../../domain/entities/HydraGameEntity').HydraGameEntity) => {
                const cleanTitle = this.titleCleaner.clean(game.title);

                // We keep a fallback try-catch just in case but the Gateway logic should NEVER throw
                try {
                    const externalDataRes = await this.gameGateway.getGameDetails(cleanTitle);

                    if (externalDataRes.isFailure) {
                        console.log(`   > [${cleanTitle}] Gateway Error: ${externalDataRes.getError().message}`);
                        failedCount++;
                        return { ...game, isEnriched: false } as EnrichedGameEntity;
                    }

                    const externalData = externalDataRes.getValue();

                    if (!externalData) {
                        console.log(`   > [${cleanTitle}] No external data found.`);
                        failedCount++;
                        return { ...game, isEnriched: false } as EnrichedGameEntity;
                    }

                    const finalGame = this.gameDataMerger.merge(externalData, game);

                    if (!finalGame) {
                        console.log(`   > [${cleanTitle}] Failed to merge data.`);
                        failedCount++;
                        return { ...game, isEnriched: false } as EnrichedGameEntity;
                    }

                    console.log(`   > [${cleanTitle}] Found! Rating: ${finalGame.totalRating || 'N/A'}`);
                    enrichedCount++;
                    return finalGame;
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.log(`   > [${cleanTitle}] Unexpected Error: ${msg}`);
                    failedCount++;
                    return { ...game, isEnriched: false } as EnrichedGameEntity;
                }
            });

            const results = await Promise.all(promises);
            enrichedGames.push(...results);
            processedCount += results.length;
        }

        console.log(`Saving ${enrichedGames.length} games to PostgreSQL...`);

        const saveResult = await this.gameRepository.saveGames(enrichedGames);
        if (saveResult.isFailure) {
            return Result.fail(saveResult.getError());
        }

        console.log('Save complete!');

        return Result.ok({ processed: processedCount, enriched: enrichedCount, failed: failedCount });
    }
}
