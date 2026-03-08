'use client';

import { memo } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import type { GameViewModel } from '@/presenters/GameViewModel';
import type { GameStats } from '@/types/game.types';
import { GameCard } from '@/components/GameCard';
import { FilterBar } from '@/components/FilterBar';
import { StatsHeader } from '@/components/StatsHeader';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useGameDashboard } from '@/hooks/useGameDashboard';
import { AdvancedFiltersDrawer } from '@/components/AdvancedFiltersDrawer';
import { useState } from 'react';

// ── GameCardWrapper ──────────────────────────────────────────────────────────
// Memoized wrapper — closes over stable toggle callbacks and resolves
// wantToPlay/ignored state from the parent Sets.
// Prevents inline arrow functions in .map() from defeating React.memo.

interface GameCardWrapperProps {
    game: GameViewModel;
    wantToPlay: boolean;
    ignored: boolean;
    onToggleWantToPlay: (title: string) => void;
    onToggleIgnored: (title: string) => void;
}

const GameCardWrapper = memo(function GameCardWrapper({
    game, wantToPlay, ignored, onToggleWantToPlay, onToggleIgnored,
}: GameCardWrapperProps) {
    return (
        <m.div
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
                onToggleWantToPlay={() => onToggleWantToPlay(game.title)}
                onToggleIgnored={() => onToggleIgnored(game.title)}
            />
        </m.div>
    );
});

// ── GameDashboard ────────────────────────────────────────────────────────────

interface GameDashboardProps {
    initialGames: GameViewModel[];
    initialStats: GameStats;
}

export default function GameDashboard({ initialGames, initialStats }: GameDashboardProps) {
    const {
        gamesList, globalStats,
        sortBy, setSortBy, sortDir, setSortDir,
        advancedFilters, setAdvancedFilters, search, setSearch,
        loadingMore, hasMore, fetchError, setFetchError,
        wantSet, ignSet, toggleWantToPlay, toggleIgnored, loadMore
    } = useGameDashboard({ initialGames, initialStats });

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Sentinel-based infinite scroll — fires loadMore when end of list is visible
    const sentinelRef = useIntersectionObserver(loadMore, { threshold: 0.1 });

    return (
        // LazyMotion + domAnimation loads the smallest framer-motion bundle
        // and avoids importing the full motion registry on the server side.
        <LazyMotion features={domAnimation} strict>
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
                        search={search} setSearch={setSearch}
                        resultCount={Object.keys(advancedFilters).length === 0 && !search ? globalStats.total : gamesList.length}
                        hasMore={Object.keys(advancedFilters).length > 0 || !!search ? hasMore : false}
                        activeFiltersCount={Object.keys(advancedFilters).length}
                        onOpenFilter={() => setIsDrawerOpen(true)}
                    />

                    <m.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    </m.div>

                    {fetchError && !loadingMore && (
                        <div className="mt-12 text-center text-red-400">
                            <p className="text-xl font-bold mb-4">{fetchError}</p>
                            <button
                                onClick={() => {
                                    setFetchError(null);
                                    window.location.reload();
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

                <AdvancedFiltersDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    initialFilters={advancedFilters}
                    onApply={setAdvancedFilters}
                />
            </div>
        </LazyMotion>
    );
}
