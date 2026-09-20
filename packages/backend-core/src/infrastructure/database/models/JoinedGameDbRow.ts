import { RawgRating } from "../../../domain/data/ExternalGameData";

/**
 * Represents the raw, aggregated data structure returned by the database queries
 * (e.g., via GameQueryAssembler) before it is mapped to a Domain Entity.
 */
export interface JoinedGameDbRow {
    game: { id: number; title: string; fileSizeValue: number | null; fileSizeUnit: string | null; uploadDate: Date; isEnriched: boolean; igdbId: number | null; rawgId: number | null; playtime: number | null; coverUrl: string | null; totalRating: number | null; totalRatingCount: number | null; addedTotal: number | null; youtubeFetchFailed: boolean };
    genres: string[];
    themes: string[];
    modes: string[];
    platforms: { name: string; versions: string[] }[];
    franchises: string[];
    languageSupports: { language: string; supportTypes: string[] }[];
    externalLinks: { storeId: number; storeName: string; domainPattern: string; url: string; iconUrl: string | null }[];
    screenshots: string[];
    ratings: RawgRating[];
    addedStats: { yet: number; owned: number; beaten: number; toplay: number; dropped: number; playing: number } | null;
    igdbVideos: string[];
    alanzokaVideos: { url: string; title: string; publishedAt: Date; thumbnailUrl: string | null; channelTitle: string | null }[];
}
