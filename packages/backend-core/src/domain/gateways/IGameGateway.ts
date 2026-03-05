import { EnrichedGameEntity } from "../entities/Game";

export interface IGameGateway<T = Partial<EnrichedGameEntity>> {
    getGameDetails(cleanTitle: string): Promise<T | null>;
}
