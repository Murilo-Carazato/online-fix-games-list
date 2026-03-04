import { IGameDataProvider } from '../../domain/interfaces/IGameDataProvider';
import { IStorageProvider } from '../../domain/interfaces/IStorageProvider';
import { ITitleCleaner } from '../../domain/interfaces/ITitleCleaner';
import { EnrichedGame } from '../../domain/models/Game';

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

        console.log(`Starting enrichment for ${gamesToProcess.length} games...`);

        let processedCount = 0;

        for (const game of gamesToProcess) {
            processedCount++;
            const cleanTitle = this.nameCleaner.clean(game.title);

            console.log(`[${processedCount}/${gamesToProcess.length}] Processing: "${game.title}" -> Searching for: "${cleanTitle}"`);

            try {
                const enrichedData = await this.dataProvider.getGameDetails(cleanTitle);

                const finalGame: EnrichedGame = {
                    ...game, // keep original properties (fileSize, uploadDate)
                    ...enrichedData, // merge new properties
                    title: cleanTitle, // Clean title without versions
                    isEnriched: !!enrichedData
                };

                enrichedGames.push(finalGame);

                if (!enrichedData) {
                    console.log(`   > No data found on IGDB for "${cleanTitle}".`);
                } else {
                    console.log(`   > Found! Rating: ${enrichedData.totalRating || 'N/A'}, Genres: ${enrichedData.genres?.join(', ') || 'None'}`);
                }
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`   > Error fetching data for "${cleanTitle}". Skipping: ${errorMessage}`);
                enrichedGames.push({
                    ...game,
                    isEnriched: false
                });
            }
        }

        console.log(`Enrichment complete. Saving to ${outputPath}...`);
        await this.storageProvider.saveGames(outputPath, enrichedGames);
        console.log('Save complete!');
    }
}
