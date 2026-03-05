"use server";

import { PostgresGamePreferenceRepository } from "@hydra/backend-core/src/infrastructure/repositories/PostgresGamePreferenceRepository";
import { PostgresGameDataRepository } from "@hydra/backend-core/src/infrastructure/repositories/PostgresGameDataRepository";
import type { SortKey, FilterKey } from "@hydra/backend-core/src/infrastructure/repositories/PostgresGameDataRepository";

// Instantiate the repositories once (Clean Architecture service boundary)
const prefRepository = new PostgresGamePreferenceRepository();
const dataRepository = new PostgresGameDataRepository();

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

// ─── Preference mutations ─────────────────────────────────────────────────────

export async function toggleWantToPlayAction(title: string, currentState: boolean) {
    try {
        const newState = !currentState;
        await prefRepository.setWantToPlay(title, newState);
        // No revalidatePath: the client uses optimistic UI, a manual refresh triggers fresh SSR.
        return { success: true, newState };
    } catch (error) {
        console.error("Failed to toggle want to play:", error);
        return { success: false, error: "Database error" };
    }
}

export async function toggleIgnoredAction(title: string, currentState: boolean) {
    try {
        const newState = !currentState;
        await prefRepository.setIgnored(title, newState);
        return { success: true, newState };
    } catch (error) {
        console.error("Failed to toggle ignored:", error);
        return { success: false, error: "Database error" };
    }
}

