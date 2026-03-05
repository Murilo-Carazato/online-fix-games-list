import { useState, useCallback, useEffect, useRef } from 'react';
import type { EnrichedGame } from '@hydra/backend-core/src/domain/entities/Game';
import { toggleWantToPlayAction, toggleIgnoredAction, fetchMoreGamesAction } from '@/actions/gameActions';
import type { SortKey, FilterKey } from '@/components/GameDashboard';

interface UseGameDashboardProps {
    initialGames: EnrichedGame[];
    initialStats: { total: number; wantToPlay: number; ignored: number };
}

export function useGameDashboard({ initialGames, initialStats }: UseGameDashboardProps) {
    const [gamesList, setGamesList] = useState<EnrichedGame[]>(initialGames);
    const [wantSet, setWantSet] = useState<Set<string>>(() => new Set(initialGames.filter(g => g.wantToPlay).map(g => g.title)));
    const [ignSet, setIgnSet] = useState<Set<string>>(() => new Set(initialGames.filter(g => g.ignored).map(g => g.title)));
    const [globalStats, setGlobalStats] = useState(initialStats);

    const [sortBy, setSortBy] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [filterBy, setFilterBy] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');

    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialGames.length >= 50);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Stable toggle callbacks — stable reference means GameCardWrapper.memo works correctly
    const toggleWantToPlay = useCallback(async (title: string, isCurrentlyWant: boolean) => {
        setWantSet(prev => { const n = new Set(prev); if (isCurrentlyWant) n.delete(title); else n.add(title); return n; });
        setGlobalStats(prev => ({ ...prev, wantToPlay: prev.wantToPlay + (isCurrentlyWant ? -1 : 1) }));
        if (!isCurrentlyWant) {
            setIgnSet(prev => { const n = new Set(prev); n.delete(title); return n; });
        }
        await toggleWantToPlayAction(title, isCurrentlyWant);
    }, []);

    const toggleIgnored = useCallback(async (title: string, isCurrentlyIgn: boolean) => {
        setIgnSet(prev => { const n = new Set(prev); if (isCurrentlyIgn) n.delete(title); else n.add(title); return n; });
        setGlobalStats(prev => ({ ...prev, ignored: prev.ignored + (isCurrentlyIgn ? -1 : 1) }));
        if (!isCurrentlyIgn) {
            setWantSet(prev => { const n = new Set(prev); n.delete(title); return n; });
        }
        await toggleIgnoredAction(title, isCurrentlyIgn);
    }, []);

    const appendMetadataSets = useCallback((games: EnrichedGame[], replace = false) => {
        setWantSet(prev => {
            const n = replace ? new Set<string>() : new Set(prev);
            games.forEach(g => { if (g.wantToPlay) n.add(g.title); });
            return n;
        });
        setIgnSet(prev => {
            const n = replace ? new Set<string>() : new Set(prev);
            games.forEach(g => { if (g.ignored) n.add(g.title); });
            return n;
        });
    }, []);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const res = await fetchMoreGamesAction(gamesList.length, 50, search, sortBy, sortDir, filterBy);
        if (res.success && res.games) {
            appendMetadataSets(res.games);
            setGamesList(prev => {
                const seen = new Set(prev.map(g => g.title));
                return [...prev, ...res.games!.filter(g => !seen.has(g.title))];
            });
            if (res.games.length < 50) setHasMore(false);
        } else {
            setHasMore(false);
        }
        setLoadingMore(false);
    }, [loadingMore, hasMore, gamesList.length, search, sortBy, sortDir, filterBy, appendMetadataSets]);

    const isFirstMount = useRef(true);

    // Re-fetch from DB whenever sort/filter/search changes (debounce handled in FilterBar)
    useEffect(() => {
        if (isFirstMount.current) { isFirstMount.current = false; return; }

        let isCurrent = true;
        setLoadingMore(true);
        setFetchError(null);
        fetchMoreGamesAction(0, 50, search, sortBy, sortDir, filterBy).then(res => {
            if (!isCurrent) return;
            if (res.success && res.games) {
                appendMetadataSets(res.games, true);
                setGamesList(res.games);
                setHasMore(res.games.length >= 50);
            } else {
                setGamesList([]);
                setHasMore(false);
                setFetchError(res.error || 'Erro ao carregar os dados.');
            }
            setLoadingMore(false);
        }).catch(() => {
            if (!isCurrent) return;
            setGamesList([]);
            setHasMore(false);
            setFetchError('Erro de conexão com o servidor.');
            setLoadingMore(false);
        });

        return () => { isCurrent = false; };
    }, [search, sortBy, sortDir, filterBy, appendMetadataSets]);

    return {
        gamesList,
        globalStats,
        sortBy, setSortBy,
        sortDir, setSortDir,
        filterBy, setFilterBy,
        search, setSearch,
        loadingMore,
        hasMore,
        fetchError, setFetchError,
        wantSet,
        ignSet,
        toggleWantToPlay,
        toggleIgnored,
        loadMore
    };
}
