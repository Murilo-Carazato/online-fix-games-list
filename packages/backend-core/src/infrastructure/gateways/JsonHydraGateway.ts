import * as fs from 'fs/promises';
import { IHydraGateway } from '../../domain/gateways/IHydraGateway';
import { HydraGameEntity } from '../../domain/entities/HydraGameEntity';

/**
 * Reads the raw OnlineFix game list from a static JSON file on disk.
 * Implements IHydraGateway — this is a read-only Gateway to an external file.
 * Future sources (RSS, remote API, S3) would implement the same interface.
 */
export class JsonHydraGateway implements IHydraGateway {
    async loadGames(filePath: string): Promise<HydraGameEntity[]> {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data) as HydraGameEntity[];
        } catch (error: unknown) {
            console.error(`Error loading games from ${filePath}:`, error);
            throw error;
        }
    }
}
