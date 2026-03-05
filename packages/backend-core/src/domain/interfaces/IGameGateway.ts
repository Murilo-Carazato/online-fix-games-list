import { EnrichedGame } from "../entities/Game";

export interface IGameGateway<T = Partial<EnrichedGame>> {
    getGameDetails(cleanTitle: string): Promise<T | null>;
}
