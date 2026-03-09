import { IGameGateway } from '../../../domain/gateways/IGameGateway';
import { IVideoGateway } from '../../../domain/gateways/IVideoGateway';
import { ILoggerService } from '../../../domain/services/ILoggerService';
import { ExternalGameData } from '../../../domain/data/ExternalGameData';
import { Result } from '../../../domain/common/Result';
import { Failure, NotFoundFailure } from '../../../domain/common/Failure';

export class CompositeGameGateway implements IGameGateway {
    constructor(
        private readonly igdbGateway: IGameGateway,
        private readonly rawgGateway: IGameGateway,
        private readonly videoGateway: IVideoGateway,
        private readonly logger: ILoggerService
    ) { }

    public async getGameDetails(cleanTitle: string): Promise<Result<ExternalGameData | null, Failure>> {
        this.logger.info(`[Composite] Fetching data for "${cleanTitle}"...`);

        // Run API requests concurrently for performance
        const [igdbRes, rawgRes, videoRes] = await Promise.all([
            this.igdbGateway.getGameDetails(cleanTitle),
            this.rawgGateway.getGameDetails(cleanTitle),
            this.videoGateway.getVideosForGame(cleanTitle)
        ]);

        // Gently unwrap results — individual API failures don't block the merge
        const igdbData = igdbRes.isSuccess ? igdbRes.getValue() : null;
        const rawgData = rawgRes.isSuccess ? rawgRes.getValue() : null;
        const videoData = videoRes.isSuccess ? videoRes.getValue() : null;

        // Collect per-API warnings for transparency — these appear in failed_enrichments.json
        const warnings: string[] = [];
        if (igdbRes.isFailure) {
            warnings.push(`IGDB API error: ${igdbRes.getError().message}`);
        } else if (!igdbData) {
            warnings.push('IGDB: no matching game found');
        }
        if (rawgRes.isFailure) {
            warnings.push(`RAWG API error: ${rawgRes.getError().message}`);
        } else if (!rawgData) {
            warnings.push('RAWG: no matching game found');
        }
        if (videoRes.isFailure) {
            warnings.push(`YouTube API error: ${videoRes.getError().message}`);
        } else if (!videoData || videoData.length === 0) {
            warnings.push('YouTube: no videos found on channel');
        }

        // If all data is null, nothing was found — include per-API diagnostics in the failure
        if (!igdbData && !rawgData && (!videoData || videoData.length === 0)) {
            const allFailedMessage = `All APIs returned no data. Details: ${warnings.join(' | ')}`;
            this.logger.warn(`[Composite] "${cleanTitle}" — ${allFailedMessage}`);
            return Result.fail(new NotFoundFailure(allFailedMessage));
        }

        return Result.ok(new ExternalGameData(
            igdbData?.igdbResult ?? null,
            rawgData?.rawgResult ?? null,
            videoData ?? null,
            warnings
        ));
    }
}
