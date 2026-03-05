import { IGameGateway } from '../../domain/gateways/IGameGateway';
import { IVideoGateway } from '../../domain/gateways/IVideoGateway';
import { IGameDataMergerService } from '../../domain/services/GameDataMergerService';
import { EnrichedGameEntity, IgdbGameData, RawgGameData } from '../../domain/entities/Game';

export class CompositeGameGateway implements IGameGateway {
    constructor(
        private igdbProvider: IGameGateway<Partial<IgdbGameData>>,
        private rawgProvider: IGameGateway<Partial<RawgGameData>>,
        private videoProvider: IVideoGateway,
        private gameDataMerger: IGameDataMergerService
    ) { }

    public async getGameDetails(cleanTitle: string): Promise<Partial<EnrichedGameEntity> | null> {
        console.log(`[Composite] Fetching data for "${cleanTitle}"...`);
        // Run both API requests concurrently for performance
        const [igdbResult, rawgResult, videoResults] = await Promise.all([
            this.igdbProvider.getGameDetails(cleanTitle),
            this.rawgProvider.getGameDetails(cleanTitle),
            this.videoProvider.getVideosForGame(cleanTitle)
        ]);

        // Delegate the complex algorithmic merge to the dedicated Merger service
        return this.gameDataMerger.merge(igdbResult, rawgResult, videoResults);
    }
}
