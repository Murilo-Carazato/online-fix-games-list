'use client';

import { useState, useMemo, useCallback } from 'react';
import type { EnrichedGame } from '@hydra/core-domain';
import { GameCard } from '@/components/GameCard';
import { FilterBar } from '@/components/FilterBar';
import { StatsHeader } from '@/components/StatsHeader';

export type SortKey = 'date' | 'rating' | 'popularity' | 'title' | 'playtime';
export type GroupKey = 'none' | 'wantToPlay' | 'genre';
export type FilterKey = 'all' | 'wantToPlay' | 'ignored' | 'untagged';

interface GameDashboardProps {
    initialGames: EnrichedGame[];
    initialWantSet: string[];
    initialIgnoredSet: string[];
}

export default function GameDashboard({ initialGames, initialWantSet, initialIgnoredSet }: GameDashboardProps) {
    // Instead of useGames fetching and managing everything, we manage optimistic local state here
    // and call Server Actions to persist.
    const [wantSet, setWantSet] = useState<Set<string>>(new Set(initialWantSet));
    const [ignSet, setIgnSet] = useState<Set<string>>(new Set(initialIgnoredSet));

    const [sortBy, setSortBy] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [filterBy, setFilterBy] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');

    const toggleWantToPlay = async (title: string) => {
        const isCurrentlyWant = wantSet.has(title);
        // Optimistic UI update
        setWantSet(prev => { const n = new Set(prev); if (isCurrentlyWant) n.delete(title); else n.add(title); return n; });
        if (!isCurrentlyWant) {
            setIgnSet(prev => { const n = new Set(prev); n.delete(title); return n; });
        }

        // Fire and forget Server Action
        const { toggleWantToPlayAction } = await import('@/actions/gameActions');
        toggleWantToPlayAction(title, isCurrentlyWant);
    };

    const toggleIgnored = async (title: string) => {
        const isCurrentlyIgn = ignSet.has(title);
        // Optimistic UI update
        setIgnSet(prev => { const n = new Set(prev); if (isCurrentlyIgn) n.delete(title); else n.add(title); return n; });
        if (!isCurrentlyIgn) {
            setWantSet(prev => { const n = new Set(prev); n.delete(title); return n; });
        }

        // Fire and forget Server Action
        const { toggleIgnoredAction } = await import('@/actions/gameActions');
        toggleIgnoredAction(title, isCurrentlyIgn);
    };

    const isWantToPlay = useCallback((title: string) => wantSet.has(title), [wantSet]);
    const isIgnored = useCallback((title: string) => ignSet.has(title), [ignSet]);

    const processed = useMemo(() => {
        let list = Array.isArray(initialGames) ? [...initialGames] : [];

        // 1. Search filter
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(g => g.title.toLowerCase().includes(q));
        }

        // 2. Category filter
        if (filterBy === 'wantToPlay') list = list.filter(g => isWantToPlay(g.title));
        else if (filterBy === 'ignored') list = list.filter(g => isIgnored(g.title));
        else if (filterBy === 'untagged') list = list.filter(g => !isWantToPlay(g.title) && !isIgnored(g.title));

        // 3. Sort
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
    }, [initialGames, search, filterBy, sortBy, sortDir, isWantToPlay, isIgnored]);

    // Data is fetched Server-Side so no local loading/error states needed

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <StatsHeader
                    total={initialGames.length}
                    wantToPlay={initialGames.filter(g => isWantToPlay(g.title)).length}
                    ignored={initialGames.filter(g => isIgnored(g.title)).length}
                />

                <FilterBar
                    sortBy={sortBy} setSortBy={setSortBy}
                    sortDir={sortDir} setSortDir={setSortDir}
                    filterBy={filterBy} setFilterBy={setFilterBy}
                    search={search} setSearch={setSearch}
                    resultCount={processed.length}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {processed.map(game => (
                        <GameCard
                            key={game.title}
                            game={game}
                            wantToPlay={isWantToPlay(game.title)}
                            ignored={isIgnored(game.title)}
                            onToggleWantToPlay={() => toggleWantToPlay(game.title)}
                            onToggleIgnored={() => toggleIgnored(game.title)}
                        />
                    ))}
                </div>

                {processed.length === 0 && (
                    <div className="text-center py-24 text-muted-foreground">
                        <p className="text-2xl">🎮</p>
                        <p className="mt-2">Nenhum jogo encontrado para os filtros selecionados.</p>
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
