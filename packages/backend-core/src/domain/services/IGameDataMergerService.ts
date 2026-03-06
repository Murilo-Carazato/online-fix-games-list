import { EnrichedGameEntity } from '../entities/EnrichedGameEntity';
import { HydraGameEntity } from '../entities/HydraGameEntity';
import { ExternalGameData } from '../data/ExternalGameData';

/**
 * Domain contract for merging external API data with raw Hydra game data
 * into a fully enriched entity. Lives in Domain — implementations in Infrastructure.
 */
export interface IGameDataMergerService {
    merge(externalData: ExternalGameData, hydraData: HydraGameEntity): EnrichedGameEntity | null;
}
