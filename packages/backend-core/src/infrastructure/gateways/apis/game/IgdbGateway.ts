import axios from 'axios';
import { IGameGateway } from '../../../../domain/gateways/IGameGateway';
import { ExternalGameData, IgdbGameData } from '../../../../domain/data/ExternalGameData';
import { IStoreMatcherService } from '../../../../domain/services/IStoreMatcherService';
import { IgdbGameResponse } from './responses/IgdbGameResponse';
import { ILoggerService } from '../../../../domain/services/ILoggerService';
import { Result } from '../../../../domain/common/Result';
import { Failure } from '../../../../domain/common/Failure';
import { AxiosRateLimitedGateway } from '../../base/AxiosRateLimitedGateway';

export class IgdbGateway extends AxiosRateLimitedGateway implements IGameGateway {
    private static readonly RATE_LIMIT_MS = 300;

    private accessToken: string | null = null;
    private tokenExpiration: number = 0;

    constructor(
        private readonly clientId: string,
        private readonly clientSecret: string,
        logger: ILoggerService,
        private readonly storeMatcher: IStoreMatcherService
    ) {
        super(logger, IgdbGateway.RATE_LIMIT_MS);
    }

    private async authenticate(): Promise<void> {
        const now = Date.now();
        if (!this.accessToken || now > this.tokenExpiration - 300000) {
            try {
                this.logger.info('Authenticating with Twitch/IGDB...');
                const response = await axios.post(
                    `https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`
                );
                this.accessToken = response.data.access_token;
                this.tokenExpiration = now + (response.data.expires_in * 1000);
                this.logger.info('IGDB: Authentication successful.');
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                this.logger.error(`Failed to authenticate with IGDB: ${msg}`);
                throw new Error('IGDB Authentication failed');
            }
        }
    }

    private async fetchGameData(cleanTitle: string): Promise<ExternalGameData | null> {
        const query = `
      search "${cleanTitle}"; 
      fields name, genres.name, cover.url, total_rating, total_rating_count, 
             themes.name, platforms.name, game_modes.name, 
             language_supports.language.name, language_supports.language_support_type.name, 
             franchises.name, external_games.url, videos.video_id; 
      limit 1;
    `;
        const response = await axios.post<IgdbGameResponse[]>('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': this.clientId,
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain'
            }
        });

        if (!response.data || response.data.length === 0) return null;

        const gameData: IgdbGameResponse = response.data[0];

        const externalUrls = gameData.external_games
            ?.filter(e => e.url && !e.url.includes('twitch.tv'))
            ?.map(e => e.url) ?? [];

        const externalGames = await Promise.all(
            externalUrls.map(async (url) => {
                const { storeId, storeName, categoryIcon } = await this.storeMatcher.matchStore(url);
                return { storeId, storeName, categoryIcon, url };
            })
        );

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
                ?.map(l => ({
                    language: l.language?.name ?? 'Unknown',
                    supportType: l.language_support_type?.name ?? 'Unknown',
                })) ?? [],
            franchises: gameData.franchises?.map(f => f.name) ?? [],
            externalGames,
            videos: gameData.videos?.map(v => `https://www.youtube.com/watch?v=${v.video_id}`) ?? [],
            coverUrl: gameData.cover?.url ? gameData.cover.url.replace('t_thumb', 't_cover_big') : undefined
        };

        return new ExternalGameData(parsedData, null, null);
    }

    public async getGameDetails(cleanTitle: string): Promise<Result<ExternalGameData | null, Failure>> {
        await this.authenticate();
        return this.executeWithRateLimit(cleanTitle, 'IGDB API', () => this.fetchGameData(cleanTitle));
    }
}
