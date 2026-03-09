import { EnrichedGameEntity } from '../entities/EnrichedGameEntity';
import { Result } from '../common/Result';
import { Failure, StorageFailure, NotFoundFailure } from '../common/Failure';

// ─── Query Types (belong to the domain contract, NOT to the infra impl) ───────

export type SortKey = 'date' | 'rating' | 'popularity' | 'title' | 'playtime' | 'fileSize';

export interface AdvancedFilters {
    fileSizeMin?: number;
    fileSizeMax?: number;
    ratingMin?: number;
    ratingMax?: number;
    addedByMin?: number;
    addedByMax?: number;
    genres?: string[];
    themes?: string[];
    gameModes?: string[];
    stores?: string[];
    languages?: string[];
    hasAlanzoka?: boolean;
    hasMedia?: boolean;
}

export interface FilterOptions {
    genres: string[];
    themes: string[];
    gameModes: string[];
    languages: string[];
    stores: string[];
}

export interface PaginatedQueryProps {
    limit?: number;
    offset?: number;
    search?: string;
    filters?: AdvancedFilters;
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

    /**
     * Returns the set of titles that already have external enrichment data
     * (i.e., an IGDB ID is present). Used for idempotent enrichment runs.
     */
    getEnrichedTitles(): Promise<Result<Set<string>, StorageFailure>>;

    getGames(titles: string[]): Promise<Result<EnrichedGameEntity[], StorageFailure>>;

    getGamesPaginated(props?: PaginatedQueryProps): Promise<Result<{ data: EnrichedGameEntity[]; totalCount: number }, StorageFailure>>;

    getGameById(id: number): Promise<Result<EnrichedGameEntity, StorageFailure | NotFoundFailure>>;

    getFilterOptions(): Promise<Result<FilterOptions, StorageFailure>>;
}

