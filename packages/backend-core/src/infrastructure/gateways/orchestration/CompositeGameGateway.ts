import { IGameGateway } from '../../../domain/gateways/IGameGateway';
import { IVideoGateway } from '../../../domain/gateways/IVideoGateway';
import { ExternalGameData } from '../../../domain/data/ExternalGameData';
import { Result } from '../../../domain/common/Result';
import { Failure } from '../../../domain/common/Failure';

export class CompositeGameGateway implements IGameGateway {
    constructor(
        private igdbGateway: IGameGateway,
        private rawgGateway: IGameGateway,
        private videoGateway: IVideoGateway
    ) { }

    public async getGameDetails(cleanTitle: string): Promise<Result<ExternalGameData | null, Failure>> {
        console.log(`[Composite] Fetching data for "${cleanTitle}"...`);

        // Run API requests concurrently for performance
        const [igdbRes, rawgRes, videoRes] = await Promise.all([
            this.igdbGateway.getGameDetails(cleanTitle),
            this.rawgGateway.getGameDetails(cleanTitle),
            this.videoGateway.getVideosForGame(cleanTitle)
        ]);

        // We gently unwrap the results here. If an individual API failed,
        // we log it or ignore it, preferring to merge whatever succeeded.
        const igdbData = igdbRes.isSuccess ? igdbRes.getValue() : null;
        const rawgData = rawgRes.isSuccess ? rawgRes.getValue() : null;
        const videoData = videoRes.isSuccess ? videoRes.getValue() : null;

        // If all pieces of data are null, it means we found absolutely nothing or all APIs failed.
        if (!igdbData && !rawgData && (!videoData || videoData.length === 0)) {
            return Result.ok(null);
        }

        const externalData: ExternalGameData = {
            igdbResult: igdbData?.igdbResult || null,
            rawgResult: rawgData?.rawgResult || null,
            videoResults: videoData || null
        };

        return Result.ok(externalData);
    }
}
