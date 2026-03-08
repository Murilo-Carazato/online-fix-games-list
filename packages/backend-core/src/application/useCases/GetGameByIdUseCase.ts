import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { Result } from '../../domain/common/Result';
import { StorageFailure, NotFoundFailure } from '../../domain/common/Failure';

export class GetGameByIdUseCase {
    constructor(private readonly gameRepository: IGameRepository) { }

    public async execute(id: number): Promise<Result<EnrichedGameEntity, StorageFailure | NotFoundFailure>> {
        if (!id || id <= 0 || isNaN(id)) {
            return Result.fail(new StorageFailure('Invalid game ID provided.'));
        }

        return this.gameRepository.getGameById(id);
    }
}
