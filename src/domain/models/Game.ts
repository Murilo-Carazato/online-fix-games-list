export interface HydraGame {
  fileSize: string;
  title: string;
  uploadDate: string;
}

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
  addedByStatus?: { [status: string]: number } | null;
  playtime?: number | null;
}

export interface EnrichedGame extends HydraGame, Partial<IgdbGameData>, Partial<RawgGameData> {
  isEnriched: boolean;
}
