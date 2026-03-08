"use server";

import { getGamesPaginatedUseCase } from "@/di/container";
import type { SortKey, FilterKey } from "@hydra/backend-core";
import { GamePresenter } from "../presenters/GamePresenter";
import type { GameViewModel } from "../presenters/GameViewModel";

// ─── Initial data fetch ───────────────────────────────────────────────────────

export async function fetchInitialGamesAction(): Promise<{ success: boolean; error?: string; games: GameViewModel[] }> {
    const result = await getGamesPaginatedUseCase.execute({ limit: 50, offset: 0 });
    if (result.isSuccess) return { success: true, games: GamePresenter.toViewModelList(result.getValue()) };
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
): Promise<{ success: boolean; error?: string; games: GameViewModel[] }> {
    const result = await getGamesPaginatedUseCase.execute({
        offset, limit, search, sort: sortBy, sortDirection: sortDir, filter: filterBy,
    });
    if (result.isSuccess) return { success: true, games: GamePresenter.toViewModelList(result.getValue()) };
    console.error("Failed to fetch more games:", result.getError().message);
    return { success: false, error: result.getError().message, games: [] };
}