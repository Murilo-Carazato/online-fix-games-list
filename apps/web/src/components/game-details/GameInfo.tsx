import type { GameDetailsViewModel } from '@/presenters/GameDetailsViewModel';
import { EmptyState } from './EmptyState';

// ─── Static section config (OCP) ─────────────────────────────────────────────
// Franchises is last: it usually has very few items and occupies its own row
// to prevent a misaligned half-row next to another section.
const TAG_SECTIONS = [
    { key: 'genres' as const, title: 'Genres' },
    { key: 'themes' as const, title: 'Themes' },
    { key: 'gameModes' as const, title: 'Modes' },
    { key: 'platforms' as const, title: 'Platforms' },
] satisfies { key: keyof Pick<GameDetailsViewModel, 'genres' | 'themes' | 'gameModes' | 'platforms'>; title: string }[];

export default function GameInfo({ game }: { game: GameDetailsViewModel }) {
    return (
        <div className="space-y-8">

            {/* Tag grids — always shown, with empty state if no items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {TAG_SECTIONS.map(({ key, title }) => {
                    const items = game[key];
                    return (
                        <div key={title} className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-3">
                                {title}
                            </h3>
                            {items.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {items.map(item => (
                                        <span key={item} className="px-2 py-1 bg-white/10 text-slate-200 text-xs rounded-md">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message={`No ${title.toLowerCase()} data for this game.`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Language support — shown before Franchises */}
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-4">Languages Supported</h3>
                {game.languages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {game.languages.map(lang => (
                            <div key={lang.language} className="space-y-1">
                                <span className="text-slate-200 font-semibold text-sm">{lang.language}</span>
                                <p className="text-slate-500 text-xs">{lang.supports.join(', ')}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState message="No language support data for this game." />
                )}
            </div>

            {/* Franchises — always last, full-width to avoid half-empty grid slots */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-3">Franchises</h3>
                {game.franchises.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {game.franchises.map(item => (
                            <span key={item} className="px-2 py-1 bg-white/10 text-slate-200 text-xs rounded-md">{item}</span>
                        ))}
                    </div>
                ) : (
                    <EmptyState message="No franchise data for this game." />
                )}
            </div>
        </div>
    );
}
