"use server";

import { PostgresGameRepository } from "@hydra/backend-core/src/infrastructure/repositories/PostgresGameRepository";
import type { SortKey, FilterKey } from "@hydra/backend-core/src/infrastructure/repositories/PostgresGameRepository";

// Instantiate the repositories once (Clean Architecture service boundary)
const dataRepository = new PostgresGameRepository();

// ─── Initial data fetch (replaces direct repo access in page.tsx) ────────────

export async function fetchInitialGamesAction() {
    try {
        const games = await dataRepository.getGamesPaginated({ limit: 50, offset: 0 });
        return { success: true, games };
    } catch (error) {
        console.error("Failed to fetch initial games:", error);
        return { success: false, error: "Database error", games: [] };
    }
}

// ─── Paginated fetch (used by client for Load More / filter changes) ─────────

export async function fetchMoreGamesAction(
    offset: number,
    limit: number = 50,
    search: string = '',
    sortBy: SortKey = 'date',
    sortDir: 'asc' | 'desc' = 'desc',
    filterBy: FilterKey = 'all'
) {
    try {
        const games = await dataRepository.getGamesPaginated({ offset, limit, search, sortBy, sortDir, filterBy });
        return { success: true, games };
    } catch (error) {
        console.error("Failed to fetch more games:", error);
        return { success: false, error: "Database error", games: [] };
    }
}

// ─── Global statistics (COUNT queries — no full table scan) ──────────────────

export async function getGlobalStatsAction() {
    try {
        const stats = await dataRepository.getGlobalStats();
        return { success: true, stats };
    } catch (error) {
        console.error("Failed to fetch global stats:", error);
        return { success: false, error: "Database error", stats: { total: 0, wantToPlay: 0, ignored: 0 } };
    }
}

// ─── Preference mutations have been removed as part of schema refactoring ────
