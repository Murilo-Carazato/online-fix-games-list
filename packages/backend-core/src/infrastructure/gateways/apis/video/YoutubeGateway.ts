import axios from 'axios';
import { IVideoGateway } from '../../../../domain/gateways/IVideoGateway';
import { ILoggerService } from '../../../../domain/services/ILoggerService';
import { VideoEntity } from '../../../../domain/entities/VideoEntity';
import { YoutubeVideoResponse } from './responses/YoutubeVideoResponse';
import { Result } from '../../../../domain/common/Result';
import { Failure, ServerFailure } from '../../../../domain/common/Failure';

export class YoutubeGateway implements IVideoGateway {
    private readonly baseUrl = 'https://www.googleapis.com/youtube/v3/search';

    constructor(
        private readonly apiKey: string,
        private readonly channelId: string,
        private readonly logger: ILoggerService
    ) { }

    public async getVideosForGame(cleanTitle: string): Promise<Result<VideoEntity[] | null, Failure>> {
        if (!this.apiKey) {
            this.logger.warn('[Youtube] API Key not provided. Skipping search.');
            return Result.ok(null);
        }

        try {
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

            if (response.data.items && response.data.items.length > 0) {
                const relevantVideos: VideoEntity[] = [];
                const titleWords = cleanTitle.toLowerCase().split(' ').filter(w => w.length > 2);

                for (const item of response.data.items) {
                    const videoId = item.id.videoId;
                    const videoTitle = item.snippet.title.toLowerCase();
                    const isRelevant = titleWords.some(word => videoTitle.includes(word));

                    if (isRelevant) {
                        relevantVideos.push(new VideoEntity(
                            `https://www.youtube.com/watch?v=${videoId}`,
                            item.snippet.title,
                            item.snippet.publishedAt,
                            item.snippet.thumbnails?.high?.url ?? '',
                            item.snippet.channelTitle
                        ));
                    }
                }

                if (relevantVideos.length > 0) {
                    this.logger.info(`[Youtube] Found ${relevantVideos.length} video(s) for "${cleanTitle}".`);
                    return Result.ok(relevantVideos);
                }

                this.logger.info(`[Youtube] Videos found but none were sufficiently relevant for "${cleanTitle}".`);
            } else {
                this.logger.info(`[Youtube] No video found for "${cleanTitle}" on the channel.`);
            }

            return Result.ok(null);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status ?? 'unknown';
                const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
                this.logger.error(`YouTube API Error for "${cleanTitle}": status=${status} ${detail}`);
                return Result.fail(new ServerFailure(`Youtube API Error: ${error.message}`));
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`[Youtube] Unexpected error: ${errorMessage}`);
                return Result.fail(new ServerFailure(`Youtube API Error: ${errorMessage}`));
            }
        }
    }
}
