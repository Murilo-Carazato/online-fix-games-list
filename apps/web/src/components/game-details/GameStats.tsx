'use client';

import type { GameDetailsViewModel } from '@/presenters/GameDetailsViewModel';
import { EmptyState } from './EmptyState';

// ─── Rating Category Config (OCP) ────────────────────────────────────────────
const RATING_CONFIG: Record<string, { emoji: string; color: string; bar: string }> = {
    exceptional: { emoji: '🏆', color: 'text-emerald-400', bar: 'bg-emerald-500' },
    recommended: { emoji: '👍', color: 'text-blue-400', bar: 'bg-blue-500' },
    meh: { emoji: '😐', color: 'text-yellow-400', bar: 'bg-yellow-500' },
    skip: { emoji: '🚫', color: 'text-red-400', bar: 'bg-red-500' },
};
const DEFAULT_RATING = { emoji: '🎮', color: 'text-slate-400', bar: 'bg-slate-500' };

// ─── Added Stats Status Config ────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { emoji: string; color: string }> = {
    playing: { emoji: '🎮', color: 'bg-indigo-500' },
    beaten: { emoji: '✅', color: 'bg-emerald-500' },
    toplay: { emoji: '📋', color: 'bg-blue-500' },
    owned: { emoji: '📦', color: 'bg-violet-500' },
    yet: { emoji: '⏸', color: 'bg-slate-500' },
    dropped: { emoji: '🗑', color: 'bg-red-500' },
};

export default function GameStats({ game }: { game: GameDetailsViewModel }) {
    const maxAddedCount = Math.max(1, ...game.addedStats.map(s => s.count));
    const sortedRatings = [...game.ratings].sort((a, b) => b.score - a.score);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

            {/* ── Player Activity — always rendered ────────────────────────── */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-5">
                <h3 className="text-slate-200 font-bold text-xl">Player Activity</h3>
                {game.addedStats.length > 0 ? (
                    game.addedStats.map(stat => {
                        const cfg = STATUS_CONFIG[stat.status.toLowerCase()] ?? { emoji: '📊', color: 'bg-slate-500' };
                        const pct = (stat.count / maxAddedCount) * 100;
                        return (
                            <div key={stat.status} className="space-y-1">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="flex items-center gap-2 font-medium text-slate-300 capitalize">
                                        {cfg.emoji} {stat.status}
                                    </span>
                                    <span className="text-slate-400 tabular-nums">{stat.count.toLocaleString()}</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${cfg.color} transition-all duration-700`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <EmptyState message="No player activity data available for this game." />
                )}
            </div>

            {/* ── Rating Distribution — always rendered ─────────────────────── */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-5">
                <h3 className="text-slate-200 font-bold text-xl">Rating Distribution</h3>
                {sortedRatings.length > 0 ? (
                    <>
                        {/* Stacked colour bar */}
                        <div className="w-full h-5 flex rounded-full overflow-hidden gap-[2px]">
                            {sortedRatings.map(r => {
                                const cfg = RATING_CONFIG[r.title.toLowerCase()] ?? DEFAULT_RATING;
                                return (
                                    <div
                                        key={r.title}
                                        style={{ width: `${r.percent}%` }}
                                        className={`${cfg.bar} h-full transition-all duration-700`}
                                        title={`${r.title}: ${r.percent}%`}
                                    />
                                );
                            })}
                        </div>
                        {/* Per-category breakdown */}
                        <div className="space-y-3">
                            {sortedRatings.map(r => {
                                const cfg = RATING_CONFIG[r.title.toLowerCase()] ?? DEFAULT_RATING;
                                return (
                                    <div key={r.title} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className={`flex items-center gap-2 font-semibold capitalize ${cfg.color}`}>
                                                {cfg.emoji} {r.title}
                                                <span className="text-yellow-400 text-xs tracking-tight">
                                                    {'★'.repeat(r.score)}{'☆'.repeat(Math.max(0, 5 - r.score))}
                                                </span>
                                            </span>
                                            <span className="text-slate-400 tabular-nums">
                                                {r.count} · <span className="text-slate-500">{r.percent}%</span>
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${cfg.bar} transition-all duration-700`}
                                                style={{ width: `${r.percent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <EmptyState message="No rating data available for this game." />
                )}
            </div>
        </div>
    );
}
