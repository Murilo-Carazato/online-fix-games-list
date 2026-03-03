import * as fs from 'fs/promises';
import { IStorageProvider } from '../domain/interfaces/IStorageProvider';
import { HydraGame, EnrichedGame } from '../domain/models/Game';

export class JsonStorageProvider implements IStorageProvider {
    async loadGames(path: string): Promise<HydraGame[]> {
        try {
            const data = await fs.readFile(path, 'utf8');
            return JSON.parse(data) as HydraGame[];
        } catch (error) {
            console.error(`Error loading games from ${path}:`, error);
            throw error;
        }
    }

    async saveGames(path: string, games: EnrichedGame[]): Promise<void> {
        try {
            const data = JSON.stringify(games, null, 2);
            await fs.writeFile(path, data, 'utf8');
            console.log(`Saved ${games.length} games to ${path}`);
        } catch (error) {
            console.error(`Error saving games to ${path}:`, error);
            throw error;
        }
    }
}
