import type { EnrichedGameEntity } from '@hydra/backend-core';
import type { GameViewModel } from './GameViewModel';
import { formatRating, formatPopularity, formatUploadDate, slugify } from '../utils/formatters';
import { TitleCleanerService } from '@hydra/backend-core';

export class GamePresenter {
    /**
     * Translates a rich Domain Entity into a lightweight, UI-friendly ViewModel.
     * Keeps formatting logic out of React components.
     */
    static toViewModel(entity: EnrichedGameEntity): GameViewModel {
        const idStr = entity.id ? `${entity.id}-${slugify(entity.title)}` : entity.title;
        return {
            id: idStr, // DB id with slug, fallback to title
            title: new TitleCleanerService().clean(entity.title),
            coverUrl: entity.coverUrl
                ? (entity.coverUrl.startsWith('//') ? `https:${entity.coverUrl}` : entity.coverUrl)
                : null,
            rating: formatRating(entity.totalRating),
            ratingCount: entity.totalRatingCount ?? null,
            popularity: formatPopularity(entity.added),
            playtime: entity.playtime ? `${entity.playtime}` : null,
            fileSize: entity.fileSize || null,
            formattedUploadDate: formatUploadDate(entity.uploadDate),
            genres: entity.genres?.slice(0, 2) ?? [],
            platforms: entity.platforms ?? [],
            stores: (entity.externalGames ?? []).map(g => ({ name: g.storeName, url: g.url, icon: g.categoryIcon })),
        };
    }

    /**
     * Translates a list of Domain Entities.
     */
    static toViewModelList(entities: EnrichedGameEntity[]): GameViewModel[] {
        return entities.map(GamePresenter.toViewModel);
    }
}
