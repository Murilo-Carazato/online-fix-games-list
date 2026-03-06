import { VideoEntity } from '../entities/VideoEntity';

/**
 * Shared base fields available from both IGDB and RAWG.
 */
export interface BaseGameData {
    totalRating?: number | null;
    totalRatingCount?: number | null;
    genres?: string[] | null;
    platforms?: string[] | null;
    screenshots?: string[] | null;
}

export interface IgdbGameData extends BaseGameData {
    igdbId?: number | null;
    themes?: string[] | null;
    gameModes?: string[] | null;
    languageSupports?: string[] | null;
    franchises?: string[] | null;
    externalGames?: { storeName: string; categoryIcon: string; url: string }[] | null;
    videos?: string[] | null;
    coverUrl?: string | null;
}

export interface RawgGameData extends BaseGameData {
    rawgId?: number | null;
    ratings?: { title: string; count: number; percent: number; score: number }[] | null;
    added?: number | null;
    addedByStatus?: Record<string, number> | null;
    playtime?: number | null;
}

/**
 * Value Object representing the aggregated result of external API lookups.
 * Constructed explicitly inside Gateways and returned as Result<ExternalGameData>.
 * Being a class (not an interface) enforces that it is always built intentionally,
 * never accidentally assembled as a raw object literal.
 */
export class ExternalGameData {
    constructor(
        public readonly igdbResult: Partial<IgdbGameData> | null,
        public readonly rawgResult: Partial<RawgGameData> | null,
        public readonly videoResults: VideoEntity[] | null
    ) { }
}
