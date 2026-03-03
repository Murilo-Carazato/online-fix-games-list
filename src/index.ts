import * as dotenv from 'dotenv';
import * as path from 'path';
import { IgdbApiProvider } from './services/IgdbApiProvider';
import { RawgApiProvider } from './services/RawgApiProvider';
import { CompositeGameDataProvider } from './services/CompositeGameDataProvider';
import { JsonStorageProvider } from './services/JsonStorageProvider';
import { GameNameCleaner } from './utils/GameNameCleaner';
import { DataEnricherService } from './services/DataEnricherService';
import { IGameDataProvider } from './domain/interfaces/IGameDataProvider';

// Load environment variables configured in docker-compose
dotenv.config();

const providerType = process.env.API_PROVIDER || 'composite';
let apiProvider: IGameDataProvider;

if (providerType === 'composite') {
    const RAWG_KEY = process.env.RAWG_API_KEY;
    const CLIENT_ID = process.env.IGDB_CLIENT_ID;
    const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;

    if (!RAWG_KEY || !CLIENT_ID || !CLIENT_SECRET) {
        console.error("ERROR: RAWG_API_KEY, IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set to use the composite provider.");
        process.exit(1);
    }
    const rawg = new RawgApiProvider(RAWG_KEY);
    const igdb = new IgdbApiProvider(CLIENT_ID, CLIENT_SECRET);

    apiProvider = new CompositeGameDataProvider(igdb, rawg);
    console.log("Configured to use: COMPOSITE API (IGDB + RAWG)");
} else if (providerType === 'rawg') {
    const RAWG_KEY = process.env.RAWG_API_KEY;
    if (!RAWG_KEY) {
        console.error("ERROR: RAWG_API_KEY must be set in environment variables to use the RAWG provider.");
        process.exit(1);
    }
    apiProvider = new RawgApiProvider(RAWG_KEY);
    console.log("Configured to use: RAWG API");
} else {
    const CLIENT_ID = process.env.IGDB_CLIENT_ID;
    const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error("ERROR: IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set to use the IGDB provider.");
        process.exit(1);
    }
    apiProvider = new IgdbApiProvider(CLIENT_ID, CLIENT_SECRET);
    console.log("Configured to use: IGDB API");
}

const inputPath = path.resolve(__dirname, '../data/onlinefix.json');
const outputPath = path.resolve(__dirname, '../data/onlinefix_enriched.json');

async function main() {
    console.log("=== HYDRA GAMES ENRICHER ===");
    console.log("Initializing Services...");

    const storageProvider = new JsonStorageProvider();
    const nameCleaner = new GameNameCleaner();

    const enricherService = new DataEnricherService(
        apiProvider,
        storageProvider,
        nameCleaner
    );

    const limit = 5; // Temporarily set for verification

    console.log(`Starting execution to enrich up to ${limit ?? 'ALL'} games...`);

    await enricherService.enrichDataset(inputPath, outputPath, limit);

    console.log("=== DONE ===");
}

main().catch(error => {
    console.error("Fatal Error:", error);
    process.exit(1);
});
