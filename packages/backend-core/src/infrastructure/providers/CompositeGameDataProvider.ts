import { IGameDataProvider, IVideoProvider, IGameDataMerger, EnrichedGame, IgdbGameData, RawgGameData } from '../../domain';

export class CompositeGameDataProvider implements IGameDataProvider {
    constructor(
        private igdbProvider: IGameDataProvider<Partial<IgdbGameData>>,
        private rawgProvider: IGameDataProvider<Partial<RawgGameData>>,
        private videoProvider: IVideoProvider,
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
