import { useState } from 'react';
import type { SortKey, FilterKey } from '@/types/game.types';

export function useGameFilters() {
    const [sortBy, setSortBy] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [filterBy, setFilterBy] = useState<FilterKey>('all');
    const [search, setSearch] = useState('');

    return {
        sortBy, setSortBy,
        sortDir, setSortDir,
        filterBy, setFilterBy,
        search, setSearch
    };
}
