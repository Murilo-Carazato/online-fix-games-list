import { IGameGateway } from '../../domain/gateways/IGameGateway';
import { IHydraGateway } from '../../domain/gateways/IHydraGateway';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { ITitleCleanerService } from '../../domain/services/TitleCleanerService';
import { IGameDataMergerService } from '../../domain/services/GameDataMergerService';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { EnrichmentResult } from './EnrichmentResult';

export class EnrichGamesUseCase {
    constructor(
        private gameGateway: IGameGateway,
        private hydraGateway: IHydraGateway,
        private gameRepository: IGameRepository,
        private titleCleaner: ITitleCleanerService,
        private gameDataMerger: IGameDataMergerService
    ) { }

    public async enrichDataset(inputFilePath: string, limit?: number): Promise<EnrichmentResult> {
        console.log(`Loading games from ${inputFilePath}...`);
        const rawGames = await this.hydraGateway.loadGames(inputFilePath);
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
            const promises = chunk.map(async (game) => {
                const cleanTitle = this.titleCleaner.clean(game.title);
                try {
                    const externalData = await this.gameGateway.getGameDetails(cleanTitle);

                    if (!externalData) {
                        console.log(`   > [${cleanTitle}] No external data found.`);
                        failedCount++;
                        return { ...game, isEnriched: false } as EnrichedGameEntity;
                    }

                    const finalGame = this.gameDataMerger.merge(externalData, game);

                    if (!finalGame) {
                        console.log(`   > [${cleanTitle}] Failed to merge data (No IGDB/RAWG data).`);
                        failedCount++;
                        return { ...game, isEnriched: false } as EnrichedGameEntity;
                    }

                    console.log(`   > [${cleanTitle}] Found! Rating: ${finalGame.totalRating || 'N/A'}, Popularity: ${finalGame.added || 'N/A'}`);
                    enrichedCount++;
                    return finalGame;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`   > Error fetching data for "${cleanTitle}". Skipping: ${errorMessage}`);
                    failedCount++;
                    return { ...game, isEnriched: false } as EnrichedGameEntity;
                }
            });

            const results = await Promise.all(promises);
            enrichedGames.push(...results);

            processedCount += chunk.length;
            console.log(`[Batch Progress] ${processedCount}/${gamesToProcess.length} processed.`);
        }

        console.log(`Enrichment complete. Saving ${enrichedGames.length} games to Postgres...`);
        await this.gameRepository.saveGames(enrichedGames);
        console.log('Save complete!');

        return { processed: processedCount, enriched: enrichedCount, failed: failedCount };
    }
}
