import { HydraGame, EnrichedGame } from "../models/Game";

export interface IStorageProvider {
    loadGames(path: string): Promise<HydraGame[]>;
    saveGames(path: string, games: EnrichedGame[]): Promise<void>;
}
