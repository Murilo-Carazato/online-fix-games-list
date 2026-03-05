import { IGameGateway } from '../../domain/gateways/IGameGateway';
import { IVideoGateway } from '../../domain/gateways/IVideoGateway';
import { ExternalGameData } from '../../domain/data/ExternalGameData';

export class CompositeGameGateway implements IGameGateway {
    constructor(
        private igdbGateway: IGameGateway,
        private rawgGateway: IGameGateway,
        private videoGateway: IVideoGateway
    ) { }

    public async getGameDetails(cleanTitle: string): Promise<ExternalGameData> {
        console.log(`[Composite] Fetching data for "${cleanTitle}"...`);
        // Run API requests concurrently for performance
        const [igdbResult, rawgResult, videoResults] = await Promise.all([
            this.igdbGateway.getGameDetails(cleanTitle),
            this.rawgGateway.getGameDetails(cleanTitle),
            this.videoGateway.getVideosForGame(cleanTitle)
        ]);

        return {
            igdbResult: igdbResult?.igdbResult || null,
            rawgResult: rawgResult?.rawgResult || null,
            videoResults: videoResults
        };
    }
}
