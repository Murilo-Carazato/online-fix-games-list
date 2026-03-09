'use client';

import { memo } from 'react';
import type { GameViewModel } from '@/presenters/GameViewModel';
import Image from 'next/image';
import Link from 'next/link';

interface GameCardProps {
    game: GameViewModel;
    wantToPlay: boolean;
    ignored: boolean;
    onToggleWantToPlay: () => void;
    onToggleIgnored: () => void;
}

export const GameCard = memo(function GameCard({ game, wantToPlay, ignored, onToggleWantToPlay, onToggleIgnored }: GameCardProps) {
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
            <Link href={`/game/${game.id}`} className="block h-36 rounded-t-xl overflow-hidden bg-secondary relative">
                {game.coverUrl ? (
                    <Image
                        src={game.coverUrl}
                        alt={game.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-fill w-full h-full scale-100 group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    {game.genres.map(g => (
                        <span key={g} className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                            {g}
                        </span>
                    ))}
                </div>
            </Link>

            {/* Body */}
            <div className="p-3 space-y-2">
                <Link href={`/game/${game.id}`}>
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground hover:text-primary transition-colors" title={game.title}>
                        {game.title}
                    </h3>
                </Link>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {game.rating !== null && (
                        <span className="flex items-center gap-1" title="Rating">
                            ⭐ <span className="font-medium text-foreground">{game.rating}</span>
                            {game.ratingCount !== null && <span className="text-[10px] opacity-70">({game.ratingCount})</span>}
                        </span>
                    )}
                    {game.popularity !== null && (
                        <span className="flex items-center gap-1" title="Popularidade (usuários)">
                            👥 <span className="font-medium text-foreground">{game.popularity}</span>
                        </span>
                    )}
                    {game.fileSize && (
                        <span className="flex items-center gap-1" title="Tamanho do Arquivo">
                            💾 <span className="font-medium text-foreground">{game.fileSize}</span>
                        </span>
                    )}
                    {game.playtime && (
                        <span className="flex items-center gap-1" title="Tempo médio">
                            ⏱ <span className="font-medium text-foreground">{game.playtime}</span>
                        </span>
                    )}
                </div>

                {/* Stores Only */}
                {game.stores.length > 0 && (
                    <div className="flex flex-col gap-1 mt-2 text-[10px]">
                        <div className="flex flex-wrap gap-2 items-center text-muted-foreground mt-0.5">
                            <span className="font-semibold text-foreground">Lojas:</span>
                            {game.stores.map(s => (
                                <a
                                    key={s.name}
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:scale-110 transition-transform opacity-90 hover:opacity-100"
                                    title={`Abrir página na loja: ${s.name}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={s.icon} alt={s.name} className="w-4 h-4 rounded-sm object-cover bg-black/20" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                    {game.formattedUploadDate}
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
