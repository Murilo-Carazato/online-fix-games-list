import { IGameRepository, PaginatedQueryProps, SortKey, AdvancedFilters } from '../../domain/repositories/IGameRepository';
import { Result } from '../../domain/common/Result';
import { StorageFailure } from '../../domain/common/Failure';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';

export interface GetGamesPaginatedRequest {
    limit?: number;
    offset?: number;
    search?: string;
    filters?: AdvancedFilters;
    sort?: SortKey;
    sortDirection?: 'asc' | 'desc';
}

export class GetGamesPaginatedUseCase {
    constructor(
        private readonly gameRepository: IGameRepository
    ) { }

    public async execute(request?: GetGamesPaginatedRequest): Promise<Result<EnrichedGameEntity[], StorageFailure>> {
        const props: PaginatedQueryProps | undefined = request ? {
            limit: request.limit,
            offset: request.offset,
            search: request.search,
            filters: request.filters,
            sort: request.sort,
            sortDirection: request.sortDirection,
        } : undefined;
        return this.gameRepository.getGamesPaginated(props);
    }
}
