import { HydraGameEntity } from '../entities/HydraGameEntity';

/**
 * Contract for loading the raw game list from an external data source.
 * In the current implementation, this reads from a static JSON file (OnlineFix).
 * Future implementations could read from an RSS feed, an S3 bucket, or another API.
 *
 * Belongs to the Domain layer, following the Dependency Inversion Principle:
 * the Use Case depends on this abstraction, not on the concrete file reader.
 */
export interface IHydraGateway {
    loadGames(filePath: string): Promise<HydraGameEntity[]>;
}
