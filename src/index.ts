import * as dotenv from 'dotenv';
import * as path from 'path';
import { IgdbApiProvider } from './services/IgdbApiProvider';
import { JsonStorageProvider } from './services/JsonStorageProvider';
import { GameNameCleaner } from './utils/GameNameCleaner';
import { DataEnricherService } from './services/DataEnricherService';

// Load environment variables configured in docker-compose
dotenv.config();

const CLIENT_ID = process.env.IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("ERROR: IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set in environment variables/docker-compose.yml");
    process.exit(1);
}

const inputPath = path.resolve(__dirname, '../data/onlinefix.json');
const outputPath = path.resolve(__dirname, '../data/onlinefix_enriched.json');

async function main() {
    console.log("=== HYDRA GAMES ENRICHER ===");
    console.log("Initializing Services...");

    const apiProvider = new IgdbApiProvider(CLIENT_ID!, CLIENT_SECRET!);
    const storageProvider = new JsonStorageProvider();
    const nameCleaner = new GameNameCleaner();

    const enricherService = new DataEnricherService(
        apiProvider,
        storageProvider,
        nameCleaner
    );

    const limit = undefined; // Set to undefined to process all games

    console.log(`Starting execution to enrich up to ${limit ?? 'ALL'} games...`);

    await enricherService.enrichDataset(inputPath, outputPath, limit);

    console.log("=== DONE ===");
}

main().catch(error => {
    console.error("Fatal Error:", error);
    process.exit(1);
});
