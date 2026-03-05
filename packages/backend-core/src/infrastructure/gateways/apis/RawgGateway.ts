import axios from 'axios';
import { IGameGateway } from '../../../domain/gateways/IGameGateway';
import { ExternalGameData, RawgGameData } from '../../../domain/data/ExternalGameData';
import { RawgGameResponse } from './responses/RawgGameResponse';

export class RawgGateway implements IGameGateway {
    private apiKey: string;
    // RAWG has a limit of 20,000 requests per month. A slight delay is good practice.
    private requestDelayMs = 250;
    private lastRequestTime = 0;

    private static readonly RATING_WEIGHTS: Record<string, number> = {
        'exceptional': 5,
        'recommended': 4,
        'meh': 3,
        'skip': 1
    };

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

    public async getGameDetails(cleanTitle: string): Promise<ExternalGameData | null> {
        await this.delayNextRequest();

        try {
            // Encode the title to be URL safe
            const searchTerm = encodeURIComponent(cleanTitle);

            // Call RAWG API search
            const searchUrl = `https://api.rawg.io/api/games?key=${this.apiKey}&search=${searchTerm}&page_size=1`;
            const response = await axios.get<{ results: RawgGameResponse[] }>(searchUrl);

            if (response.data?.results && response.data.results.length > 0) {
                const gameData = response.data.results[0];

                const parsedData: RawgGameData = {
                    rawgId: gameData.id,
                    totalRating: gameData.rating,
                    totalRatingCount: gameData.reviews_count || gameData.ratings_count || null,
                    ratings: gameData.ratings?.map((r) => {
                        return {
                            title: r.title,
                            count: r.count,
                            percent: r.percent,
                            score: RawgGateway.RATING_WEIGHTS[r.title.toLowerCase()] || 0
                        };
                    }) || [],
                    added: gameData.added || undefined,
                    addedByStatus: gameData.added_by_status || undefined,
                    genres: gameData.genres?.map(g => g.name) || [],
                    platforms: gameData.platforms?.map(p => p.platform.name) || [],
                    playtime: gameData.playtime || undefined,
                    screenshots: gameData.short_screenshots
                        ?.map(s => s.image)
                        ?.filter(img => img !== gameData.background_image) || []
                };
                return { igdbResult: null, rawgResult: parsedData, videoResults: null };
            }
            return null;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error(`RAWG API Error for "${cleanTitle}":`, error.response?.status, (error.response?.data as any) || error.message);
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Error processing "${cleanTitle}":`, errorMessage);
            }
            return null;
        }
    }
}
