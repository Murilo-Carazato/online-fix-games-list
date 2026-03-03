export interface HydraGame {
  fileSize: string;
  title: string;
  uploadDate: string;
}

export interface EnrichedGame extends HydraGame {
  igdbId?: number;
  totalRating?: number;
  totalRatingCount?: number;
  genres?: string[];
  themes?: string[];
  platforms?: string[];
  gameModes?: string[];
  languageSupports?: string[];
  franchises?: string[];
  externalGames?: string[];
  coverUrl?: string;
  isEnriched: boolean;
}
