import { EnrichedGameEntity } from '../entities/EnrichedGameEntity';

/**
 * Contract for persisting and querying enriched game data.
 * Implementations write to and read from a database (Postgres).
 */
import { Result } from '../common/Result';
import { Failure } from '../common/Failure';

export interface IGameRepository {
    saveGames(games: EnrichedGameEntity[]): Promise<Result<void, Failure>>;
}
