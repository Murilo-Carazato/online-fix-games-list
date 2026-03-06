import { ExternalGameData } from '../data/ExternalGameData';

import { Result } from '../common/Result';
import { Failure } from '../common/Failure';

export interface IGameGateway {
    getGameDetails(cleanTitle: string): Promise<Result<ExternalGameData | null, Failure>>;
}
