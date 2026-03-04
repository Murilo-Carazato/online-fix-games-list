import axios from 'axios';
import { IGameDataProvider } from '../domain/interfaces/IGameDataProvider';
import { EnrichedGame, RawgGameData } from '../domain/models/Game';

export class RawgApiProvider implements IGameDataProvider {
    private apiKey: string;
    // RAWG has a limit of 20,000 requests per month. A slight delay is good practice.
    private requestDelayMs = 250;
    private lastRequestTime = 0;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async delayNextRequest() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.requestDelayMs) {
            const waitTime = this.requestDelayMs - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }

    public async getGameDetails(cleanTitle: string): Promise<Partial<RawgGameData> | null> {
        await this.delayNextRequest();

        try {
            // Encode the title to be URL safe
            const searchTerm = encodeURIComponent(cleanTitle);

            // Call RAWG API search
            const searchUrl = `https://api.rawg.io/api/games?key=${this.apiKey}&search=${searchTerm}&page_size=1`;
            const response = await axios.get(searchUrl);

            if (response.data && response.data.results && response.data.results.length > 0) {
                const gameData = response.data.results[0];

                return {
                    rawgId: gameData.id,
                    totalRating: gameData.rating,
                    totalRatingCount: gameData.reviews_count || gameData.ratings_count || null,
                    ratings: gameData.ratings?.map((r: any) => {
                        const weights: Record<string, number> = {
                            'exceptional': 5,
                            'recommended': 4,
                            'meh': 3,
                            'skip': 1
                        };
                        return {
                            title: r.title,
                            count: r.count,
                            percent: r.percent,
                            score: weights[r.title.toLowerCase()] || 0
                        };
                    }) || [],
                    added: gameData.added || undefined,
                    addedByStatus: gameData.added_by_status || undefined,
                    genres: gameData.genres?.map((g: any) => g.name) || [],
                    platforms: gameData.platforms?.map((p: any) => p.platform.name) || [],
                    playtime: gameData.playtime || undefined,
                    screenshots: gameData.short_screenshots
                        ?.map((s: any) => s.image)
                        ?.filter((img: string) => img !== gameData.background_image) || []
                };
            }
            return null;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error(`RAWG API Error for "${cleanTitle}":`, error.response?.status, error.response?.data || error.message);
            } else {
                console.error(`Error processing "${cleanTitle}":`, error);
            }
            return null;
        }
    }
}
