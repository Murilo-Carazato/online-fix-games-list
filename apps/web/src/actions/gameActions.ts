"use server";

import { getGamesPaginatedUseCase } from "@/di/container";
import type { SortKey, AdvancedFilters } from "@hydra/backend-core";
import { GamePresenter } from "../presenters/GamePresenter";
import type { GameViewModel } from "../presenters/GameViewModel";
import { GameDetailsPresenter } from "../presenters/GameDetailsPresenter";
import type { GameDetailsViewModel } from "../presenters/GameDetailsViewModel";
import { getGameByIdUseCase, getFilterOptionsUseCase } from "@/di/container";
import type { FilterOptions } from "@hydra/backend-core";

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
    filtersJson?: string,
): Promise<{ success: boolean; error?: string; games: GameViewModel[] }> {
    console.log("==> fetchMoreGamesAction args:", { offset, limit, search, sortBy, sortDir, filtersJson });
    const filters: AdvancedFilters | undefined = filtersJson ? JSON.parse(filtersJson) : undefined;
    const result = await getGamesPaginatedUseCase.execute({
        offset, limit, search, sort: sortBy, sortDirection: sortDir, filters,
    });
    if (result.isSuccess) return { success: true, games: GamePresenter.toViewModelList(result.getValue()) };
    console.error("Failed to fetch more games:", result.getError().message);
    return { success: false, error: result.getError().message, games: [] };
}

// ─── Single Game Fetch (Game Details Page) ───────────────────────────────────

export async function fetchGameDetailsAction(id: number): Promise<{ success: boolean; error?: string; game?: GameDetailsViewModel }> {
    const result = await getGameByIdUseCase.execute(id);
    if (result.isSuccess) {
        return { success: true, game: GameDetailsPresenter.toViewModel(result.getValue(), id) };
    }

    console.error(`Failed to fetch game details for ID ${id}:`, result.getError().message);
    return { success: false, error: result.getError().message };
}

// ─── Filter Options Fetch ────────────────────────────────────────────────────

export async function fetchFilterOptionsAction(): Promise<{ success: boolean; error?: string; options?: FilterOptions }> {
    const result = await getFilterOptionsUseCase.execute();
    if (result.isSuccess) {
        return { success: true, options: result.getValue() };
    }
    console.error("Failed to fetch filter options:", result.getError().message);
    return { success: false, error: result.getError().message };
}