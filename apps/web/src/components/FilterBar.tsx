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
    activeFiltersCount: number;
    onOpenFilter: () => void;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'date', label: '📅 Date' },
    { value: 'rating', label: '⭐ Rating' },
    { value: 'popularity', label: '👥 Popularity' },
    { value: 'playtime', label: '⏱ Playtime' },
    { value: 'fileSize', label: '💾 File Size' },
    { value: 'title', label: '🔤 Title' },
];

export function FilterBar({
    sortBy, setSortBy, sortDir, setSortDir,
    search, setSearch, resultCount, hasMore,
    activeFiltersCount, onOpenFilter
}: FilterBarProps) {
    const [localSearch, setLocalSearch] = useDebouncedInput(search, setSearch, 300);
    return (
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border mb-6 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Search */}
                <input
                    id="search-games"
                    type="search"
                    placeholder="Search game..."
                    value={localSearch}
                    onChange={e => setLocalSearch(e.target.value)}
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-full sm:w-auto"
                />

                <div className="flex gap-2 flex-wrap items-center">
                    {/* Filter Drawer Toggle — primary action, comes first */}
                    <button
                        onClick={onOpenFilter}
                        className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent/20 hover:border-primary/50 transition-all flex items-center gap-2"
                    >
                        ⚙ Filters
                        {activeFiltersCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>

                    {/* Sort group — dropdown and ASC/DESC arrow always together */}
                    <div className="flex gap-0 rounded-lg overflow-hidden border border-border">
                        <select
                            id="sort-by"
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as SortKey)}
                            className="bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer border-r border-border"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button
                            id="sort-dir"
                            onClick={() => setSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
                            title={sortDir === 'desc' ? 'Descending' : 'Ascending'}
                            className="bg-secondary px-3 py-2 text-sm hover:bg-accent/20 transition-all font-bold text-primary"
                        >
                            {sortDir === 'desc' ? '↓' : '↑'}
                        </button>
                    </div>
                </div>

                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {resultCount}{hasMore ? '+' : ''} game{resultCount !== 1 ? 's' : ''}
                </span>
            </div>
        </div >
    );
}
