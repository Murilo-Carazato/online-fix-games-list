'use client';

import { memo } from 'react';
import type { EnrichedGameEntity } from '@hydra/backend-core/src/domain/entities/Game';
import { GameCard } from '@/components/GameCard';
import { FilterBar } from '@/components/FilterBar';
import { StatsHeader } from '@/components/StatsHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useGameDashboard } from '@/hooks/useGameDashboard';

export type SortKey = 'date' | 'rating' | 'popularity' | 'title' | 'playtime';
export type FilterKey = 'all' | 'wantToPlay' | 'ignored' | 'untagged';

// ── GameCardWrapper ──────────────────────────────────────────────────────────
// A memoized wrapper that closes over stable toggle callbacks and resolves
// the current wantToPlay/ignored state from the parent Sets.
// This prevents inline arrow functions in .map() from defeating React.memo.
interface GameCardWrapperProps {
    game: EnrichedGameEntity;
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
    initialGames: EnrichedGameEntity[];
    initialStats: { total: number; wantToPlay: number; ignored: number };
}

export default function GameDashboard({ initialGames, initialStats }: GameDashboardProps) {
    const {
        gamesList, globalStats,
        sortBy, setSortBy, sortDir, setSortDir,
        filterBy, setFilterBy, search, setSearch,
        loadingMore, hasMore, fetchError, setFetchError,
        wantSet, ignSet, toggleWantToPlay, toggleIgnored, loadMore
    } = useGameDashboard({ initialGames, initialStats });

    // Sentinel-based infinite scroll — fires loadMore when the bottom of the list is visible
    const sentinelRef = useIntersectionObserver(loadMore, { threshold: 0.1 });

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
