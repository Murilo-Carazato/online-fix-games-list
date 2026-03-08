import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameViewModel } from '@/presenters/GameViewModel';
import { fetchMoreGamesAction } from '@/actions/gameActions';
import type { SortKey, SortDirection, AdvancedFilters } from '@/types/game.types';

const PAGE_SIZE = 50;

export interface UseGamePaginationProps {
    initialGames: GameViewModel[];
    search: string;
    sortBy: SortKey;
    sortDir: SortDirection;
    advancedFilters: AdvancedFilters;
}

// Manages the paginated game list.
// Re-fetches from offset=0 whenever search/sort/filter changes.
// Appends more results when loadMore() is called (infinite scroll).
export function useGamePagination({ initialGames, search, sortBy, sortDir, advancedFilters }: UseGamePaginationProps) {
    const [gamesList, setGamesList] = useState<GameViewModel[]>(initialGames);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialGames.length >= PAGE_SIZE);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const filtersJson = JSON.stringify(advancedFilters);

    // Appends the next page of results to the existing list.
    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);

        const res = await fetchMoreGamesAction(gamesList.length, PAGE_SIZE, search, sortBy, sortDir, filtersJson);
        if (res.success && res.games) {
            setGamesList(prev => {
                const seen = new Set(prev.map(g => g.title));
                return [...prev, ...res.games!.filter(g => !seen.has(g.title))];
            });
            if (res.games.length < PAGE_SIZE) setHasMore(false);
        } else {
            setHasMore(false);
        }

        setLoadingMore(false);
    }, [loadingMore, hasMore, gamesList.length, search, sortBy, sortDir, filtersJson]);

    const isFirstMount = useRef(true);

    // Re-fetches from scratch whenever any filter/sort/search value changes.
    // Skips on the initial mount to avoid a duplicate fetch (SSR already provides data).
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        let isCurrent = true;

        console.log("==> refetch triggered! filtersJson:", filtersJson);

        const refetch = async () => {
            setLoadingMore(true);
            setFetchError(null);

            try {
                const res = await fetchMoreGamesAction(0, PAGE_SIZE, search, sortBy, sortDir, filtersJson);
                if (!isCurrent) return;

                if (res.success && res.games) {
                    setGamesList(res.games);
                    setHasMore(res.games.length >= PAGE_SIZE);
                } else {
                    setGamesList([]);
                    setHasMore(false);
                    setFetchError(res.error ?? 'Erro ao carregar os dados.');
                }
            } catch {
                if (!isCurrent) return;
                setGamesList([]);
                setHasMore(false);
                setFetchError('Erro de conexão com o servidor.');
            } finally {
                if (isCurrent) setLoadingMore(false);
            }
        };

        refetch();

        return () => { isCurrent = false; };
    }, [search, sortBy, sortDir, filtersJson]);

    return {
        gamesList,
        loadingMore,
        hasMore,
        fetchError,
        setFetchError,
        loadMore,
    };
}
