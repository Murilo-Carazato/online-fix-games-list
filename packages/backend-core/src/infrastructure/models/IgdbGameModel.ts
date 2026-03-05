export interface IgdbGameModel {
    id: number;
    total_rating?: number;
    total_rating_count?: number;
    themes?: Array<{ name: string }>;
    game_modes?: Array<{ name: string }>;
    genres?: Array<{ name: string }>;
    language_supports?: Array<{
        language: { name: string; native_name: string };
        language_support_type: { name: string };
    }>;
    franchises?: Array<{ name: string }>;
    platforms?: Array<{ name: string }>;
    screenshots?: Array<{ image_id: string }>;
    videos?: Array<{ video_id: string }>;
    cover?: { image_id: string };
    external_games?: Array<{ url: string }>;
}
