export interface GameDetailsViewModel {
    id: string; // e.g. "1-reanimal"
    title: string;
    coverUrl: string | null;
    rating: number | null;
    ratingCount: number | null;
    playtime: string | null; // e.g., "15h"
    fileSize: string | null; // e.g., "12.4 GB"
    formattedUploadDate: string; // e.g., "Oct 15, 2023"

    genres: string[];
    themes: string[];
    gameModes: string[];
    platforms: string[];
    franchises: string[];

    // Grouped by language: { language: 'English', supports: ['Audio', 'Subtitles'] }
    languages: { language: string; supports: string[] }[];

    stores: { storeName: string; url: string; categoryIcon: string }[];

    screenshots: string[];
    igdbVideos: string[]; // YouTube URLs
    contentCreatorVideos: {
        url: string;
        title: string;
        channelTitle: string;
        thumbnailUrl: string;
        publishedAt: string;
    }[];

    ratings: { title: string; score: number; count: number; percent: number }[];
    addedStats: { status: string; count: number }[];
}
