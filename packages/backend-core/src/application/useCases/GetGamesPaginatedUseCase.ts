import { IGameRepository, PaginatedQueryProps } from '../../domain/repositories/IGameRepository';
import { Result } from '../../domain/common/Result';
import { StorageFailure } from '../../domain/common/Failure';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';

export class GetGamesPaginatedUseCase {
    constructor(
        private readonly gameRepository: IGameRepository
    ) { }

    public async execute(props?: PaginatedQueryProps): Promise<Result<EnrichedGameEntity[], StorageFailure>> {
        return this.gameRepository.getGamesPaginated(props);
    }
}
