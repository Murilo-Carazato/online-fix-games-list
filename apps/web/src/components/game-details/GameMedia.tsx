'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { GameDetailsViewModel } from '@/presenters/GameDetailsViewModel';
import { CarouselLightbox, type LightboxItem } from './CarouselLightbox';
import { EmptyState } from './EmptyState';

// ─── Pure helper (SRP) ───────────────────────────────────────────────────────
const extractYoutubeId = (url: string): string | null => {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
};

// ─── CarouselStrip: horizontal snap carousel wrapper ─────────────────────────
interface CarouselStripProps<T> {
    items: T[];
    renderSlide: (item: T, idx: number) => React.ReactNode;
    emptyMessage: string;
}

function CarouselStrip<T>({ items, renderSlide, emptyMessage }: CarouselStripProps<T>) {
    if (items.length === 0) return <EmptyState message={emptyMessage} />;
    return (
        <div
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4"
            style={{ scrollbarWidth: 'none' }}
        >
            {items.map((item, idx) => renderSlide(item, idx))}
        </div>
    );
}

// ─── Main component — always renders all three sections ──────────────────────
export default function GameMedia({ game }: { game: GameDetailsViewModel }) {
    const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const openLightbox = (items: LightboxItem[], startIndex: number) => {
        setLightboxItems(items);
        setLightboxIndex(startIndex);
    };
    const closeLightbox = () => setLightboxItems([]);

    // Pre-build lightbox item arrays
    const screenshotItems: LightboxItem[] = game.screenshots.map((src, idx) => ({
        kind: 'image',
        src,
        alt: `Screenshot ${idx + 1}`,
    }));

    const igdbItems: LightboxItem[] = game.igdbVideos
        .map(url => extractYoutubeId(url))
        .filter((id): id is string => !!id)
        .map(videoId => ({ kind: 'youtube', videoId, title: 'Official Video' }));

    const creatorItems: LightboxItem[] = game.contentCreatorVideos
        .map(v => extractYoutubeId(v.url))
        .filter((id): id is string => !!id)
        .map((videoId, i) => ({
            kind: 'youtube',
            videoId,
            title: game.contentCreatorVideos[i].title,
        }));

    return (
        <>
            {lightboxItems.length > 0 && (
                <CarouselLightbox
                    items={lightboxItems}
                    initialIndex={lightboxIndex}
                    onClose={closeLightbox}
                />
            )}

            <div className="space-y-12">
                {/* ── Gallery ─────────────────────────────────────────── */}
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6">Gallery</h3>
                    <CarouselStrip
                        items={game.screenshots}
                        emptyMessage="No screenshots available for this game."
                        renderSlide={(src, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => openLightbox(screenshotItems, idx)}
                                className="relative aspect-video w-[85%] md:w-[45%] lg:w-[30%] shrink-0 snap-start rounded-lg overflow-hidden border border-white/10 group cursor-zoom-in"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={src}
                                    alt={`Screenshot ${idx + 1}`}
                                    className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition">
                                    <span className="text-white text-2xl opacity-0 group-hover:opacity-100 transition">🔍</span>
                                </span>
                            </button>
                        )}
                    />
                </section>

                {/* ── Official Trailers ────────────────────────────────── */}
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6">Trailers &amp; Gameplay</h3>
                    <CarouselStrip
                        items={game.igdbVideos}
                        emptyMessage="No official video trailers available for this game."
                        renderSlide={(url, idx) => {
                            const vidId = extractYoutubeId(url);
                            if (!vidId) return null;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => openLightbox(igdbItems, idx)}
                                    className="relative aspect-video w-[90%] md:w-[60%] shrink-0 snap-start rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`}
                                        alt={`Video ${idx + 1}`}
                                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <span className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                                        <span className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl pl-1 shadow-lg group-hover:scale-110 transition-transform">
                                            ▶
                                        </span>
                                    </span>
                                </button>
                            );
                        }}
                    />
                </section>

                {/* ── Content Creators ─────────────────────────────────── */}
                <section>
                    <h3 className="text-2xl font-bold text-white mb-6">Content Creators</h3>
                    <CarouselStrip
                        items={game.contentCreatorVideos}
                        emptyMessage="No content creator videos found for this game."
                        renderSlide={(video, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => openLightbox(creatorItems, idx)}
                                className="block w-[85%] md:w-[45%] lg:w-[30%] shrink-0 snap-start group bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-indigo-500/50 transition text-left cursor-pointer"
                            >
                                <div className="relative aspect-video w-full">
                                    <Image
                                        src={video.thumbnailUrl}
                                        alt={video.title}
                                        fill
                                        sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 30vw"
                                        className="object-cover group-hover:scale-105 transition duration-500"
                                    />
                                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <span className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white pl-1 shadow-lg">
                                            ▶
                                        </span>
                                    </span>
                                </div>
                                <div className="p-4">
                                    <h4 className="text-white font-medium line-clamp-2 text-sm mb-1">{video.title}</h4>
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>{video.channelTitle}</span>
                                        <span>{video.publishedAt}</span>
                                    </div>
                                </div>
                            </button>
                        )}
                    />
                </section>
            </div>
        </>
    );
}
