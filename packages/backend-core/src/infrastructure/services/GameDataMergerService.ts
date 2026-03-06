import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { HydraGameEntity } from '../../domain/entities/HydraGameEntity';
import { IgdbGameData, RawgGameData, ExternalGameData } from '../../domain/data/ExternalGameData';
import { IGameDataMergerService } from '../../domain/services/IGameDataMergerService';

type AnySource = Partial<IgdbGameData> | Partial<RawgGameData> | null;

/**
 * Concrete implementation of IGameDataMergerService.
 * Merges IGDB, RAWG and YouTube data into a single EnrichedGameEntity.
 * Lives in Infrastructure — the Domain never knows about this class.
 */
export class GameDataMergerService implements IGameDataMergerService {

    public merge(externalData: ExternalGameData, hydraData: HydraGameEntity): EnrichedGameEntity | null {
        const igdbResultRaw = externalData.igdbResult;
        const rawgResult = externalData.rawgResult;
        const videoResults = externalData.videoResults;

        if (!igdbResultRaw && !rawgResult) {
            return null; // Both sources failed to find the game
        }

        // Normalize IGDB rating from 0-100 scale to 0-5 scale to match RAWG scale.
        const igdbResult: Partial<IgdbGameData> | null = igdbResultRaw
            ? Object.assign({}, igdbResultRaw, {
                totalRating: igdbResultRaw.totalRating != null
                    ? igdbResultRaw.totalRating / 20
                    : null
            })
            : null;

        const ratingSources: AnySource[] = this.getRatingSources(igdbResult, rawgResult);
        const defaultSources: AnySource[] = [igdbResult, rawgResult];

        const rawRating = this.getFirstNumericValue('totalRating', ratingSources);
        const rating = this.calculateAverageRatingIfMissing(rawRating, rawgResult);

        return new EnrichedGameEntity(
            hydraData,
            {
                igdbId: igdbResult?.igdbId ?? null,
                rawgId: rawgResult?.rawgId ?? null,

                totalRating: rating != null ? Number(Number(rating).toFixed(1)) : null,
                totalRatingCount: this.getFirstNumericValue('totalRatingCount', ratingSources),
                genres: this.getFirstStringArrayValue('genres', defaultSources),
                platforms: this.getFirstStringArrayValue('platforms', defaultSources),
                screenshots: this.getFirstStringArrayValue('screenshots', defaultSources),

                ratings: rawgResult?.ratings ?? null,
                added: rawgResult?.added ?? null,
                addedByStatus: rawgResult?.addedByStatus ?? null,
                playtime: rawgResult?.playtime ?? null,

                videos: igdbResult?.videos ?? null,
                themes: igdbResult?.themes ?? null,
                gameModes: igdbResult?.gameModes ?? null,
                coverUrl: igdbResult?.coverUrl ?? null,
                languageSupports: igdbResult?.languageSupports ?? null,
                franchises: igdbResult?.franchises ?? null,
                externalGames: igdbResult?.externalGames ?? null,

                contentCreatorVideos: videoResults
            }
        );
    }

    private getRatingSources(
        igdbResult: Partial<IgdbGameData> | null,
        rawgResult: Partial<RawgGameData> | null
    ): AnySource[] {
        // Prioritize RAWG if it has rating breakdown data; otherwise fallback to IGDB
        return rawgResult?.ratings && rawgResult.ratings.length > 0
            ? [rawgResult, igdbResult]
            : [igdbResult, rawgResult];
    }

    private calculateAverageRatingIfMissing(
        currentRating: number | null,
        rawgResult: Partial<RawgGameData> | null
    ): number | null {
        if (currentRating != null && currentRating > 0) {
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

        return totalVotes > 0 ? totalScore / totalVotes : null;
    }

    /**
     * Returns the first non-null positive numeric value for a given key across sources.
     */
    private getFirstNumericValue(key: string, sources: AnySource[]): number | null {
        for (const source of sources) {
            if (!source) continue;
            const record = source as Record<string, unknown>;
            const value = record[key];
            if (typeof value === 'number' && value > 0) {
                return value;
            }
        }
        return null;
    }

    /**
     * Returns the first non-empty string array for a given key across sources.
     */
    private getFirstStringArrayValue(key: string, sources: AnySource[]): string[] | null {
        for (const source of sources) {
            if (!source) continue;
            const record = source as Record<string, unknown>;
            const value = record[key];
            if (Array.isArray(value) && value.length > 0) {
                return value as string[];
            }
        }
        return null;
    }
}
