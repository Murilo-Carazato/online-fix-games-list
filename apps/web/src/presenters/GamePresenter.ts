import type { EnrichedGameEntity } from '@hydra/backend-core';
import type { GameViewModel } from './GameViewModel';
import { formatRating, formatPopularity, formatUploadDate } from '../utils/formatters';

export class GamePresenter {
    /**
     * Translates a rich Domain Entity into a lightweight, UI-friendly ViewModel.
     * Keeps formatting logic out of React components.
     */
    static toViewModel(entity: EnrichedGameEntity): GameViewModel {
        return {
            id: entity.title, // 'title' was used as key in the frontend list
            title: entity.title,
            coverUrl: entity.coverUrl ?? null,
            rating: formatRating(entity.totalRating),
            popularity: formatPopularity(entity.added),
            playtime: entity.playtime ? `${entity.playtime}` : null,
            formattedUploadDate: formatUploadDate(entity.uploadDate),
            genres: entity.genres?.slice(0, 2) ?? [],
        };
    }

    /**
     * Translates a list of Domain Entities.
     */
    static toViewModelList(entities: EnrichedGameEntity[]): GameViewModel[] {
        return entities.map(GamePresenter.toViewModel);
    }
}
