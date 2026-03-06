import { EnrichedGameEntity } from '../entities/EnrichedGameEntity';
import { Result } from '../common/Result';
import { Failure, StorageFailure } from '../common/Failure';

// ─── Query Types (belong to the domain contract, NOT to the infra impl) ───────

export type SortKey = 'date' | 'rating' | 'popularity' | 'title' | 'playtime';
export type FilterKey = 'all';

export interface PaginatedQueryProps {
    limit?: number;
    offset?: number;
    search?: string;
    filter?: FilterKey;
    sort?: SortKey;
    sortDirection?: 'asc' | 'desc';
}

// ─── Repository Contract ───────────────────────────────────────────────────────

/**
 * Contract for persisting and querying enriched game data.
 * Implementations write to and read from a database (Postgres).
 *
 * All public methods return Result<T, StorageFailure> so callers
 * never need to catch raw exceptions from infrastructure.
 */
export interface IGameRepository {
    saveGames(games: EnrichedGameEntity[]): Promise<Result<void, Failure>>;

    getGames(titles: string[]): Promise<Result<EnrichedGameEntity[], StorageFailure>>;

    getGamesPaginated(props?: PaginatedQueryProps): Promise<Result<EnrichedGameEntity[], StorageFailure>>;
}
