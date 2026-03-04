import { IGameDataMerger } from '../domain/interfaces/IGameDataMerger';
import { EnrichedGame, IgdbGameData, RawgGameData, BaseGameData, IVideoResult } from '../domain/models/Game';

export class GameDataMerger implements IGameDataMerger {

    public merge(igdbResult: Partial<IgdbGameData> | null, rawgResult: Partial<RawgGameData> | null, videoResults: IVideoResult[] | null): Partial<EnrichedGame> | null {
        if (!igdbResult && !rawgResult) {
            return null; // Both failed to find the game
        }

        const ratingSources = this.getRatingSources(igdbResult, rawgResult);
        const defaultSources = [igdbResult, rawgResult];

        let rating = this.getFirstAvailableValue('totalRating', ...ratingSources);
        rating = this.calculateAverageRatingIfMissing(rating, rawgResult);

        return {
            isEnriched: true,
            igdbId: igdbResult?.igdbId ?? null,
            rawgId: rawgResult?.rawgId ?? null,

            // Shared properties prioritising IGDB/RAWG fallbacks
            totalRating: rating ? Number(Number(rating).toFixed(1)) : null,
            totalRatingCount: this.getFirstAvailableValue('totalRatingCount', ...ratingSources),
            genres: this.getFirstAvailableValue('genres', ...defaultSources),
            platforms: this.getFirstAvailableValue('platforms', ...defaultSources),
            screenshots: this.getFirstAvailableValue('screenshots', ...defaultSources),

            // RAWG Specific Properties
            ratings: rawgResult?.ratings ?? null,
            added: rawgResult?.added ?? null,
            addedByStatus: rawgResult?.addedByStatus ?? null,
            playtime: rawgResult?.playtime ?? null,

            // IGDB Specific Properties
            videos: igdbResult?.videos ?? null,
            themes: igdbResult?.themes ?? null,
            gameModes: igdbResult?.gameModes ?? null,
            coverUrl: igdbResult?.coverUrl ?? null,
            languageSupports: igdbResult?.languageSupports ?? null,
            franchises: igdbResult?.franchises ?? null,
            externalGames: igdbResult?.externalGames ?? null,

            // External Providers
            alanzokaVideos: videoResults
        };
    }

    private getRatingSources(igdbResult: Partial<IgdbGameData> | null, rawgResult: Partial<RawgGameData> | null): (Partial<BaseGameData> | null)[] {
        // For ratings, prioritize RAWG if it has ratings data, otherwise fallback to IGDB
        return (rawgResult?.ratings && rawgResult.ratings.length > 0)
            ? [rawgResult, igdbResult]
            : [igdbResult, rawgResult];
    }

    private calculateAverageRatingIfMissing(currentRating: number | null | undefined, rawgResult: Partial<RawgGameData> | null): number | null {
        if (currentRating && currentRating > 0) {
            return currentRating;
        }

        if (!rawgResult?.ratings || rawgResult.ratings.length === 0) {
            return null;
        }

        let totalScore = 0;
        let totalVotes = 0;

        for (const r of rawgResult.ratings) {
            if (r.score > 0) {
                totalScore += r.score * r.count;
                totalVotes += r.count;
            }
        }

        return totalVotes > 0 ? (totalScore / totalVotes) : null;
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

