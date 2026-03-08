import { useState } from 'react';
import type { SortKey, AdvancedFilters } from '@/types/game.types';

export function useGameFilters() {
    const [sortBy, setSortBy] = useState<SortKey>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
    const [search, setSearch] = useState('');

    return {
        sortBy, setSortBy,
        sortDir, setSortDir,
        advancedFilters, setAdvancedFilters,
        search, setSearch
    };
}
