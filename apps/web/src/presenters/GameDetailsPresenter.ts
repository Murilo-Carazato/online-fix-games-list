import { EnrichedGameEntity, VideoEntity, IgdbExternalGame, RawgRating } from '@hydra/backend-core';
import type { GameDetailsViewModel } from './GameDetailsViewModel';
import { slugify } from '../utils/formatters';

export class GameDetailsPresenter {
    public static toViewModel(entity: EnrichedGameEntity, gameId: number): GameDetailsViewModel {
        const id = `${gameId}-${slugify(entity.title)}`;

        // Process languages into grouped supports
        const langMap = new Map<string, Set<string>>();
        if (entity.languageSupports) {
            for (const support of entity.languageSupports) {
                if (!langMap.has(support.language)) {
                    langMap.set(support.language, new Set());
                }
                langMap.get(support.language)!.add(support.supportType);
            }
        }
        const languages = Array.from(langMap.entries()).map(([lang, types]) => ({
            language: lang,
            supports: Array.from(types)
        }));

        // Added Stats array
        const addedStats: { status: string; count: number }[] = [];
        if (entity.addedByStatus) {
            for (const [status, count] of Object.entries(entity.addedByStatus)) {
                addedStats.push({ status, count: Number(count) });
            }
            // Sort by highest count
            addedStats.sort((a, b) => b.count - a.count);
        }

        return {
            id,
            title: entity.title,
            coverUrl: entity.coverUrl ? (entity.coverUrl.startsWith('//') ? `https:${entity.coverUrl}` : entity.coverUrl) : null,
            rating: entity.totalRating ? Number(entity.totalRating.toFixed(1)) : null,
            ratingCount: entity.totalRatingCount ?? null,
            playtime: entity.playtime ? `${entity.playtime}h` : null,
            fileSize: entity.fileSize ?? null,
            formattedUploadDate: this.formatDate(entity.uploadDate),
            genres: entity.genres || [],
            themes: entity.themes || [],
            gameModes: entity.gameModes || [],
            platforms: entity.platforms || [],
            franchises: entity.franchises || [],
            languages,
            stores: (entity.externalGames || []).map((store: IgdbExternalGame) => ({
                storeName: store.storeName,
                url: store.url,
                categoryIcon: store.categoryIcon
            })),
            screenshots: entity.screenshots || [],
            igdbVideos: (entity.videos || []).map((url: string) => url.trim()),  // trim leading/trailing whitespace
            contentCreatorVideos: (entity.contentCreatorVideos || []).map((v: VideoEntity) => ({
                url: v.url,
                title: v.title,
                channelTitle: v.channelTitle,
                thumbnailUrl: v.thumbnailUrl,
                publishedAt: this.formatDate(v.publishedAt)
            })),
            ratings: (entity.ratings || []).map((r: RawgRating) => ({
                title: r.title,
                score: r.score ?? 0,
                count: r.count,
                percent: r.percent,
            })),
            addedStats
        };
    }

    private static formatDate(dateStr: string): string {
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
        } catch {
            return dateStr;
        }
    }
}
