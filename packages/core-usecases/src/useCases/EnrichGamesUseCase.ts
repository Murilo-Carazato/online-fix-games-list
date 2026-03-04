import { IGameDataProvider, IStorageProvider, ITitleCleaner, EnrichedGame, HydraGame } from '@hydra/core-domain';

export class EnrichGamesUseCase {
    constructor(
        private dataProvider: IGameDataProvider,
        private storageProvider: IStorageProvider,
        private nameCleaner: ITitleCleaner
    ) { }

    public async enrichDataset(inputPath: string, outputPath: string, limit?: number): Promise<void> {
        console.log(`Loading games from ${inputPath}...`);
        const rawGames = await this.storageProvider.loadGames(inputPath);
        console.log(`Successfully loaded ${rawGames.length} games.`);

        const gamesToProcess = limit ? rawGames.slice(0, limit) : rawGames;
        const enrichedGames: EnrichedGame[] = [];

        console.log(`Starting enrichment for ${gamesToProcess.length} games in groups...`);

        const CHUNK_SIZE = 10;
        let processedCount = 0;

        for (let i = 0; i < gamesToProcess.length; i += CHUNK_SIZE) {
            const chunk = gamesToProcess.slice(i, i + CHUNK_SIZE);
            const promises = chunk.map(async (game) => {
                const cleanTitle = this.nameCleaner.clean(game.title);
                try {
                    const enrichedData = await this.dataProvider.getGameDetails(cleanTitle);

                    const finalGame: EnrichedGame = {
                        ...game, // keep original properties (fileSize, uploadDate)
                        ...enrichedData, // merge new properties
                        title: cleanTitle, // Clean title without versions
                        isEnriched: !!enrichedData
                    };

                    if (!enrichedData) {
                        console.log(`   > [${cleanTitle}] No data found on IGDB.`);
                    } else {
                        console.log(`   > [${cleanTitle}] Found! Rating: ${enrichedData.totalRating || 'N/A'}, Popularity: ${enrichedData.added || 'N/A'}`);
                    }

                    return finalGame;
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error(`   > Error fetching data for "${cleanTitle}". Skipping: ${errorMessage}`);
                    return { ...game, isEnriched: false } as EnrichedGame;
                }
            });

            const results = await Promise.all(promises);
            enrichedGames.push(...results);

            processedCount += chunk.length;
            console.log(`[Batch Progress] ${processedCount}/${gamesToProcess.length} processed.`);
        }

        console.log(`Enrichment complete. Saving to ${outputPath} (Postgres)...`);
        await this.storageProvider.saveGames(outputPath, enrichedGames);
        console.log('Save complete!');
    }
}
