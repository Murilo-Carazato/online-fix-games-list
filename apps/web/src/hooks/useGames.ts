'use client';

import { useState, useCallback, useEffect } from 'react';
import type { EnrichedGame } from '@hydra/core-domain';

// In-memory preferences — will be replaced by Supabase in Phase 4
// Persists to localStorage for now (DRY: single source of truth)
const WANT_KEY = 'hydra_wantToPlay';
const IGN_KEY = 'hydra_ignored';

const getSet = (key: string): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(localStorage.getItem(key) ?? '[]')); }
    catch { return new Set(); }
};

const saveSet = (key: string, set: Set<string>) => {
    localStorage.setItem(key, JSON.stringify([...set]));
};

export function useGames() {
    const [games, setGames] = useState<EnrichedGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wantSet, setWantSet] = useState<Set<string>>(new Set());
    const [ignSet, setIgnSet] = useState<Set<string>>(new Set());

    // Load games from the hydra JSON endpoint on first render
    useEffect(() => {
        setWantSet(getSet(WANT_KEY));
        setIgnSet(getSet(IGN_KEY));

        fetch('https://hydralinks.pages.dev/sources/onlinefix.json')
            .then(r => r.json())
            .then((data: { name: string; downloads: EnrichedGame[] }) => {
                // API returns { name: "onlinefix", downloads: [...] }
                setGames(data.downloads ?? []);
                setLoading(false);
            })
            .catch(e => { setError(e.message); setLoading(false); });
    }, []);

    const toggleWantToPlay = useCallback((title: string) => {
        setWantSet(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title); else next.add(title);
            // Remove from ignored if adding to want-to-play
            setIgnSet(ig => { const n = new Set(ig); n.delete(title); saveSet(IGN_KEY, n); return n; });
            saveSet(WANT_KEY, next);
            return next;
        });
    }, []);

    const toggleIgnored = useCallback((title: string) => {
        setIgnSet(prev => {
            const next = new Set(prev);
            if (next.has(title)) next.delete(title); else next.add(title);
            // Remove from want-to-play if ignoring
            setWantSet(wt => { const n = new Set(wt); n.delete(title); saveSet(WANT_KEY, n); return n; });
            saveSet(IGN_KEY, next);
            return next;
        });
    }, []);

    const isWantToPlay = useCallback((title: string) => wantSet.has(title), [wantSet]);
    const isIgnored = useCallback((title: string) => ignSet.has(title), [ignSet]);

    return { games, loading, error, toggleWantToPlay, toggleIgnored, isWantToPlay, isIgnored };
}
