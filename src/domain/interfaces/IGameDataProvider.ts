import { EnrichedGame } from "../models/Game";

export interface IGameDataProvider<T = Partial<EnrichedGame>> {
    getGameDetails(cleanTitle: string): Promise<T | null>;
}
