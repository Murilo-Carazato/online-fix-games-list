'use client';

import { memo } from 'react';
import type { EnrichedGameEntity } from '@hydra/backend-core/src/domain/entities/EnrichedGameEntity';
import Image from 'next/image';
import { formatRating, formatPopularity, formatUploadDate } from '@/utils/formatters';

interface GameCardProps {
    game: EnrichedGameEntity;
    wantToPlay: boolean;
    ignored: boolean;
    onToggleWantToPlay: () => void;
    onToggleIgnored: () => void;
}

export const GameCard = memo(function GameCard({ game, wantToPlay, ignored, onToggleWantToPlay, onToggleIgnored }: GameCardProps) {
    const rating = formatRating(game.totalRating);
    const popularity = formatPopularity(game.added);
    const genres = game.genres?.slice(0, 2) ?? [];

    return (
        <div
            className={`
        group relative rounded-xl border bg-card transition-all duration-200
        hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10
        ${ignored ? 'opacity-40' : ''}
        ${wantToPlay ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border'}
      `}
        >
            {/* Cover image */}
            <div className="h-36 rounded-t-xl overflow-hidden bg-secondary relative">
                {game.coverUrl ? (
                    <Image
                        src={game.coverUrl}
                        alt={game.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {genres.map(g => (
                        <span key={g} className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                            {g}
                        </span>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className="p-3 space-y-2">
                <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground" title={game.title}>
                    {game.title}
                </h3>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {rating !== null && (
                        <span className="flex items-center gap-1" title="Rating">
                            ⭐ <span className="font-medium text-foreground">{rating}</span>
                        </span>
                    )}
                    {popularity !== null && (
                        <span className="flex items-center gap-1" title="Popularidade (usuários)">
                            👥 <span className="font-medium text-foreground">{popularity}</span>
                        </span>
                    )}
                    {game.playtime && (
                        <span className="flex items-center gap-1" title="Tempo médio">
                            ⏱ <span className="font-medium text-foreground">{game.playtime}h</span>
                        </span>
                    )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                    {formatUploadDate(game.uploadDate)}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button
                        id={`want-${game.title.replace(/\s+/g, '-')}`}
                        onClick={onToggleWantToPlay}
                        title={wantToPlay ? 'Remover da lista' : 'Quero jogar'}
                        aria-label={wantToPlay ? 'Remover jogo da lista de desejos' : 'Adicionar jogo à lista de desejos'}
                        className={`
              flex-1 text-xs py-1.5 rounded-lg font-medium transition-all
              ${wantToPlay
                                ? 'bg-primary text-primary-foreground hover:opacity-80'
                                : 'bg-secondary text-secondary-foreground hover:bg-primary/20'}
            `}
                    >
                        {wantToPlay ? '✓ Quero jogar' : '+ Quero jogar'}
                    </button>

                    <button
                        id={`ignore-${game.title.replace(/\s+/g, '-')}`}
                        onClick={onToggleIgnored}
                        title={ignored ? 'Remover dos ignorados' : 'Ignorar'}
                        aria-label={ignored ? 'Remover jogo da lista de ignorados' : 'Ignorar jogo e ocultar da listagem principal'}
                        className={`
              px-2.5 text-xs py-1.5 rounded-lg font-medium transition-all
              ${ignored
                                ? 'bg-red-900/60 text-red-300 hover:bg-red-900'
                                : 'bg-secondary text-muted-foreground hover:bg-red-900/30 hover:text-red-400'}
            `}
                    >
                        🚫
                    </button>
                </div>
            </div>
        </div>
    );
});
