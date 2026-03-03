import { IGameDataProvider } from '../domain/interfaces/IGameDataProvider';
import { EnrichedGame } from '../domain/models/Game';

export class CompositeGameDataProvider implements IGameDataProvider {
    constructor(
        private igdbProvider: IGameDataProvider,
        private rawgProvider: IGameDataProvider
    ) { }

    public async getGameDetails(cleanTitle: string): Promise<Partial<EnrichedGame> | null> {
        console.log(`[Composite] Fetching data for "${cleanTitle}"...`);
        // Run both API requests concurrently for performance
        const [igdbResult, rawgResult] = await Promise.all([
            this.igdbProvider.getGameDetails(cleanTitle),
            this.rawgProvider.getGameDetails(cleanTitle)
        ]);

        if (!igdbResult && !rawgResult) {
            return null; // Both failed to find the game
        }

        // Merge logic based on user preferences and API strengths
        const mergedGame: Partial<EnrichedGame> = {
            isEnriched: true
        };

        mergedGame.igdbId = igdbResult?.igdbId;
        mergedGame.rawgId = rawgResult?.rawgId;

        // Ratings & Playtime -> Preferably RAWG, otherwise IGDB 
        mergedGame.totalRating = rawgResult?.totalRating ?? igdbResult?.totalRating;
        mergedGame.totalRatingCount = rawgResult?.totalRatingCount ?? igdbResult?.totalRatingCount;
        mergedGame.playtime = rawgResult?.playtime;

        // Media -> Screenshots from RAWG, cover from RAWG first (or IGDB), Videos from IGDB
        mergedGame.coverUrl = rawgResult?.coverUrl ?? igdbResult?.coverUrl;
        mergedGame.screenshots = rawgResult?.screenshots || [];
        mergedGame.videos = igdbResult?.videos || [];

        // Game Characteristics -> Merge distinct values to get the most comprehensive list
        mergedGame.genres = this.mergeUnique(igdbResult?.genres, rawgResult?.genres);
        mergedGame.platforms = this.mergeUnique(igdbResult?.platforms, rawgResult?.platforms);
        mergedGame.themes = this.mergeUnique(igdbResult?.themes, rawgResult?.themes);
        mergedGame.gameModes = this.mergeUnique(igdbResult?.gameModes, rawgResult?.gameModes);

        // Exclusive IGDB fields -> High quality structured data
        mergedGame.languageSupports = igdbResult?.languageSupports || [];
        mergedGame.franchises = igdbResult?.franchises || [];
        mergedGame.externalGames = igdbResult?.externalGames || [];

        return mergedGame;
    }

    private mergeUnique(arr1: string[] | undefined, arr2: string[] | undefined): string[] {
        const combined = [...(arr1 || []), ...(arr2 || [])];
        const unique = Array.from(new Set(combined.map(item => item.trim())));
        return unique.filter(Boolean); // Filter out any empty strings
    }
}
