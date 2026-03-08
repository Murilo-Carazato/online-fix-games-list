'use client';

import { useState, useEffect } from 'react';
import type { AdvancedFilters, FilterOptions } from '@hydra/backend-core';
import { fetchFilterOptionsAction } from '@/actions/gameActions';
import { m, AnimatePresence } from 'framer-motion';

interface AdvancedFiltersDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilters: AdvancedFilters;
    onApply: (filters: AdvancedFilters) => void;
}

export function AdvancedFiltersDrawer({ isOpen, onClose, initialFilters, onApply }: AdvancedFiltersDrawerProps) {
    const [options, setOptions] = useState<FilterOptions | null>(null);
    const [loading, setLoading] = useState(false);

    // Draft filters state
    const [draft, setDraft] = useState<AdvancedFilters>(initialFilters);

    useEffect(() => {
        setDraft(initialFilters);
    }, [initialFilters, isOpen]);

    useEffect(() => {
        if (!isOpen || options || loading) return;
        setLoading(true);
        fetchFilterOptionsAction().then(res => {
            if (res.success && res.options) setOptions(res.options);
            setLoading(false);
        });
    }, [isOpen, options, loading]);

    const handleApply = () => {
        onApply(draft);
        onClose();
    };

    const handleClear = () => {
        setDraft({});
    };

    const toggleArrayItem = (key: keyof AdvancedFilters, value: string) => {
        const currentParams = (draft[key] as string[]) || [];
        if (currentParams.includes(value)) {
            setDraft({ ...draft, [key]: currentParams.filter(v => v !== value) });
        } else {
            setDraft({ ...draft, [key]: [...currentParams, value] });
        }
    };

    const setNumber = (key: keyof AdvancedFilters, val: string) => {
        const num = val ? parseFloat(val) : undefined;
        setDraft({ ...draft, [key]: num });
    };

    const CheckboxList = ({ title, items, filterKey }: { title: string, items: string[], filterKey: keyof AdvancedFilters }) => {
        const selected = (draft[filterKey] as string[]) || [];
        return (
            <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2">{title}</h3>
                <div className="max-h-40 overflow-y-auto pr-2 gap-2 flex flex-col custom-scrollbar">
                    {items.map(item => (
                        <label key={item} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/10 p-1 rounded">
                            <input
                                type="checkbox"
                                checked={selected.includes(item)}
                                onChange={() => toggleArrayItem(filterKey, item)}
                                className="rounded border-border text-primary focus:ring-primary/50"
                            />
                            {item}
                        </label>
                    ))}
                </div>
            </div>
        );
    };

    const RangeInput = ({ title, minKey, maxKey, placeholder }: { title: string, minKey: keyof AdvancedFilters, maxKey: keyof AdvancedFilters, placeholder: string }) => (
        <div className="mb-6">
            <h3 className="text-sm font-semibold mb-2">{title}</h3>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    placeholder="Min"
                    value={draft[minKey] as number || ''}
                    onChange={e => setNumber(minKey, e.target.value)}
                    className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-muted-foreground">-</span>
                <input
                    type="number"
                    placeholder="Max"
                    value={draft[maxKey] as number || ''}
                    onChange={e => setNumber(maxKey, e.target.value)}
                    className="w-full bg-secondary border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-xs text-muted-foreground">{placeholder}</span>
            </div>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <m.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-card border-l border-border z-50 shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h2 className="text-lg font-bold">Advanced Filters</h2>
                            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <RangeInput title="File Size" minKey="fileSizeMin" maxKey="fileSizeMax" placeholder="GB" />
                            <RangeInput title="Score Rating" minKey="ratingMin" maxKey="ratingMax" placeholder="0-100" />
                            <RangeInput title="Popularity (Added By)" minKey="addedByMin" maxKey="addedByMax" placeholder="users" />

                            <div className="mb-6 space-y-3">
                                <h3 className="text-sm font-semibold mb-2">Media & Content</h3>
                                <label className="flex items-center gap-2 text-sm cursor-pointer border border-border p-2 rounded-lg hover:bg-accent/10 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={!!draft.hasAlanzoka}
                                        onChange={e => setDraft({ ...draft, hasAlanzoka: e.target.checked ? true : undefined })}
                                        className="rounded border-border text-primary focus:ring-primary/50"
                                    />
                                    Has Alanzoka Video
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer border border-border p-2 rounded-lg hover:bg-accent/10 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={!!draft.hasMedia}
                                        onChange={e => setDraft({ ...draft, hasMedia: e.target.checked ? true : undefined })}
                                        className="rounded border-border text-primary focus:ring-primary/50"
                                    />
                                    Has Media (Trailer/Screenshots)
                                </label>
                            </div>

                            {loading && (
                                <div className="py-8 text-center text-muted-foreground animate-pulse">
                                    Loading options...
                                </div>
                            )}

                            {!loading && options && (
                                <>
                                    <CheckboxList title="Genres" items={options.genres} filterKey="genres" />
                                    <CheckboxList title="Themes" items={options.themes} filterKey="themes" />
                                    <CheckboxList title="Game Modes" items={options.gameModes} filterKey="gameModes" />
                                    <CheckboxList title="Stores" items={options.stores} filterKey="stores" />
                                    <CheckboxList title="Languages" items={options.languages} filterKey="languages" />
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t border-border bg-secondary/30 flex gap-3">
                            <button
                                onClick={handleClear}
                                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
                            >
                                Clear All
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold shadow-md"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </m.div>
                </>
            )}
        </AnimatePresence>
    );
}
