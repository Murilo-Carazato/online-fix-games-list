import axios from 'axios';
import { IGameGateway } from '../../../../domain/gateways/IGameGateway';
import { ExternalGameData, RawgGameData } from '../../../../domain/data/ExternalGameData';
import { RawgGameResponse } from './responses/RawgGameResponse';
import { ILoggerService } from '../../../../domain/services/ILoggerService';
import { Result } from '../../../../domain/common/Result';
import { Failure, ServerFailure } from '../../../../domain/common/Failure';

export class RawgGateway implements IGameGateway {
    // RAWG has a limit of 20,000 requests per month. A slight delay is good practice.
    private readonly requestDelayMs = 250;
    private lastRequestTime = 0;

    private static readonly RATING_WEIGHTS: Record<string, number> = {
        'exceptional': 5,
        'recommended': 4,
        'meh': 3,
        'skip': 1
    };

    constructor(
        private readonly apiKey: string,
        private readonly logger: ILoggerService
    ) { }

    private async delayNextRequest(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.requestDelayMs) {
            const waitTime = this.requestDelayMs - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }

    public async getGameDetails(cleanTitle: string): Promise<Result<ExternalGameData | null, Failure>> {
        await this.delayNextRequest();

        try {
            const searchTerm = encodeURIComponent(cleanTitle);
            const searchUrl = `https://api.rawg.io/api/games?key=${this.apiKey}&search=${searchTerm}&page_size=1`;
            const response = await axios.get<{ results: RawgGameResponse[] }>(searchUrl);

            if (response.data?.results && response.data.results.length > 0) {
                const gameData: RawgGameResponse = response.data.results[0];

                const parsedData: RawgGameData = {
                    rawgId: gameData.id,
                    totalRating: gameData.rating,
                    totalRatingCount: gameData.reviews_count ?? gameData.ratings_count ?? null,
                    ratings: gameData.ratings?.map(r => ({
                        title: r.title,
                        count: r.count,
                        percent: r.percent,
                        score: RawgGateway.RATING_WEIGHTS[r.title.toLowerCase()] ?? 0
                    })) ?? [],
                    added: gameData.added ?? undefined,
                    addedByStatus: gameData.added_by_status ?? undefined,
                    genres: gameData.genres?.map(g => g.name) ?? [],
                    platforms: gameData.platforms?.map(p => p.platform.name) ?? [],
                    playtime: gameData.playtime ?? undefined,
                    screenshots: gameData.short_screenshots
                        ?.map(s => s.image)
                        ?.filter(img => img !== gameData.background_image) ?? []
                };

                return Result.ok(new ExternalGameData(null, parsedData, null));
            }
            return Result.ok(null);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status ?? 'unknown';
                const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
                this.logger.error(`RAWG API Error for "${cleanTitle}": status=${status} ${detail}`);
                return Result.fail(new ServerFailure(`RAWG API Error: ${error.message}`));
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Error processing "${cleanTitle}": ${errorMessage}`);
                return Result.fail(new ServerFailure(`RAWG API Error: ${errorMessage}`));
            }
        }
    }
}
