'use client';

import { useState, useEffect, useRef } from 'react';
import type { AdvancedFilters, FilterOptions } from '@hydra/backend-core';
import { fetchFilterOptionsAction } from '@/actions/gameActions';
import { m, AnimatePresence } from 'framer-motion';

interface AdvancedFiltersDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilters: AdvancedFilters;
    onApply: (filters: AdvancedFilters) => void;
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-2 border-b border-border/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-3 text-left hover:bg-accent/5 px-2 rounded-t"
            >
                <h3 className="text-sm font-semibold">{title}</h3>
                <span className={`transform transition-transform text-xs text-muted-foreground ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-2 pb-4">
                            {children}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CheckboxList({ title, items, selected, filterKey, onToggle }: { title: string, items: string[], selected: string[], filterKey: keyof AdvancedFilters, onToggle: (key: keyof AdvancedFilters, value: string) => void }) {
    const [searchQuery, setSearchQuery] = useState("");
    const filteredItems = items.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <CollapsibleSection title={title} defaultOpen={selected.length > 0}>
            <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full mb-3 bg-secondary/50 border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div className="max-h-40 overflow-y-auto pr-2 gap-1 flex flex-col custom-scrollbar">
                {filteredItems.map(item => (
                    <label key={item} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/10 p-1.5 rounded transition-colors">
                        <input
                            type="checkbox"
                            checked={selected.includes(item)}
                            onChange={() => onToggle(filterKey, item)}
                            className="rounded border-border text-primary focus:ring-primary/50"
                        />
                        {item}
                    </label>
                ))}
                {filteredItems.length === 0 && <div className="text-xs text-muted-foreground py-2 text-center">No matches found.</div>}
            </div>
        </CollapsibleSection>
    );
}

function DualSliderInput({ title, minKey, maxKey, minLimit, maxLimit, step, labelSuffix, currentMin, currentMax, onChange }: { title: string, minKey: keyof AdvancedFilters, maxKey: keyof AdvancedFilters, minLimit: number, maxLimit: number, step: number, labelSuffix: string, currentMin: number, currentMax: number, onChange: (key: keyof AdvancedFilters, val: string) => void }) {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

    useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (e: PointerEvent) => {
            if (!sliderRef.current) return;
            const rect = sliderRef.current.getBoundingClientRect();
            // Ensure percent is exactly between 0 and 1
            const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
            let rawValue = percent * (maxLimit - minLimit) + minLimit;
            // Snap to step
            const inv = 1.0 / step;
            rawValue = Math.round(rawValue * inv) / inv;

            if (isDragging === 'min') {
                onChange(minKey, Math.min(rawValue, currentMax).toString());
            } else {
                onChange(maxKey, Math.max(rawValue, currentMin).toString());
            }
        };

        const handlePointerUp = () => setIsDragging(null);

        // Attach global listeners while dragging so the thumb doesn't drop if mouse leaves it
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [isDragging, minLimit, maxLimit, step, currentMin, currentMax, minKey, maxKey, onChange]);

    const minPercent = ((currentMin - minLimit) / (maxLimit - minLimit)) * 100;
    const maxPercent = ((currentMax - minLimit) / (maxLimit - minLimit)) * 100;

    return (
        <CollapsibleSection title={title} defaultOpen={true}>
            <div className="flex justify-between items-center mb-6 px-1">
                <span className="text-xs font-semibold text-primary">{currentMin} {labelSuffix}</span>
                <span className="text-xs font-semibold text-primary">{currentMax} {labelSuffix}</span>
            </div>

            <div
                ref={sliderRef}
                className={`relative w-full h-8 flex items-center mb-2 cursor-pointer ${isDragging ? 'cursor-grabbing' : ''}`}
                onPointerDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                    let rawValue = percent * (maxLimit - minLimit) + minLimit;
                    const inv = 1.0 / step;
                    rawValue = Math.round(rawValue * inv) / inv;

                    const distToMin = Math.abs(rawValue - currentMin);
                    const distToMax = Math.abs(rawValue - currentMax);

                    // Pick the thumb closest to the click point
                    if (distToMin <= distToMax) {
                        onChange(minKey, Math.min(rawValue, currentMax).toString());
                        setIsDragging('min');
                    } else {
                        onChange(maxKey, Math.max(rawValue, currentMin).toString());
                        setIsDragging('max');
                    }
                }}
            >
                {/* Track background */}
                <div className="absolute left-0 right-0 h-1.5 bg-secondary rounded-full pointer-events-none" />

                {/* Active highlighted track segment */}
                <div
                    className={`absolute h-1.5 bg-primary rounded-full pointer-events-none transition-all ${isDragging ? 'duration-0' : 'duration-75'}`}
                    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                />

                {/* Thumbs */}
                <div
                    onPointerDown={(e) => { e.stopPropagation(); setIsDragging('min'); }}
                    className={`absolute top-1/2 -mt-2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md transition-transform hover:scale-110 -ml-2 ${isDragging === 'min' ? 'scale-125 z-30' : 'z-10'} ${isDragging === 'max' ? 'z-0' : ''}`}
                    style={{ left: `${minPercent}%`, touchAction: 'none' }}
                />
                <div
                    onPointerDown={(e) => { e.stopPropagation(); setIsDragging('max'); }}
                    className={`absolute top-1/2 -mt-2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md transition-transform hover:scale-110 -ml-2 ${isDragging === 'max' ? 'scale-125 z-30' : 'z-10'} ${isDragging === 'min' ? 'z-0' : ''}`}
                    style={{ left: `${maxPercent}%`, touchAction: 'none' }}
                />
            </div>
        </CollapsibleSection>
    );
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
                            <DualSliderInput title="File Size" minKey="fileSizeMin" maxKey="fileSizeMax" minLimit={0} maxLimit={300} step={1} labelSuffix="GB" currentMin={(draft.fileSizeMin as number) ?? 0} currentMax={(draft.fileSizeMax as number) ?? 300} onChange={setNumber} />
                            <DualSliderInput title="Score Rating" minKey="ratingMin" maxKey="ratingMax" minLimit={1} maxLimit={5} step={0.1} labelSuffix="Stars" currentMin={(draft.ratingMin as number) ?? 1} currentMax={(draft.ratingMax as number) ?? 5} onChange={setNumber} />
                            <DualSliderInput title="Popularity (Added By)" minKey="addedByMin" maxKey="addedByMax" minLimit={0} maxLimit={20000} step={100} labelSuffix="users" currentMin={(draft.addedByMin as number) ?? 0} currentMax={(draft.addedByMax as number) ?? 20000} onChange={setNumber} />

                            <CollapsibleSection title="Media & Content" defaultOpen={!!draft.hasAlanzoka || !!draft.hasMedia}>
                                <div className="space-y-3">
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
                            </CollapsibleSection>

                            {loading && (
                                <div className="py-8 text-center text-muted-foreground animate-pulse">
                                    Loading options...
                                </div>
                            )}

                            {!loading && options && (
                                <>
                                    <CheckboxList title="Genres" items={options.genres} filterKey="genres" selected={(draft.genres as string[]) || []} onToggle={toggleArrayItem} />
                                    <CheckboxList title="Themes" items={options.themes} filterKey="themes" selected={(draft.themes as string[]) || []} onToggle={toggleArrayItem} />
                                    <CheckboxList title="Game Modes" items={options.gameModes} filterKey="gameModes" selected={(draft.gameModes as string[]) || []} onToggle={toggleArrayItem} />
                                    <CheckboxList title="Stores" items={options.stores} filterKey="stores" selected={(draft.stores as string[]) || []} onToggle={toggleArrayItem} />
                                    <CheckboxList title="Languages" items={options.languages} filterKey="languages" selected={(draft.languages as string[]) || []} onToggle={toggleArrayItem} />
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
