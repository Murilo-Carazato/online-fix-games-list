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
        search: filters.search,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
        filterBy: filters.filterBy
    });

    const preferences = useGamePreferences({
        wantToPlay: initialStats.wantToPlay,
        ignored: initialStats.ignored
    });

    const globalStats = {
        total: initialStats.total,
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
