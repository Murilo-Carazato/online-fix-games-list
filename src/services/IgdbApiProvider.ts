import axios from 'axios';
import { IGameDataProvider } from '../domain/interfaces/IGameDataProvider';
import { EnrichedGame, IgdbGameData } from '../domain/models/Game';

export class IgdbApiProvider implements IGameDataProvider {
    private clientId: string;
    private clientSecret: string;
    private accessToken: string | null = null;
    private tokenExpiration: number = 0;

    // IGDB Limit: 4 requests per second
    private requestDelayMs = 300;
    private lastRequestTime = 0;

    constructor(clientId: string, clientSecret: string) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    private async authenticate() {
        const now = Date.now();
        // Refresh token if it doesn't exist or is about to expire (within 5 minutes)
        if (!this.accessToken || now > this.tokenExpiration - 300000) {
            try {
                console.log("Authenticating with Twitch/IGDB...");
                const response = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`);
                this.accessToken = response.data.access_token;
                // set expiration time (expires_in is in seconds)
                this.tokenExpiration = now + (response.data.expires_in * 1000);
                console.log("Authentication successful.");
            } catch (error) {
                console.error("Failed to authenticate with IGDB", error);
                throw new Error("IGDB Authentication failed");
            }
        }
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

    public async getGameDetails(cleanTitle: string): Promise<Partial<IgdbGameData> | null> {
        await this.authenticate();
        await this.delayNextRequest();

        // Escape quotes to prevent syntax errors in apicalypse string
        const safeTitle = cleanTitle.replace(/"/g, '\\"');

        // Searching games using Apicalypse syntax
        // We want expanded metadata to enrich our data
        const query = `
      search "${safeTitle}"; 
      fields name, genres.name, cover.url, total_rating, total_rating_count, 
             themes.name, platforms.name, game_modes.name, 
             language_supports.language.name, language_supports.language_support_type.name, 
             franchises.name, external_games.url, videos.video_id; 
      limit 1;
    `;

        try {
            const response = await axios.post('https://api.igdb.com/v4/games', query, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'text/plain'
                }
            });

            if (response.data && response.data.length > 0) {
                const gameData = response.data[0];

                // Map IGDB response to our Partial<EnrichedGame>
                return {
                    igdbId: gameData.id,
                    totalRating: gameData.total_rating ?? null,
                    totalRatingCount: gameData.total_rating_count ?? null,
                    genres: gameData.genres?.map((g: any) => g.name) || [],
                    themes: gameData.themes?.map((t: any) => t.name) || [],
                    platforms: gameData.platforms?.map((p: any) => p.name) || [],
                    gameModes: gameData.game_modes?.map((m: any) => m.name) || [],
                    languageSupports: gameData.language_supports
                        ?.filter((l: any) => {
                            const name = l.language?.name?.toLowerCase() || '';
                            return name.includes('english') || name.includes('portuguese');
                        })
                        ?.map((l: any) => `${l.language?.name ?? 'Unknown'} (${l.language_support_type?.name ?? 'Unknown'})`) || [],
                    franchises: gameData.franchises?.map((f: any) => f.name) || [],
                    externalGames: gameData.external_games
                        ?.filter((e: any) => e.url && !e.url.includes('twitch.tv'))
                        ?.map((e: any) => {
                            let storeId = 99; // 99 for other
                            const url = e.url.toLowerCase();
                            if (url.includes('steampowered.com')) storeId = 1;
                            else if (url.includes('playstation.com')) storeId = 2;
                            else if (url.includes('xbox.com')) storeId = 3;
                            else if (url.includes('epicgames.com')) storeId = 4;
                            else if (url.includes('gog.com')) storeId = 5;
                            else if (url.includes('nintendo.com')) storeId = 6;
                            return { id: storeId, url: e.url };
                        }) || [],
                    videos: gameData.videos?.map((v: any) => `https://www.youtube.com/watch?v=${v.video_id}`) || [],
                    coverUrl: gameData.cover?.url ? gameData.cover.url.replace('t_thumb', 't_cover_big') : undefined
                };
            }

            return null;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error(`IGDB API Error for "${cleanTitle}":`, error.response?.status, error.response?.data || error.message);
            } else {
                console.error(`Error processing "${cleanTitle}":`, error);
            }
            return null;
        }
    }
}
