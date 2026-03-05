import { EnrichedGameEntity } from '../entities/EnrichedGameEntity';
import { HydraGameEntity } from '../entities/HydraGameEntity';

export interface IGameRepository {
    loadGames(path: string): Promise<HydraGameEntity[]>;
    saveGames(path: string, games: EnrichedGameEntity[]): Promise<void>;
}
