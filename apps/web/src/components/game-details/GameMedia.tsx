import type { GameDetailsViewModel } from '@/presenters/GameDetailsViewModel';
import Image from 'next/image';

const extractYoutubeId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
};

export default function GameMedia({ game }: { game: GameDetailsViewModel }) {
    const hasAnyMedia = game.screenshots.length > 0 || game.igdbVideos.length > 0 || game.contentCreatorVideos.length > 0;

    if (!hasAnyMedia) return null;

    return (
        <div className="space-y-12">
            {/* Screenshots */}
            {game.screenshots.length > 0 && (
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6">Gallery</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {game.screenshots.map((src, idx) => (
                            <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-white/10 group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={src} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Official Videos */}
            {game.igdbVideos.length > 0 && (
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6">Trailers & Gameplay</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {game.igdbVideos.map((url, idx) => {
                            const vidId = extractYoutubeId(url);
                            if (!vidId) return null;
                            return (
                                <div key={idx} className="aspect-video w-full rounded-xl overflow-hidden border border-white/10">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${vidId}`}
                                        title={`Video ${idx}`}
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Content Creator Videos */}
            {game.contentCreatorVideos.length > 0 && (
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6">Content Creators</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {game.contentCreatorVideos.map((video, idx) => (
                            <a
                                key={idx}
                                href={video.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block group bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-indigo-500/50 transition"
                            >
                                <div className="relative aspect-video w-full">
                                    <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover group-hover:scale-105 transition duration-500" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white pl-1 shadow-lg">
                                            ▶
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h4 className="text-white font-medium line-clamp-2 text-sm mb-1">{video.title}</h4>
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>{video.channelTitle}</span>
                                        <span>{video.publishedAt}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
