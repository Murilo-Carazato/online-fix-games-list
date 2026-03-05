import { IGameGateway } from '../../domain/gateways/IGameGateway';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { ITitleCleanerService } from '../../domain/services/TitleCleanerService';
import { IGameDataMergerService } from '../../domain/services/GameDataMergerService';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';

export class EnrichGamesUseCase {
    constructor(
        private gameGateway: IGameGateway,
        private gameRepository: IGameRepository,
        private titleCleaner: ITitleCleanerService,
        private gameDataMerger: IGameDataMergerService
    ) { }

    public async enrichDataset(inputPath: string, outputPath: string, limit?: number): Promise<void> {
        console.log(`Loading games from ${inputPath}...`);
        const rawGames = await this.gameRepository.loadGames(inputPath);
        console.log(`Successfully loaded ${rawGames.length} games.`);

        const gamesToProcess = limit ? rawGames.slice(0, limit) : rawGames;
        const enrichedGames: EnrichedGameEntity[] = [];

        console.log(`Starting enrichment for ${gamesToProcess.length} games in groups...`);

        const CHUNK_SIZE = 10;
        let processedCount = 0;

        for (let i = 0; i < gamesToProcess.length; i += CHUNK_SIZE) {
            const chunk = gamesToProcess.slice(i, i + CHUNK_SIZE);
            const promises = chunk.map(async (game) => {
                const cleanTitle = this.titleCleaner.clean(game.title);
                try {
                    const externalData = await this.gameGateway.getGameDetails(cleanTitle);

                    if (!externalData) {
                        console.log(`   > [${cleanTitle}] No external data found.`);
                        return { ...game, isEnriched: false } as EnrichedGameEntity;
                    }

                    const finalGame = this.gameDataMerger.merge(externalData, game);

                    if (!finalGame) {
                        console.log(`   > [${cleanTitle}] Failed to merge data (No IGDB/RAWG data).`);
                        return { ...game, isEnriched: false } as EnrichedGameEntity;
                    }

                    console.log(`   > [${cleanTitle}] Found! Rating: ${finalGame.totalRating || 'N/A'}, Popularity: ${finalGame.added || 'N/A'}`);

                    return finalGame;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`   > Error fetching data for "${cleanTitle}". Skipping: ${errorMessage}`);
                    return { ...game, isEnriched: false } as EnrichedGameEntity;
                }
            });

            const results = await Promise.all(promises);
            enrichedGames.push(...results);

            processedCount += chunk.length;
            console.log(`[Batch Progress] ${processedCount}/${gamesToProcess.length} processed.`);
        }

        console.log(`Enrichment complete. Saving to ${outputPath} (Postgres)...`);
        await this.gameRepository.saveGames(outputPath, enrichedGames);
        console.log('Save complete!');
    }
}
