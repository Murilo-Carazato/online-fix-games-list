import axios from 'axios';
import { IGameDataProvider } from '../domain/interfaces/IGameDataProvider';
import { EnrichedGame } from '../domain/models/Game';

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

    public async getGameDetails(cleanTitle: string): Promise<Partial<EnrichedGame> | null> {
        await this.authenticate();
        await this.delayNextRequest();

        // Escape quotes to prevent syntax errors in apicalypse string
        const safeTitle = cleanTitle.replace(/"/g, '\\"');

        // Searching games using Apicalypse syntax
        // We want the name, genres.name, cover.url, and total_rating to enrich our data
        const query = `
      search "${safeTitle}"; 
      fields name, genres.name, cover.url, total_rating; 
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
                    rating: gameData.total_rating, // IGDB total_rating is a double (0-100)
                    genres: gameData.genres ? gameData.genres.map((g: any) => g.name) : [],
                    coverUrl: gameData.cover?.url ? gameData.cover.url.replace('t_thumb', 't_cover_big') : undefined,
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
