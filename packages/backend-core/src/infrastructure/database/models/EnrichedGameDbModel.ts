/**
 * Strongly typed Persistence Model representing the full payload required 
 * to save an EnrichedGame to the database.
 * 
 * Constructed exclusively by GameMapper.toDb() before writing to the database.
 * Lives in the Infrastructure layer — decouples the database schema from Domain Entities.
 */
export interface EnrichedGameDbModel {
    core: {
        title: string;
        baseTitle: string;
        fileSizeValue: number | null;
        fileSizeUnit: string | null;
        uploadDate: Date;
        isEnriched: boolean;
        igdbId: number | null;
        rawgId: number | null;
        playtime: number | null;
        coverUrl: string | null;
        totalRating: number | null;
        totalRatingCount: number | null;
        addedTotal: number | null;
        updatedAt: Date;
    };
    igdbVideos: {
        url: string;
    }[];
    alanzokaVideos: {
        url: string;
        title: string;
        publishedAt: Date;
        thumbnailUrl: string | null;
        channelTitle: string | null;
    }[];
    addedStats: {
        yet: number;
        owned: number;
        beaten: number;
        toplay: number;
        dropped: number;
        playing: number;
    } | null;
    screenshots: { url: string; }[];
    externalLinks: { storeId: number; url: string; }[];
    genres: string[];
    themes: string[];
    gameModes: string[];
    platforms: { name: string; versions: string[] }[];
    franchises: string[];
    languageSupports: { language: string; supportTypes: string[] }[];
    ratings: { title: string; count: number; percent: number; score?: number; }[];
}
