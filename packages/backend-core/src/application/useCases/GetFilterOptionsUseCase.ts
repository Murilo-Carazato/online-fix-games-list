import { Result } from "../../domain/common/Result";
import { StorageFailure } from "../../domain/common/Failure";
import { IGameRepository, FilterOptions } from "../../domain/repositories/IGameRepository";

export class GetFilterOptionsUseCase {
    constructor(private gameRepository: IGameRepository) { }

    async execute(): Promise<Result<FilterOptions, StorageFailure>> {
        return this.gameRepository.getFilterOptions();
    }
}
