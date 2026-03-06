import axios from 'axios';
import { IGameGateway } from '../../../../domain/gateways/IGameGateway';
import { ExternalGameData, IgdbGameData } from '../../../../domain/data/ExternalGameData';
import { IgdbGameResponse } from './responses/IgdbGameResponse';
import { ILoggerService } from '../../../../domain/services/ILoggerService';
import { Result } from '../../../../domain/common/Result';
import { Failure, ServerFailure } from '../../../../domain/common/Failure';

export class IgdbGateway implements IGameGateway {
    // IGDB Limit: 4 requests per second
    private readonly requestDelayMs = 300;
    private accessToken: string | null = null;
    private tokenExpiration: number = 0;
    private lastRequestTime = 0;

    constructor(
        private readonly clientId: string,
        private readonly clientSecret: string,
        private readonly logger: ILoggerService
    ) { }

    private async authenticate(): Promise<void> {
        const now = Date.now();
        // Refresh token if it doesn't exist or is about to expire (within 5 minutes)
        if (!this.accessToken || now > this.tokenExpiration - 300000) {
            try {
                this.logger.info('Authenticating with Twitch/IGDB...');
                const response = await axios.post(
                    `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`
                );
                this.accessToken = response.data.access_token;
                this.tokenExpiration = now + (response.data.expires_in * 1000);
                this.logger.info('Authentication successful.');
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to authenticate with IGDB: ${msg}`);
                throw new Error('IGDB Authentication failed');
            }
        }
    }

    private async delayNextRequest(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.requestDelayMs) {
            const waitTime = this.requestDelayMs - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }

    private mapExternalGame(url: string): { storeName: string; categoryIcon: string; url: string } {
        let storeName = 'Other';
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.includes('steampowered.com')) storeName = 'Steam';
        else if (lowerUrl.includes('playstation.com')) storeName = 'PlayStation';
        else if (lowerUrl.includes('xbox.com')) storeName = 'Xbox';
        else if (lowerUrl.includes('epicgames.com')) storeName = 'Epic Games';
        else if (lowerUrl.includes('gog.com')) storeName = 'GOG';
        else if (lowerUrl.includes('nintendo.com')) storeName = 'Nintendo';

        const domain = new URL(url).hostname;
        const categoryIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        return { storeName, categoryIcon, url };
    }

    public async getGameDetails(cleanTitle: string): Promise<Result<ExternalGameData | null, Failure>> {
        await this.authenticate();
        await this.delayNextRequest();

        const safeTitle = cleanTitle.replace(/"/g, '\\"');
        const query = `
      search "${safeTitle}"; 
      fields name, genres.name, cover.url, total_rating, total_rating_count, 
             themes.name, platforms.name, game_modes.name, 
             language_supports.language.name, language_supports.language_support_type.name, 
             franchises.name, external_games.url, videos.video_id; 
      limit 1;
    `;

        try {
            const response = await axios.post<IgdbGameResponse[]>('https://api.igdb.com/v4/games', query, {
                headers: {
                    'Client-ID': this.clientId,
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json',
                    'Content-Type': 'text/plain'
                }
            });

            if (response.data && response.data.length > 0) {
                const gameData: IgdbGameResponse = response.data[0];

                const parsedData: IgdbGameData = {
                    igdbId: gameData.id,
                    totalRating: gameData.total_rating ?? null,
                    totalRatingCount: gameData.total_rating_count ?? null,
                    genres: gameData.genres?.map(g => g.name) ?? [],
                    themes: gameData.themes?.map(t => t.name) ?? [],
                    platforms: gameData.platforms?.map(p => p.name) ?? [],
                    gameModes: gameData.game_modes?.map(m => m.name) ?? [],
                    languageSupports: gameData.language_supports
                        ?.filter(l => {
                            const name = l.language?.name?.toLowerCase() ?? '';
                            return name.includes('english') || name.includes('portuguese');
                        })
                        ?.map(l => `${l.language?.name ?? 'Unknown'} (${l.language_support_type?.name ?? 'Unknown'})`) ?? [],
                    franchises: gameData.franchises?.map(f => f.name) ?? [],
                    externalGames: gameData.external_games
                        ?.filter(e => e.url && !e.url.includes('twitch.tv'))
                        ?.map(e => this.mapExternalGame(e.url)) ?? [],
                    videos: gameData.videos?.map(v => `https://www.youtube.com/watch?v=${v.video_id}`) ?? [],
                    coverUrl: gameData.cover?.url ? gameData.cover.url.replace('t_thumb', 't_cover_big') : undefined
                };

                return Result.ok(new ExternalGameData(parsedData, null, null));
            }

            return Result.ok(null);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status ?? 'unknown';
                const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
                this.logger.error(`IGDB API Error for "${cleanTitle}": status=${status} ${detail}`);
                return Result.fail(new ServerFailure(`IGDB API Error: ${error.message}`));
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Error processing "${cleanTitle}": ${errorMessage}`);
                return Result.fail(new ServerFailure(`IGDB API Error: ${errorMessage}`));
            }
        }
    }
}
