"use server";

import type { SortKey, AdvancedFilters } from "@hydra/backend-core";
import { GamePresenter } from "../presenters/GamePresenter";
import type { GameViewModel } from "../presenters/GameViewModel";
import { GameDetailsPresenter } from "../presenters/GameDetailsPresenter";
import type { GameDetailsViewModel } from "../presenters/GameDetailsViewModel";
import type { FilterOptions } from "@hydra/backend-core";
import { apiClient } from "../lib/apiClient";

// ─── Initial data fetch ───────────────────────────────────────────────────────

export async function fetchInitialGamesAction(): Promise<{ success: boolean; error?: string; games: GameViewModel[]; totalCount: number }> {
    const res = await apiClient.api.games.paginated.$post({
        json: { limit: 50, offset: 0 }
    });
    
    if (res.ok) {
        const body = await res.json();
        if (body.success) {
            const { data, totalCount } = body.data;
            return { success: true, games: GamePresenter.toViewModelList(data), totalCount };
        }
    }
    
    console.error("Failed to fetch initial games");
    return { success: false, error: "Failed to fetch games", games: [], totalCount: 0 };
}

// ─── Paginated fetch (client — Load More / filter changes) ───────────────────

export async function fetchMoreGamesAction(
    offset: number,
    limit: number = 50,
    search: string = '',
    sortBy: SortKey = 'date',
    sortDir: 'asc' | 'desc' = 'desc',
    filtersJson?: string,
): Promise<{ success: boolean; error?: string; games: GameViewModel[]; totalCount: number }> {
    const filters: AdvancedFilters | undefined = filtersJson ? JSON.parse(filtersJson) : undefined;
    
    const res = await apiClient.api.games.paginated.$post({
        json: { offset, limit, search, sort: sortBy, sortDirection: sortDir, filters }
    });
    
    if (res.ok) {
        const body = await res.json();
        if (body.success) {
            const { data, totalCount } = body.data;
            return { success: true, games: GamePresenter.toViewModelList(data), totalCount };
        }
    }
    
    console.error("Failed to fetch more games");
    return { success: false, error: "Failed to fetch more games", games: [], totalCount: 0 };
}

// ─── Single Game Fetch (Game Details Page) ───────────────────────────────────

export async function fetchGameDetailsAction(id: number): Promise<{ success: boolean; error?: string; game?: GameDetailsViewModel }> {
    const res = await apiClient.api.games[":id"].$get({
        param: { id: id.toString() }
    });
    
    if (res.ok) {
        const body = await res.json();
        if (body.success) {
            return { success: true, game: GameDetailsPresenter.toViewModel(body.data, id) };
        }
    }

    console.error(`Failed to fetch game details for ID ${id}`);
    return { success: false, error: "Failed to fetch game" };
}

// ─── Filter Options Fetch ────────────────────────────────────────────────────

export async function fetchFilterOptionsAction(): Promise<{ success: boolean; error?: string; options?: FilterOptions }> {
    const res = await apiClient.api.filters.$get();
    
    if (res.ok) {
        const body = await res.json();
        if (body.success) {
            return { success: true, options: body.data };
        }
    }
    
    console.error("Failed to fetch filter options");
    return { success: false, error: "Failed to fetch filter options" };
}