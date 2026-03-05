import { ExternalGameData } from '../models/ExternalGameData';

export interface IGameGateway {
    getGameDetails(cleanTitle: string): Promise<ExternalGameData | null>;
}
