import axios from 'axios';
import { IVideoGateway } from '../../../../domain/gateways/IVideoGateway';
import { ILoggerService } from '../../../../domain/services/ILoggerService';
import { VideoEntity } from '../../../../domain/entities/VideoEntity';
import { YoutubeVideoResponse } from './responses/YoutubeVideoResponse';
import { Result } from '../../../../domain/common/Result';
import { Failure } from '../../../../domain/common/Failure';
import { AxiosRateLimitedGateway } from '../../base/AxiosRateLimitedGateway';

export class YoutubeGateway extends AxiosRateLimitedGateway implements IVideoGateway {
    // YouTube Data API v3: search costs 100 units; ~100 searches/day on free tier.
    private static readonly RATE_LIMIT_MS = 200;
    private readonly baseUrl = 'https://www.googleapis.com/youtube/v3/search';

    // Flag to quickly short-circuit future searches once daily quota is hit
    private quotaExceeded = false;

    constructor(
        private readonly apiKey: string,
        private readonly channelId: string,
        logger: ILoggerService
    ) {
        super(logger, YoutubeGateway.RATE_LIMIT_MS);
    }

    private async searchVideos(cleanTitle: string): Promise<VideoEntity[] | null> {
        if (this.quotaExceeded) {
            return null;
        }

        this.logger.info(`[Youtube] Searching video for "${cleanTitle}"...`);

        try {
            const response = await axios.get<YoutubeVideoResponse>(this.baseUrl, {
                params: {
                    key: this.apiKey,
                    channelId: this.channelId,
                    q: cleanTitle,
                    part: 'snippet',
                    type: 'video',
                    maxResults: 5,
                    order: 'relevance'
                }
            });

            const relevant = this.filterRelevantVideos(cleanTitle, response.data.items);

            if (relevant.length > 0) {
                this.logger.info(`[Youtube] Found ${relevant.length} video(s) for "${cleanTitle}".`);
                return relevant;
            }

            const totalFound = response.data.items?.length ?? 0;
            this.logger.info(
                totalFound > 0
                    ? `[Youtube] Videos found but none were sufficiently relevant for "${cleanTitle}".`
                    : `[Youtube] No video found for "${cleanTitle}" on the channel.`
            );
            return null;

        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                // Safely cast response data since we know it's an AxiosError but TS doesn't know its payload shape
                const responseData = error.response.data as { error?: { message?: string } } | undefined;
                const message = responseData?.error?.message || '';

                if (message.toLowerCase().includes('quota')) {
                    this.logger.warn('[Youtube] Daily API Quota Exceeded (403). Gracefully disabling YouTube search for the remainder of this execution.');
                    this.quotaExceeded = true;
                    return null; // Return null to fail gracefully and allow game enrichment to continue 
                }
            }
            throw error; // Re-throw for base RateLimitedGateway to handle other errors (e.g., 500s)
        }
    }

    private filterRelevantVideos(cleanTitle: string, items: YoutubeVideoResponse['items']): VideoEntity[] {
        if (!items) return [];
        const titleWords = cleanTitle.toLowerCase().split(' ').filter(w => w.length > 2);

        return items
            .filter(item => {
                const videoTitle = item.snippet.title.toLowerCase();
                return titleWords.some(word => videoTitle.includes(word));
            })
            .map(item => new VideoEntity(
                `https://www.youtube.com/watch?v=${item.id.videoId}`,
                item.snippet.title,
                item.snippet.publishedAt,
                item.snippet.thumbnails?.high?.url ?? '',
                item.snippet.channelTitle
            ));
    }

    public async getVideosForGame(cleanTitle: string): Promise<Result<VideoEntity[] | null, Failure>> {
        if (!this.apiKey) {
            this.logger.warn('[Youtube] API Key not provided. Skipping search.');
            return Result.ok(null);
        }
        return this.executeWithRateLimit(cleanTitle, 'YouTube API', () => this.searchVideos(cleanTitle));
    }
}
