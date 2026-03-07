'use client';

import type { SortKey } from '@/types/game.types';
import { useDebouncedInput } from '@/hooks/useDebouncedInput';

interface FilterBarProps {
    sortBy: SortKey;
    setSortBy: (v: SortKey) => void;
    sortDir: 'asc' | 'desc';
    setSortDir: (v: 'asc' | 'desc') => void;
    search: string;
    setSearch: (v: string) => void;
    resultCount: number;
    hasMore?: boolean;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'date', label: '📅 Data' },
    { value: 'rating', label: '⭐ Rating' },
    { value: 'popularity', label: '👥 Popularidade' },
    { value: 'playtime', label: '⏱ Horas' },
    { value: 'title', label: '🔤 Título' },
];

// Removed FILTER_OPTIONS as preferences (wantToPlay/ignored) were deleted from schema.

export function FilterBar({ sortBy, setSortBy, sortDir, setSortDir, search, setSearch, resultCount, hasMore }: FilterBarProps) {
    const [localSearch, setLocalSearch] = useDebouncedInput(search, setSearch, 300);
    return (
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border mb-6 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Search */}
                <input
                    id="search-games"
                    type="search"
                    placeholder="Buscar jogo..."
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-full sm:w-auto"
                />

                <div className="flex gap-2 flex-wrap">
                    {/* Sort by */}
                    <select
                        id="sort-by"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as SortKey)}
                        className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                    >
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>

                    {/* Sort direction */}
                    <button
                        id="sort-dir"
                        onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
                        title={sortDir === 'desc' ? 'Decrescente' : 'Crescente'}
                        className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm hover:bg-accent/20 hover:border-primary/50 transition-all"
                    >
                        {sortDir === 'desc' ? '↓' : '↑'}
                    </button>

                    {/* Filter tabs removed */}
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {resultCount}{hasMore ? '+' : ''} jogo{resultCount !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
}
