export interface RawgGameModel {
    id: number;
    metacritic?: number;
    rating?: number;
    ratings?: Array<{ title: string; count: number; percent: number }>;
    added?: number;
    added_by_status?: Record<string, number>;
    playtime?: number;
    genres?: Array<{ name: string }>;
    platforms?: Array<{ platform: { name: string } }>;
    short_screenshots?: Array<{ image: string }>;
}
