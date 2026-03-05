import { VideoEntity } from '../entities/VideoEntity';

export interface BaseGameDto {
    totalRating?: number | null;
    totalRatingCount?: number | null;
    genres?: string[] | null;
    platforms?: string[] | null;
    screenshots?: string[] | null;
}

export interface IgdbGameDto extends BaseGameDto {
    igdbId?: number | null;
    themes?: string[] | null;
    gameModes?: string[] | null;
    languageSupports?: string[] | null;
    franchises?: string[] | null;
    externalGames?: { storeName: string; categoryIcon: string; url: string }[] | null;
    videos?: string[] | null;
    coverUrl?: string | null;
}

export interface RawgGameDto extends BaseGameDto {
    rawgId?: number | null;
    ratings?: { title: string; count: number; percent: number; score: number }[] | null;
    added?: number | null;
    addedByStatus?: Record<string, number> | null;
    playtime?: number | null;
}

export interface ExternalGameDto {
    igdbResult: Partial<IgdbGameDto> | null;
    rawgResult: Partial<RawgGameDto> | null;
    videoResults: VideoEntity[] | null;
}
