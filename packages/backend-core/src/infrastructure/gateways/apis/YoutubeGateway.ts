import axios from 'axios';
import { IVideoGateway } from '../../../domain/gateways/IVideoGateway';
import { VideoEntity } from '../../../domain/entities/VideoEntity';
import { YoutubeVideoResponse } from './responses/YoutubeVideoResponse';

export class YoutubeGateway implements IVideoGateway {
    private apiKey: string;
    private channelId: string;
    private readonly baseUrl = 'https://www.googleapis.com/youtube/v3/search';

    constructor(apiKey: string, channelId: string) {
        this.apiKey = apiKey;
        this.channelId = channelId;
    }

    /**
     * Searches for videos of a game on the configured channel.
     * @param cleanTitle The game title to search for.
     * @returns An array of video details objects, or null if none found.
     */
    public async getVideosForGame(cleanTitle: string): Promise<VideoEntity[] | null> {
        if (!this.apiKey) {
            console.warn('[Youtube] API Key not provided. Skipping search.');
            return null;
        }

        try {
            console.log(`[Youtube] Searching video for "${cleanTitle}"...`);

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

                    // Simple heuristic to avoid false positives: 
                    // check if the game title (or parts of it) is in the video title
                    const isRelevant = titleWords.some(word => videoTitle.includes(word));

                    if (isRelevant) {
                        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                        const snippet = item.snippet;

                        relevantVideos.push(new VideoEntity(
                            videoUrl,
                            snippet.title,
                            snippet.publishedAt,
                            snippet.thumbnails?.high?.url || '',
                            snippet.channelTitle
                        ));
                    }
                }

                if (relevantVideos.length > 0) {
                    console.log(`[Youtube] Found ${relevantVideos.length} video(s) for "${cleanTitle}".`);
                    return relevantVideos;
                }

                console.log(`[Youtube] Videos found but none were sufficiently relevant for "${cleanTitle}".`);
            } else {
                console.log(`[Youtube] No video found for "${cleanTitle}" on the channel.`);
            }

            return null;
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                console.error(`YouTube API Error for "${cleanTitle}":`, error.response?.status, (error.response?.data as any) || error.message);
            } else {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`[Youtube] Unexpected error searching for video:`, errorMessage);
            }
            return null;
        }
    }
}
