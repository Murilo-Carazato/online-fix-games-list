'use client';

import { useState, useMemo, useCallback } from 'react';
import type { EnrichedGame } from '@hydra/core-domain';
import { GameCard } from '@/components/GameCard';
import { FilterBar } from '@/components/FilterBar';
import { StatsHeader } from '@/components/StatsHeader';
import { motion, AnimatePresence } from 'framer-motion';

export type SortKey = 'date' | 'rating' | 'popularity' | 'title' | 'playtime';
export type GroupKey = 'none' | 'wantToPlay' | 'genre';
export type FilterKey = 'all' | 'wantToPlay' | 'ignored' | 'untagged';

interface GameDashboardProps {
    initialGames: EnrichedGame[];
    initialWantSet: string[];
    initialIgnoredSet: string[];
}

export default function GameDashboard({ initialGames, initialWantSet, initialIgnoredSet }: GameDashboardProps) {
    const [gamesList, setGamesList] = useState<EnrichedGame[]>(initialGames);
    const [wantSet, setWantSet] = useState<Set<string>>(new Set(initialWantSet));
    const [ignSet, setIgnSet] = useState<Set<string>>(new Set(initialIgnoredSet));

    const [sortBy, setSortBy] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [filterBy, setFilterBy] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');

    // Pagination state
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialGames.length >= 50);

    const toggleWantToPlay = async (title: string) => {
        const isCurrentlyWant = wantSet.has(title);
        setWantSet(prev => { const n = new Set(prev); if (isCurrentlyWant) n.delete(title); else n.add(title); return n; });
        if (!isCurrentlyWant) {
            setIgnSet(prev => { const n = new Set(prev); n.delete(title); return n; });
        }
        const { toggleWantToPlayAction } = await import('@/actions/gameActions');
        toggleWantToPlayAction(title, isCurrentlyWant);
    };

    const toggleIgnored = async (title: string) => {
        const isCurrentlyIgn = ignSet.has(title);
        setIgnSet(prev => { const n = new Set(prev); if (isCurrentlyIgn) n.delete(title); else n.add(title); return n; });
        if (!isCurrentlyIgn) {
            setWantSet(prev => { const n = new Set(prev); n.delete(title); return n; });
        }
        const { toggleIgnoredAction } = await import('@/actions/gameActions');
        toggleIgnoredAction(title, isCurrentlyIgn);
    };

    const loadMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const { fetchMoreGamesAction } = await import('@/actions/gameActions');
        const res = await fetchMoreGamesAction(gamesList.length, 50);

        if (res.success && res.games) {
            setGamesList(prev => [...prev, ...res.games!]);
            if (res.games.length < 50) setHasMore(false);
        } else {
            setHasMore(false);
        }
        setLoadingMore(false);
    };

    const isWantToPlay = useCallback((title: string) => wantSet.has(title), [wantSet]);
    const isIgnored = useCallback((title: string) => ignSet.has(title), [ignSet]);

    const processed = useMemo(() => {
        let list = [...gamesList];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(g => g.title.toLowerCase().includes(q));
        }

        if (filterBy === 'wantToPlay') list = list.filter(g => isWantToPlay(g.title));
        else if (filterBy === 'ignored') list = list.filter(g => isIgnored(g.title));
        else if (filterBy === 'untagged') list = list.filter(g => !isWantToPlay(g.title) && !isIgnored(g.title));

        list.sort((a, b) => {
            let val = 0;
            switch (sortBy) {
                case 'date': val = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime(); break;
                case 'rating': val = (a.totalRating ?? 0) - (b.totalRating ?? 0); break;
                case 'popularity': val = (a.added ?? 0) - (b.added ?? 0); break;
                case 'playtime': val = (a.playtime ?? 0) - (b.playtime ?? 0); break;
                case 'title': val = a.title.localeCompare(b.title); break;
            }
            return sortDir === 'desc' ? -val : val;
        });

        return list;
    }, [gamesList, search, filterBy, sortBy, sortDir, isWantToPlay, isIgnored]);

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <StatsHeader
                    total={gamesList.length}
                    wantToPlay={gamesList.filter(g => isWantToPlay(g.title)).length}
                    ignored={gamesList.filter(g => isIgnored(g.title)).length}
                />

                <FilterBar
                    sortBy={sortBy} setSortBy={setSortBy}
                    sortDir={sortDir} setSortDir={setSortDir}
                    filterBy={filterBy} setFilterBy={setFilterBy}
                    search={search} setSearch={setSearch}
                    resultCount={processed.length}
                />

                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {processed.map(game => (
                            <motion.div
                                key={game.title}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <GameCard
                                    game={game}
                                    wantToPlay={isWantToPlay(game.title)}
                                    ignored={isIgnored(game.title)}
                                    onToggleWantToPlay={() => toggleWantToPlay(game.title)}
                                    onToggleIgnored={() => toggleIgnored(game.title)}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {processed.length === 0 && (
                    <div className="text-center py-24 text-muted-foreground">
                        <p className="text-2xl">🎮</p>
                        <p className="mt-2">Nenhum jogo encontrado para os filtros selecionados.</p>
                    </div>
                )}

                {hasMore && (
                    <div className="mt-10 flex justify-center">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition disabled:opacity-50"
                        >
                            {loadingMore ? 'Carregando...' : 'Carregar mais jogos'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function LoadingScreen() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Carregando jogos...</p>
            </div>
        </div>
    );
}

function ErrorScreen({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center space-y-2">
                <p className="text-2xl">⚠️</p>
                <p className="text-foreground font-semibold">Erro ao carregar jogos</p>
                <p className="text-muted-foreground text-sm">{message}</p>
            </div>
        </div>
    );
}
