import * as dotenv from 'dotenv';
import * as path from 'path';

export interface AppConfig {
    apiProvider: string;
    rawgApiKey: string;
    igdbClientId: string;
    igdbClientSecret: string;
    youtubeApiKey: string;
    youtubeChannelId: string;
    inputFilePath: string;
    outputFilePath: string;
    enrichmentLimit?: number;
}

export function loadConfig(): AppConfig {
    dotenv.config();

    return {
        apiProvider: process.env.API_PROVIDER || 'composite',
        rawgApiKey: process.env.RAWG_API_KEY || '',
        igdbClientId: process.env.IGDB_CLIENT_ID || '',
        igdbClientSecret: process.env.IGDB_CLIENT_SECRET || '',
        youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
        youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID || 'UCIwspRtKNszHhIhl36gREjQ',
        inputFilePath: process.env.INPUT_FILE_PATH || path.resolve(__dirname, '../../data/onlinefix.json'),
        outputFilePath: process.env.OUTPUT_FILE_PATH || path.resolve(__dirname, '../../data/onlinefix_enriched.json'),
        enrichmentLimit: process.env.ENRICHMENT_LIMIT ? parseInt(process.env.ENRICHMENT_LIMIT, 10) : undefined
    };
}
