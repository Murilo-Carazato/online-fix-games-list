import { EnrichedGame } from "../models/Game";

export interface IGameDataProvider {
    getGameDetails(cleanTitle: string): Promise<Partial<EnrichedGame> | null>;
}
