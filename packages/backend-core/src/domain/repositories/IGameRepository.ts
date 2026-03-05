import { HydraGameEntity, EnrichedGameEntity } from "../entities/Game";

export interface IGameRepository {
    loadGames(path: string): Promise<HydraGameEntity[]>;
    saveGames(path: string, games: EnrichedGameEntity[]): Promise<void>;
}
