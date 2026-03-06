import axios from 'axios';
import { IGameGateway } from '../../../../domain/gateways/IGameGateway';
import { ExternalGameData, RawgGameData, RawgRating } from '../../../../domain/data/ExternalGameData';
import { RawgGameResponse } from './responses/RawgGameResponse';
import { ILoggerService } from '../../../../domain/services/ILoggerService';
import { Result } from '../../../../domain/common/Result';
import { Failure } from '../../../../domain/common/Failure';
import { RateLimitedGateway } from '../../base/RateLimitedGateway';

export class RawgGateway extends RateLimitedGateway implements IGameGateway {
    // RAWG: 20,000 req/month. A conservative delay prevents bursting.
    private static readonly RATE_LIMIT_MS = 250;

    constructor(
        private readonly apiKey: string,
        logger: ILoggerService
    ) {
        super(logger, RawgGateway.RATE_LIMIT_MS);
    }

    private async fetchGameData(cleanTitle: string): Promise<ExternalGameData | null> {
        const searchTerm = encodeURIComponent(cleanTitle);
        const url = `https://api.rawg.io/api/games?key=${this.apiKey}&search=${searchTerm}&page_size=1`;
        const response = await axios.get<{ results: RawgGameResponse[] }>(url);

        if (!response.data?.results || response.data.results.length === 0) return null;

        const gameData: RawgGameResponse = response.data.results[0];

        const ratings: RawgRating[] = gameData.ratings?.map(r => ({
            title: r.title,
            count: r.count,
            percent: r.percent,
            score: 0, // Resolved from rating_categories seed table when reading from DB
        })) ?? [];

        const parsedData: RawgGameData = {
            rawgId: gameData.id,
            totalRating: gameData.rating,
            totalRatingCount: gameData.reviews_count ?? gameData.ratings_count ?? null,
            ratings,
            added: gameData.added ?? undefined,
            addedByStatus: gameData.added_by_status ?? undefined,
            genres: gameData.genres?.map(g => g.name) ?? [],
            platforms: gameData.platforms?.map(p => p.platform.name) ?? [],
            playtime: gameData.playtime ?? undefined,
            screenshots: gameData.short_screenshots
                ?.map(s => s.image)
                ?.filter(img => img !== gameData.background_image) ?? []
        };

        return new ExternalGameData(null, parsedData, null);
    }

    public async getGameDetails(cleanTitle: string): Promise<Result<ExternalGameData | null, Failure>> {
        return this.executeWithRateLimit(cleanTitle, 'RAWG API', () => this.fetchGameData(cleanTitle));
    }
}
