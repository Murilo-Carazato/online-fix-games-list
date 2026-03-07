export interface GameViewModel {
    id: string; // Combine id and title or just use title for uniqueness in UI lists
    title: string;
    coverUrl: string | null;
    rating: number | null;
    popularity: string | null; // e.g., "1.2k"
    playtime: string | null; // e.g., "15h"
    formattedUploadDate: string; // e.g., "15/10/2023"
    genres: string[]; // Only the top 2 needed for the badges
}
