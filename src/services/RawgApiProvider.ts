import axios from 'axios';
import { IGameDataProvider } from '../domain/interfaces/IGameDataProvider';
import { EnrichedGame } from '../domain/models/Game';

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

    public async getGameDetails(cleanTitle: string): Promise<Partial<EnrichedGame> | null> {
        await this.delayNextRequest();

        try {
            // Encode the title to be URL safe
            const searchTerm = encodeURIComponent(cleanTitle);

            // Call RAWG API search
            const searchUrl = `https://api.rawg.io/api/games?key=${this.apiKey}&search=${searchTerm}&page_size=1`;
            const response = await axios.get(searchUrl);

            if (response.data && response.data.results && response.data.results.length > 0) {
                const gameData = response.data.results[0];

                // Identify game modes from tags (RAWG doesn't have a distinct game_modes field in the search response)
                const modeSlugs = ['singleplayer', 'multiplayer', 'co-op', 'local-multiplayer', 'online-co-op'];
                const gameModes = gameData.tags
                    ?.filter((t: any) => modeSlugs.includes(t.slug.toLowerCase()))
                    .map((t: any) => t.name) || [];

                // Filter out non-English tags and remove game modes from themes
                const themes = gameData.tags
                    ?.filter((t: any) => t.language === 'eng' && !modeSlugs.includes(t.slug.toLowerCase()))
                    .map((t: any) => t.name) || [];

                // Normalize RAWG ratings (which are 1-5 or metacritic 0-100) to our 0-100 scale for consistency
                let normalizedRating = null;
                if (gameData.metacritic) {
                    normalizedRating = gameData.metacritic;
                } else if (gameData.rating > 0) {
                    normalizedRating = gameData.rating * 20; // Scale 0-5 to 0-100
                }

                return {
                    rawgId: gameData.id,
                    totalRating: normalizedRating,
                    totalRatingCount: gameData.reviews_count || gameData.ratings_count || null,
                    ratings: gameData.ratings?.map((r: any) => ({
                        title: r.title,
                        count: r.count,
                        percent: r.percent
                    })) || [],
                    added: gameData.added || undefined,
                    addedByStatus: gameData.added_by_status || undefined,
                    genres: gameData.genres?.map((g: any) => g.name) || [],
                    themes: themes,
                    platforms: gameData.platforms?.map((p: any) => p.platform.name) || [],
                    gameModes: gameModes,
                    languageSupports: [], // Not exposed directly in the brief search response
                    franchises: [], // Not exposed directly in the brief search response
                    externalGames: gameData.stores?.map((s: any) => s.store?.domain || s.store?.name) || [],
                    coverUrl: gameData.background_image || undefined,
                    playtime: gameData.playtime || undefined,
                    screenshots: gameData.short_screenshots
                        ?.map((s: any) => s.image)
                        ?.filter((img: string) => img !== gameData.background_image) || [],
                    isEnriched: true
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
