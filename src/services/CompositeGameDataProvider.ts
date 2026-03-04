import { IGameDataProvider } from '../domain/interfaces/IGameDataProvider';
import { EnrichedGame, IgdbGameData, RawgGameData, BaseGameData } from '../domain/models/Game';

export class CompositeGameDataProvider implements IGameDataProvider {
    constructor(
        private igdbProvider: IGameDataProvider,
        private rawgProvider: IGameDataProvider
    ) { }

    public async getGameDetails(cleanTitle: string): Promise<Partial<EnrichedGame> | null> {
        console.log(`[Composite] Fetching data for "${cleanTitle}"...`);
        // Run both API requests concurrently for performance
        const [igdbResultRaw, rawgResultRaw] = await Promise.all([
            this.igdbProvider.getGameDetails(cleanTitle),
            this.rawgProvider.getGameDetails(cleanTitle)
        ]);

        const igdbResult = igdbResultRaw as Partial<IgdbGameData> | null;
        const rawgResult = rawgResultRaw as Partial<RawgGameData> | null;

        if (!igdbResult && !rawgResult) {
            return null; // Both failed to find the game
        }

        // Merge logic based on user preferences and API strengths
        const mergedGame: Partial<EnrichedGame> = {
            isEnriched: true
        };

        mergedGame.igdbId = igdbResult?.igdbId ?? null;
        mergedGame.rawgId = rawgResult?.rawgId ?? null;

        // Fallback Logic for shared BaseGameData fields: prioritize IGDB, then RAWG
        const defaultSources = [igdbResult, rawgResult];

        // For ratings, prioritize RAWG if it has ratings data, otherwise fallback to IGDB
        const ratingSources = (rawgResult?.ratings && rawgResult.ratings.length > 0)
            ? [rawgResult, igdbResult]
            : [igdbResult, rawgResult];

        let rating = this.getFirstAvailableValue('totalRating', ...ratingSources);

        // Calculate average from RAWG ratings if we still don't have a valid rating (=== 0 or undefined) but we have ratings data
        if ((!rating || rating === 0) && rawgResult?.ratings && rawgResult.ratings.length > 0) {
            let totalScore = 0;
            let totalVotes = 0;
            for (const r of rawgResult.ratings) {
                if (r.score > 0) {
                    totalScore += r.score * r.count;
                    totalVotes += r.count;
                }
            }
            if (totalVotes > 0) {
                rating = totalScore / totalVotes;
            }
        }

        mergedGame.totalRating = rating ? Number(Number(rating).toFixed(1)) : null;
        mergedGame.totalRatingCount = this.getFirstAvailableValue('totalRatingCount', ...ratingSources);

        mergedGame.genres = this.getFirstAvailableValue('genres', ...defaultSources);
        mergedGame.platforms = this.getFirstAvailableValue('platforms', ...defaultSources);
        mergedGame.screenshots = this.getFirstAvailableValue('screenshots', ...defaultSources);

        // RAWG specific fields
        mergedGame.ratings = rawgResult?.ratings ?? null;
        mergedGame.added = rawgResult?.added ?? null;
        mergedGame.addedByStatus = rawgResult?.addedByStatus ?? null;
        mergedGame.playtime = rawgResult?.playtime ?? null;

        // IGDB specific fields
        mergedGame.videos = igdbResult?.videos ?? null;
        mergedGame.themes = igdbResult?.themes ?? null;
        mergedGame.gameModes = igdbResult?.gameModes ?? null;

        mergedGame.coverUrl = igdbResult?.coverUrl ?? null;

        // Exclusive IGDB fields -> High quality structured data
        mergedGame.languageSupports = igdbResult?.languageSupports ?? null;
        mergedGame.franchises = igdbResult?.franchises ?? null;
        mergedGame.externalGames = igdbResult?.externalGames ?? null;

        return mergedGame;
    }

    private getFirstAvailableValue<K extends keyof BaseGameData>(
        key: K,
        ...sources: (Partial<BaseGameData> | undefined | null)[]
    ): BaseGameData[K] | null {
        for (const source of sources) {
            if (!source || source[key] === undefined || source[key] === null) continue;

            const value = source[key];
            if (Array.isArray(value)) {
                if (value.length > 0) return value;
            } else if (typeof value === 'string') {
                if ((value as string).trim() !== '') return value;
            } else if (typeof value === 'number') {
                if ((value as number) > 0) return value;
            } else {
                return value;
            }
        }
        return null;
    }
}
