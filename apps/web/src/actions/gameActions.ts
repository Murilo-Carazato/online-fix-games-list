"use server";

import { PostgresGameRepository } from "@hydra/backend-core/src/infrastructure/repositories/PostgresGameRepository";
import type { SortKey, FilterKey } from "@hydra/backend-core/src/domain/repositories/IGameRepository";
import { ConsoleLoggerService } from '@hydra/backend-core/src/infrastructure/logging/ConsoleLoggerService';

// Composition root — the web app depends on the domain contract, not the infra impl
const dataRepository = new PostgresGameRepository(new ConsoleLoggerService());

// ─── Initial data fetch ───────────────────────────────────────────────────────

export async function fetchInitialGamesAction() {
    const result = await dataRepository.getGamesPaginated({ limit: 50, offset: 0 });
    if (result.isSuccess) return { success: true, games: result.getValue() };
    console.error("Failed to fetch initial games:", result.getError().message);
    return { success: false, error: result.getError().message, games: [] };
}

// ─── Paginated fetch (client — Load More / filter changes) ───────────────────

export async function fetchMoreGamesAction(
    offset: number,
    limit: number = 50,
    search: string = '',
    sortBy: SortKey = 'date',
    sortDir: 'asc' | 'desc' = 'desc',
    filterBy: FilterKey = 'all',
) {
    const result = await dataRepository.getGamesPaginated({
        offset, limit, search, sort: sortBy, sortDirection: sortDir, filter: filterBy,
    });
    if (result.isSuccess) return { success: true, games: result.getValue() };
    console.error("Failed to fetch more games:", result.getError().message);
    return { success: false, error: result.getError().message, games: [] };
}