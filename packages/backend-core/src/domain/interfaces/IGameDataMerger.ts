import { EnrichedGame, IgdbGameData, RawgGameData, IVideoResult } from '../entities/Game';

export interface IGameDataMerger {
    merge(igdbData: Partial<IgdbGameData> | null, rawgData: Partial<RawgGameData> | null, videoData: IVideoResult[] | null): Partial<EnrichedGame> | null;
}
