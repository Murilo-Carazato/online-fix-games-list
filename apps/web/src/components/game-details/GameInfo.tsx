import type { GameDetailsViewModel } from '@/presenters/GameDetailsViewModel';

export default function GameInfo({ game }: { game: GameDetailsViewModel }) {
    const sections = [
        { title: 'Genres', items: game.genres },
        { title: 'Themes', items: game.themes },
        { title: 'Modes', items: game.gameModes },
        { title: 'Platforms', items: game.platforms },
        { title: 'Franchises', items: game.franchises },
    ].filter(s => s.items.length > 0);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {sections.map(section => (
                    <div key={section.title} className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-3">{section.title}</h3>
                        <div className="flex flex-wrap gap-2">
                            {section.items.map(item => (
                                <span key={item} className="px-2 py-1 bg-white/10 text-slate-200 text-xs rounded-md">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {game.languages.length > 0 && (
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-slate-400 text-sm uppercase tracking-wider font-bold mb-4">Languages supported</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {game.languages.map(lang => (
                            <div key={lang.language} className="space-y-1">
                                <span className="text-slate-200 font-semibold text-sm">{lang.language}</span>
                                <p className="text-slate-500 text-xs">
                                    {lang.supports.join(', ')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
