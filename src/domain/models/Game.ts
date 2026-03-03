export interface HydraGame {
  fileSize: string;
  title: string;
  uploadDate: string;
}

export interface BaseGameData {
  totalRating?: number;
  totalRatingCount?: number;
  genres?: string[];
  themes?: string[];
  platforms?: string[];
  gameModes?: string[];
  coverUrl?: string;
}

export interface IgdbGameData extends BaseGameData {
  igdbId?: number;
  languageSupports?: string[];
  franchises?: string[];
  externalGames?: { id: number; url: string }[];
  videos?: string[];
}

export interface RawgGameData extends BaseGameData {
  rawgId?: number;
  ratings?: { title: string; count: number; percent: number }[];
  added?: number;
  addedByStatus?: { [status: string]: number };
  playtime?: number;
  screenshots?: string[];
}

export interface EnrichedGame extends HydraGame, Partial<IgdbGameData>, Partial<RawgGameData> {
  isEnriched: boolean;
}
