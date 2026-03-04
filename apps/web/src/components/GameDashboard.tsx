'use client';

import { useState, useCallback, useEffect, useRef, memo } from 'react';
import type { EnrichedGame } from '@hydra/core-domain';
import { GameCard } from '@/components/GameCard';
import { FilterBar } from '@/components/FilterBar';
import { StatsHeader } from '@/components/StatsHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleWantToPlayAction, toggleIgnoredAction, fetchMoreGamesAction } from '@/actions/gameActions';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export type SortKey = 'date' | 'rating' | 'popularity' | 'title' | 'playtime';
export type FilterKey = 'all' | 'wantToPlay' | 'ignored' | 'untagged';

// ── GameCardWrapper ──────────────────────────────────────────────────────────
// A memoized wrapper that closes over stable toggle callbacks and resolves
// the current wantToPlay/ignored state from the parent Sets.
// This prevents inline arrow functions in .map() from defeating React.memo.
interface GameCardWrapperProps {
    game: EnrichedGame;
    wantToPlay: boolean;
    ignored: boolean;
    onToggleWantToPlay: (title: string, current: boolean) => void;
    onToggleIgnored: (title: string, current: boolean) => void;
}

const GameCardWrapper = memo(function GameCardWrapper({
    game, wantToPlay, ignored, onToggleWantToPlay, onToggleIgnored,
}: GameCardWrapperProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
        >
            <GameCard
                game={game}
                wantToPlay={wantToPlay}
                ignored={ignored}
                onToggleWantToPlay={() => onToggleWantToPlay(game.title, wantToPlay)}
                onToggleIgnored={() => onToggleIgnored(game.title, ignored)}
            />
        </motion.div>
    );
});

// ── GameDashboard ────────────────────────────────────────────────────────────

interface GameDashboardProps {
    initialGames: EnrichedGame[];
    initialStats: { total: number; wantToPlay: number; ignored: number };
}

export default function GameDashboard({ initialGames, initialStats }: GameDashboardProps) {
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

    // Sentinel-based infinite scroll — fires loadMore when the bottom of the list is visible
    const sentinelRef = useIntersectionObserver(loadMore, { threshold: 0.1 });

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

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <StatsHeader
                    total={globalStats.total}
                    wantToPlay={globalStats.wantToPlay}
                    ignored={globalStats.ignored}
                />

                <FilterBar
                    sortBy={sortBy} setSortBy={setSortBy}
                    sortDir={sortDir} setSortDir={setSortDir}
                    filterBy={filterBy} setFilterBy={setFilterBy}
                    search={search} setSearch={setSearch}
                    resultCount={filterBy === 'all' && !search ? globalStats.total : gamesList.length}
                    hasMore={filterBy !== 'all' || !!search ? hasMore : false}
                />

                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {gamesList.map(game => (
                            <GameCardWrapper
                                key={game.title}
                                game={game}
                                wantToPlay={wantSet.has(game.title)}
                                ignored={ignSet.has(game.title)}
                                onToggleWantToPlay={toggleWantToPlay}
                                onToggleIgnored={toggleIgnored}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>

                {fetchError && !loadingMore && (
                    <div className="mt-12 text-center text-red-400">
                        <p className="text-xl font-bold mb-4">{fetchError}</p>
                        <button
                            onClick={() => {
                                setFetchError(null);
                                // setLocalSearch(search); // trigger re-fetch indirectly or let user toggle filter
                                window.location.reload(); // simple fallback for critical error recovery
                            }}
                            className="px-4 py-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition"
                        >
                            Tentar recarregar a página
                        </button>
                    </div>
                )}

                {gamesList.length === 0 && !loadingMore && !fetchError && (
                    <div className="mt-12 text-center text-muted-foreground">
                        <p className="text-xl">Nenhum jogo encontrado com os filtros atuais.</p>
                    </div>
                )}

                {/* Invisible sentinel — IntersectionObserver triggers loadMore automatically */}
                {hasMore && <div ref={sentinelRef} className="h-12" aria-hidden />}

                {loadingMore && (
                    <div className="mt-6 flex justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}
