import { IGameGateway } from '../../domain/interfaces/IGameGateway';
import { IVideoGateway } from '../../domain/interfaces/IVideoGateway';
import { IGameDataMerger } from '../../domain/interfaces/IGameDataMerger';
import { EnrichedGame, IgdbGameData, RawgGameData } from '../../domain/entities/Game';

export class CompositeGameGateway implements IGameGateway {
    constructor(
        private igdbProvider: IGameGateway<Partial<IgdbGameData>>,
        private rawgProvider: IGameGateway<Partial<RawgGameData>>,
        private videoProvider: IVideoGateway,
        private gameDataMerger: IGameDataMerger
    ) { }

    public async getGameDetails(cleanTitle: string): Promise<Partial<EnrichedGame> | null> {
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
