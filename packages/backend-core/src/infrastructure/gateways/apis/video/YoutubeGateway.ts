import axios from 'axios';
import { IVideoGateway } from '../../../../domain/gateways/IVideoGateway';
import { ILoggerService } from '../../../../domain/services/ILoggerService';
import { VideoEntity } from '../../../../domain/entities/VideoEntity';
import { YoutubeVideoResponse } from './responses/YoutubeVideoResponse';
import { Result } from '../../../../domain/common/Result';
import { Failure } from '../../../../domain/common/Failure';
import { RateLimitedGateway } from '../../base/RateLimitedGateway';

export class YoutubeGateway extends RateLimitedGateway implements IVideoGateway {
    // YouTube Data API v3: search costs 100 units; ~100 searches/day on free tier.
    private static readonly RATE_LIMIT_MS = 200;
    private readonly baseUrl = 'https://www.googleapis.com/youtube/v3/search';

    constructor(
        private readonly apiKey: string,
        private readonly channelId: string,
        logger: ILoggerService
    ) {
        super(logger, YoutubeGateway.RATE_LIMIT_MS);
    }

    private async searchVideos(cleanTitle: string): Promise<VideoEntity[] | null> {
        this.logger.info(`[Youtube] Searching video for "${cleanTitle}"...`);

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
