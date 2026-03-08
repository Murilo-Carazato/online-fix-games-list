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

            <div className="space-y-10">
                {/* ── Official Trailers ──────────────────────────────────────── */}
                <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/[0.07]">
                        <span className="text-xl">🎬</span>
                        <h3 className="text-base font-semibold text-white tracking-wide uppercase">Trailers &amp; Gameplay</h3>
                    </div>
                    <div className="p-5">
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
                                        className="relative aspect-video w-[90%] md:w-[65%] shrink-0 snap-start rounded-xl overflow-hidden border border-white/10 group cursor-pointer shadow-lg"
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={`https://i.ytimg.com/vi/${vidId}/maxresdefault.jpg`}
                                            alt={`Trailer ${idx + 1}`}
                                            className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                        />
                                        {/* Dark overlay + play button */}
                                        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center">
                                            <span className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white text-2xl pl-1 shadow-xl group-hover:scale-110 transition-transform duration-200">
                                                ▶
                                            </span>
                                        </span>
                                        <span className="absolute bottom-3 left-3 text-xs text-white/60 font-mono">#{idx + 1}</span>
                                    </button>
                                );
                            }}
                        />
                    </div>
                </section>

                {/* ── Gallery ───────────────────────────────────────────────── */}
                <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/[0.07]">
                        <span className="text-xl">🖼</span>
                        <h3 className="text-base font-semibold text-white tracking-wide uppercase">Gallery</h3>
                        <span className="ml-auto text-xs text-slate-500">{game.screenshots.length} screenshots</span>
                    </div>
                    <div className="p-5">
                        <CarouselStrip
                            items={game.screenshots}
                            emptyMessage="No screenshots available for this game."
                            renderSlide={(src, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => openLightbox(screenshotItems, idx)}
                                    className="relative aspect-video w-[85%] md:w-[48%] lg:w-[32%] shrink-0 snap-start rounded-xl overflow-hidden border border-white/10 group cursor-zoom-in shadow-md"
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={src}
                                        alt={`Screenshot ${idx + 1}`}
                                        className="w-full h-full object-cover transition duration-300 group-hover:scale-110 group-hover:brightness-90"
                                        loading="lazy"
                                    />
                                    <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition duration-200">
                                        <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition drop-shadow-lg">🔍</span>
                                    </span>
                                </button>
                            )}
                        />
                    </div>
                </section>

                {/* ── Content Creators ──────────────────────────────────────── */}
                <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/[0.07]">
                        <span className="text-xl">📹</span>
                        <h3 className="text-base font-semibold text-white tracking-wide uppercase">Content Creators</h3>
                    </div>
                    <div className="p-5">
                        <CarouselStrip
                            items={game.contentCreatorVideos}
                            emptyMessage="No content creator videos found for this game."
                            renderSlide={(video, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => openLightbox(creatorItems, idx)}
                                    className="block w-[85%] md:w-[48%] lg:w-[32%] shrink-0 snap-start group bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-indigo-400/40 hover:shadow-indigo-900/30 hover:shadow-lg transition-all duration-200 text-left cursor-pointer"
                                >
                                    <div className="relative aspect-video w-full overflow-hidden">
                                        <Image
                                            src={video.thumbnailUrl}
                                            alt={video.title}
                                            fill
                                            sizes="(max-width: 768px) 85vw, (max-width: 1024px) 48vw, 32vw"
                                            className="object-cover group-hover:scale-105 transition duration-500"
                                        />
                                        <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-start p-3 opacity-0 group-hover:opacity-100 transition duration-200">
                                            <span className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white pl-0.5 shadow-lg">
                                                ▶
                                            </span>
                                        </span>
                                    </div>
                                    <div className="px-4 py-3">
                                        <h4 className="text-white font-medium line-clamp-2 text-sm leading-snug mb-2">{video.title}</h4>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-indigo-400 font-medium">{video.channelTitle}</span>
                                            <span className="text-slate-500">{video.publishedAt}</span>
                                        </div>
                                    </div>
                                </button>
                            )}
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

