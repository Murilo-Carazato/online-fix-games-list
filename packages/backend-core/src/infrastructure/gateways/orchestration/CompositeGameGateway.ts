import { IGameGateway } from '../../../domain/gateways/IGameGateway';
import { IVideoGateway } from '../../../domain/gateways/IVideoGateway';
import { ILoggerService } from '../../../domain/services/ILoggerService';
import { ExternalGameData } from '../../../domain/data/ExternalGameData';
import { Result } from '../../../domain/common/Result';
import { Failure } from '../../../domain/common/Failure';

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

        // If all data is null, nothing was found and all APIs failed
        if (!igdbData && !rawgData && (!videoData || videoData.length === 0)) {
            return Result.ok(null);
        }

        return Result.ok(new ExternalGameData(
            igdbData?.igdbResult ?? null,
            rawgData?.rawgResult ?? null,
            videoData ?? null
        ));
    }
}
