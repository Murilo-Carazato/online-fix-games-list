import { useState, useCallback, useEffect, useRef } from 'react';
import type { EnrichedGameEntity } from '@hydra/backend-core/src/domain/entities/EnrichedGameEntity';
import { fetchMoreGamesAction } from '@/actions/gameActions';
import type { SortKey, FilterKey } from '@/components/GameDashboard';

interface UseGameDashboardProps {
    initialGames: EnrichedGameEntity[];
    initialStats: { total: number; wantToPlay: number; ignored: number };
}

export function useGameDashboard({ initialGames, initialStats }: UseGameDashboardProps) {
    const [gamesList, setGamesList] = useState<EnrichedGameEntity[]>(initialGames);
    const [wantSet, setWantSet] = useState<Set<string>>(() => new Set<string>());
    const [ignSet, setIgnSet] = useState<Set<string>>(() => new Set<string>());
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
    }, []);

    const toggleIgnored = useCallback(async (title: string, isCurrentlyIgn: boolean) => {
        setIgnSet(prev => { const n = new Set(prev); if (isCurrentlyIgn) n.delete(title); else n.add(title); return n; });
        setGlobalStats(prev => ({ ...prev, ignored: prev.ignored + (isCurrentlyIgn ? -1 : 1) }));
        if (!isCurrentlyIgn) {
            setWantSet(prev => { const n = new Set(prev); n.delete(title); return n; });
        }
    }, []);

    // appendMetadataSets kept for future preference feature extension — currently a no-op
    // since wantToPlay/ignored were removed from domain entity and schema.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const appendMetadataSets = useCallback((_games: EnrichedGameEntity[]) => {
        // No-op: preference sets always empty while feature is absent from schema
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
                appendMetadataSets(res.games);
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
