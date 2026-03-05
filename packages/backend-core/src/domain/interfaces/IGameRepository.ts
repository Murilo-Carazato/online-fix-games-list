import { HydraGame, EnrichedGame } from "../entities/Game";

export interface IGameRepository {
    loadGames(path: string): Promise<HydraGame[]>;
    saveGames(path: string, games: EnrichedGame[]): Promise<void>;
}
