import * as fs from 'fs/promises';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { HydraGameEntity } from '../../domain/entities/HydraGameEntity';

export class JsonGameRepository implements IGameRepository {
    async loadGames(path: string): Promise<HydraGameEntity[]> {
        try {
            const data = await fs.readFile(path, 'utf8');
            return JSON.parse(data) as HydraGameEntity[];
        } catch (error: unknown) {
            console.error(`Error loading games from ${path}:`, error);
            throw error;
        }
    }

    async saveGames(path: string, games: EnrichedGameEntity[]): Promise<void> {
        try {
            const data = JSON.stringify(games, null, 2);
            await fs.writeFile(path, data, 'utf8');
            console.log(`Saved ${games.length} games to ${path}`);
        } catch (error: unknown) {
            console.error(`Error saving games to ${path}:`, error);
            throw error;
        }
    }
}
