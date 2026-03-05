import { EnrichedGameEntity } from '../entities/EnrichedGameEntity';

/**
 * Contract for persisting and querying enriched game data.
 * Implementations write to and read from a database (Postgres).
 */
export interface IGameRepository {
    saveGames(games: EnrichedGameEntity[]): Promise<void>;
}
