import { ExternalGameDto } from '../dtos/ExternalGameDto';

export interface IGameGateway {
    getGameDetails(cleanTitle: string): Promise<ExternalGameDto | null>;
}
