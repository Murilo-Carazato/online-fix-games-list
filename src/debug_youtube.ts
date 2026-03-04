import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from './config/AppConfig';

const config = loadConfig();

const YOUTUBE_API_KEY = config.youtubeApiKey || '';
// Using the handle @alanzoka directly like in the original script
const ALANZOKA_CHANNEL_ID = 'UC3t1i_GvLd_J3j1iO9E5D9Q';

async function debugYoutube() {
    console.log("=== YOUTUBE API DEBUG (Alanzoka Channel) ===");

    if (!YOUTUBE_API_KEY) {
        console.error("ERROR: YOUTUBE_API_KEY not found in environment.");
        return;
    }

    const gameTitle = "YAPYAP";

    try {
        // 1. Verify Channel ID for @alanzoka
        console.log("1. Verifying Channel ID for @alanzoka...");
        const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                key: YOUTUBE_API_KEY,
                forHandle: '@alanzoka',
                part: 'id,snippet'
            }
        });

        const actualChannelId = channelRes.data.items?.[0]?.id;
        console.log(`- Handle @alanzoka resolved to Channel ID: ${actualChannelId}`);

        if (!actualChannelId) {
            console.error("Could not find channel ID for @alanzoka");
            return;
        }

        // 2. Search with channelId filter
        console.log(`\n2. Searching for "${gameTitle}" with channelId filter...`);
        const responseChannel = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: YOUTUBE_API_KEY,
                channelId: actualChannelId,
                q: gameTitle,
                part: 'snippet',
                type: 'video',
                maxResults: 5
            }
        });
        console.log(`- Results with channelId: ${responseChannel.data.items?.length || 0}`);

        // 3. Search globally with "alanzoka" in query
        console.log(`\n3. Searching for "alanzoka ${gameTitle}" globally...`);
        const responseGlobal = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: YOUTUBE_API_KEY,
                q: `alanzoka ${gameTitle}`,
                part: 'snippet',
                type: 'video',
                maxResults: 5
            }
        });
        console.log(`- Global search results: ${responseGlobal.data.items?.length || 0}`);

        const results = {
            channelIdResolved: actualChannelId,
            searchWithChannelId: responseChannel.data,
            searchGlobal: responseGlobal.data
        };

        const outputPath = path.resolve(__dirname, '../data/debug/youtube_debug.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

        console.log(`\nFull debug data saved to: ${outputPath}`);

    } catch (error: any) {
        console.error("Error fetching from YouTube:", error.response?.data || error.message);
    }
}

debugYoutube().catch(console.error);
