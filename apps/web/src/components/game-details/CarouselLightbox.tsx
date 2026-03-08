'use client';

import { useState, useEffect, useCallback } from 'react';

export type LightboxItem =
    | { kind: 'image'; src: string; alt: string }
    | { kind: 'youtube'; videoId: string; title: string };

interface Props {
    items: LightboxItem[];
    initialIndex: number;
    onClose: () => void;
}

export function CarouselLightbox({ items, initialIndex, onClose }: Props) {
    const [index, setIndex] = useState(initialIndex);

    const prev = useCallback(() => setIndex(i => (i - 1 + items.length) % items.length), [items.length]);
    const next = useCallback(() => setIndex(i => (i + 1) % items.length), [items.length]);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [prev, next, onClose]);

    const current = items[index];

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
            onClick={onClose}
        >
            {/* Card – stop propagation so clicking inside doesn't close */}
            <div
                className="relative flex flex-col items-center max-w-5xl w-full mx-4"
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white/60 hover:text-white text-3xl leading-none"
                    aria-label="Fechar"
                >
                    ×
                </button>

                {/* Counter */}
                <p className="absolute -top-10 left-0 text-slate-400 text-sm">
                    {index + 1} / {items.length}
                </p>

                {/* Content */}
                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl">
                    {current.kind === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={current.src} alt={current.alt} className="w-full h-full object-contain" />
                    ) : (
                        <iframe
                            src={`https://www.youtube.com/embed/${current.videoId}?autoplay=1`}
                            title={current.title}
                            className="w-full h-full"
                            allowFullScreen
                            allow="autoplay"
                        />
                    )}
                </div>

                {/* Nav arrows */}
                {items.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition text-xl"
                            aria-label="Anterior"
                        >
                            ‹
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-white/20 transition text-xl"
                            aria-label="Próximo"
                        >
                            ›
                        </button>
                    </>
                )}

                {/* Dot indicators */}
                <div className="flex gap-2 mt-4">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`w-2 h-2 rounded-full transition ${i === index ? 'bg-white scale-125' : 'bg-white/30'}`}
                            aria-label={`Ir para item ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
