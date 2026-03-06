import * as fs from 'fs/promises';
import { IHydraGateway } from '../../../domain/gateways/IHydraGateway';
import { HydraGameEntity } from '../../../domain/entities/HydraGameEntity';
import { Result } from '../../../domain/common/Result';
import { InitializationFailure } from '../../../domain/common/Failure';

/**
 * Reads the raw OnlineFix game list from a static JSON file on disk.
 * Implements IHydraGateway — this is a read-only Gateway to an external file.
 * Future sources (RSS, remote API, S3) would implement the same interface.
 */
export class JsonHydraGateway implements IHydraGateway {
    async loadGames(filePath: string): Promise<Result<HydraGameEntity[], InitializationFailure>> {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const games = JSON.parse(data) as HydraGameEntity[];
            return Result.ok(games);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`Error loading games from ${filePath}:`, msg);
            return Result.fail(new InitializationFailure(`Could not parse JSON: ${msg}`));
        }
    }
}
