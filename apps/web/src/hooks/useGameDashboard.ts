import type { GameViewModel } from '@/presenters/GameViewModel';
import type { GameStats } from '@/types/game.types';
import { useGameFilters } from '@/hooks/useGameFilters';
import { useGamePreferences } from '@/hooks/useGamePreferences';
import { useGamePagination } from '@/hooks/useGamePagination';

interface UseGameDashboardProps {
    initialGames: GameViewModel[];
    initialStats: GameStats;
}

export function useGameDashboard({ initialGames, initialStats }: UseGameDashboardProps) {
    const filters = useGameFilters();

    const pagination = useGamePagination({
        initialGames,
        initialTotalCount: initialStats.total,
        search: filters.search,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
        advancedFilters: filters.advancedFilters
    });

    const preferences = useGamePreferences({
        wantToPlay: initialStats.wantToPlay,
        ignored: initialStats.ignored
    });

    const globalStats = {
        total: pagination.totalCount,
        wantToPlay: preferences.prefStats.wantToPlay,
        ignored: preferences.prefStats.ignored
    };

    return {
        ...filters,
        ...pagination,
        ...preferences,
        globalStats
    };
}
