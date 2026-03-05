import { ExternalGameData } from '../data/ExternalGameData';

export interface IGameGateway {
    getGameDetails(cleanTitle: string): Promise<ExternalGameData | null>;
}
