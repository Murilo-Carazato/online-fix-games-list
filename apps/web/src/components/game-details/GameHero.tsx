import Image from 'next/image';
import type { GameDetailsViewModel } from '@/presenters/GameDetailsViewModel';

export default function GameHero({ game }: { game: GameDetailsViewModel }) {
    return (
        <div className="relative w-full h-[50vh] md:h-[60vh] flex items-end justify-start overflow-hidden rounded-xl shadow-2xl mb-8 group">
            <div className="absolute inset-0 z-0">
                {game.coverUrl ? (
                    <Image
                        src={game.coverUrl}
                        alt={`${game.title} Cover`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <span className="text-slate-400">No Cover</span>
                    </div>
                )}
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent" />
            </div>

            <div className="relative z-10 w-full p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg">
                        {game.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm md:text-base text-slate-300">
                        {game.formattedUploadDate && (
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/5">
                                Added {game.formattedUploadDate}
                            </span>
                        )}
                        {game.fileSize && (
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-200 backdrop-blur-md rounded-full border border-indigo-500/10">
                                💾 {game.fileSize}
                            </span>
                        )}
                        {game.playtime && (
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 backdrop-blur-md rounded-full border border-emerald-500/10">
                                ⏱️ {game.playtime}
                            </span>
                        )}
                    </div>
                </div>

                {/* Stores & Rating */}
                <div className="flex flex-row md:flex-col items-center justify-end gap-4">
                    {game.rating && (
                        <div className="flex flex-col items-end">
                            <span className="text-5xl font-black text-yellow-400 drop-shadow-md">
                                {game.rating}
                            </span>
                            {game.ratingCount && (
                                <span className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
                                    {game.ratingCount} Ratings
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {game.stores.map((store) => (
                            <a
                                key={store.storeName}
                                href={store.url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition hover:scale-110 shadow-lg"
                                title={`View on ${store.storeName}`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={store.categoryIcon} alt={store.storeName} className="w-6 h-6 object-contain filter grayscale invert" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
