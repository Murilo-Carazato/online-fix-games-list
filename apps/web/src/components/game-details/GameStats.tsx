import type { GameDetailsViewModel } from '@/presenters/GameDetailsViewModel';

export default function GameStats({ game }: { game: GameDetailsViewModel }) {
    if (game.ratings.length === 0 && game.addedStats.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* RAWG Player Categories (added stats) */}
            {game.addedStats.length > 0 && (
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-slate-200 font-bold mb-6 text-xl">Player Activity</h3>
                    <div className="space-y-4">
                        {game.addedStats.map(stat => {
                            const maxCount = game.addedStats[0].count; // sorted descending
                            const percent = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                            return (
                                <div key={stat.status} className="relative pt-1">
                                    <div className="flex justify-between mb-1 items-center">
                                        <span className="text-sm font-medium text-slate-300 capitalize">{stat.status}</span>
                                        <span className="text-sm text-slate-400">{stat.count}</span>
                                    </div>
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-white/10">
                                        <div
                                            style={{ width: `${percent}%` }}
                                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 rounded"
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ratings Breakdown */}
            {game.ratings.length > 0 && (
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col justify-center">
                    <h3 className="text-slate-200 font-bold mb-6 text-xl">Rating Distribution</h3>

                    {/* Visual Bar */}
                    <div className="w-full h-4 flex rounded overflow-hidden mb-4">
                        {game.ratings.map((rating, index) => {
                            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500'];
                            const color = colors[index % colors.length];
                            return (
                                <div
                                    key={rating.title}
                                    style={{ width: `${rating.percent}%` }}
                                    className={`${color} h-full`}
                                    title={`${rating.title}: ${rating.percent}%`}
                                />
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 mt-2">
                        {game.ratings.map((rating, index) => {
                            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500'];
                            const color = colors[index % colors.length];
                            return (
                                <div key={rating.title} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${color}`} />
                                    <span className="text-slate-300 text-sm capitalize">{rating.title}</span>
                                    <span className="text-slate-500 text-xs">({rating.count})</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
