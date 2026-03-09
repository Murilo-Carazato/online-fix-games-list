import { VideoEntity } from '../entities/VideoEntity';

/** Shared base fields available from both IGDB and RAWG */
export interface BaseGameData {
    totalRating?: number | null;
    totalRatingCount?: number | null;
    genres?: string[] | null;
    platforms?: string[] | null;
    screenshots?: string[] | null;
}

export interface IgdbLanguageSupport {
    language: string;
    supportType: string;
}

export interface IgdbExternalGame {
    storeId: number;
    storeName: string;
    categoryIcon: string;
    url: string;
}

export interface IgdbGameData extends BaseGameData {
    igdbId?: number | null;
    themes?: string[] | null;
    gameModes?: string[] | null;
    /** Structured language supports enabling proper join-table storage */
    languageSupports?: IgdbLanguageSupport[] | null;
    franchises?: string[] | null;
    /** External store links with resolved store IDs from the DB-backed lookup */
    externalGames?: IgdbExternalGame[] | null;
    videos?: string[] | null;
    coverUrl?: string | null;
}

export interface RawgRating {
    title: string;
    count: number;
    percent: number;
    /** Resolved from the rating_categories seed table — 0 when not yet joined from DB */
    score: number;
}

export interface RawgGameData extends BaseGameData {
    rawgId?: number | null;
    /** Ratings without score — score is now stored in the `rating_categories` seed table */
    ratings?: RawgRating[] | null;
    added?: number | null;
    addedByStatus?: Record<string, number> | null;
    playtime?: number | null;
}

/**
 * Value Object representing the aggregated result of external API lookups.
 * Constructed explicitly inside Gateways and returned as Result<ExternalGameData>.
 * `warnings` carries partial failure messages so the use case can log them
 * even when some APIs succeeded (e.g., IGDB found data but YouTube quota was exceeded).
 */
export class ExternalGameData {
    constructor(
        public readonly igdbResult: Partial<IgdbGameData> | null,
        public readonly rawgResult: Partial<RawgGameData> | null,
        public readonly videoResults: VideoEntity[] | null,
        public readonly warnings: string[] = []
    ) { }
}
