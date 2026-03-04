import * as fs from 'fs';
import * as path from 'path';
import { YoutubeApiProvider } from './services/YoutubeApiProvider';
import { loadConfig } from './config/AppConfig';

const config = loadConfig();

const YOUTUBE_API_KEY = config.youtubeApiKey || '';
const ALANZOKA_CHANNEL_ID = config.youtubeChannelId;

async function debugYoutube() {
    console.log("=== YOUTUBE API DEBUG (Alanzoka Channel via Provider) ===");

    if (!YOUTUBE_API_KEY) {
        console.error("ERROR: YOUTUBE_API_KEY not found in environment.");
        return;
    }

    const gameTitle = "YAPYAP";

    // Use the concrete YoutubeApiProvider (which implements IVideoProvider)
    const youtubeProvider = new YoutubeApiProvider(YOUTUBE_API_KEY, ALANZOKA_CHANNEL_ID);

    try {
        console.log(`\nSearching for "${gameTitle}" via Provider...`);
        const results = await youtubeProvider.getVideosForGame(gameTitle);

        const outputPath = path.resolve(__dirname, '../data/debug/youtube_debug.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify({ gameTitle, results }, null, 2));

        console.log(`\nFull debug data saved to: ${outputPath}`);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error running debug script:", errorMessage);
    }
}

debugYoutube().catch(console.error);
