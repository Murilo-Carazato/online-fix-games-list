export interface HydraGame {
  fileSize: string;
  title: string;
  uploadDate: string;
}

export interface EnrichedGame extends HydraGame {
  igdbId?: number;
  rating?: number;
  totalRating?: number;
  popularity?: number;
  genres?: string[];
  coverUrl?: string;
  isEnriched: boolean;
}
