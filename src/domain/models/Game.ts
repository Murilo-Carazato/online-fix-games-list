export interface HydraGame {
  fileSize: string;
  title: string;
  uploadDate: string;
}

export interface EnrichedGame extends HydraGame {
  igdbId?: number;
  rawgId?: number;
  totalRating?: number; // Comes from RAWG or IGDB
  totalRatingCount?: number; // Comes from RAWG or IGDB
  playtime?: number; // RAWG only
  genres?: string[];
  themes?: string[]; // IGDB + RAWG tags
  platforms?: string[];
  gameModes?: string[];
  languageSupports?: string[]; // IGDB only
  franchises?: string[]; // IGDB only
  externalGames?: string[]; // IGDB links (stores do RAWG tbm se quiser)
  videos?: string[]; // IGDB only (URLs ou IDs do YT)
  coverUrl?: string; // Tenta pegar imagem in-game do RAWG, senão do cover do IGDB
  screenshots?: string[]; // RAWG only
  isEnriched: boolean;
}
