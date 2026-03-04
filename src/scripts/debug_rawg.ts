import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from '../config/AppConfig';

const config = loadConfig();
const RAWG_API_KEY = config.rawgApiKey || '';

async function debugRawgFields() {
    console.log("=== RAWG FULL FIELDS DEBUG (Saving to File) ===");

    if (!RAWG_API_KEY) {
        console.error("ERROR: RAWG_API_KEY not found in environment.");
        return;
    }

    const searchTerm = "REANIMAL";
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(searchTerm)}&page_size=1`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.results && response.data.results.length > 0) {
            const data = response.data.results[0];
            const outputPath = path.resolve(__dirname, '../../data/debug/rawg_full_debug.json');
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`Full data saved to: ${outputPath}`);
        } else {
            console.log("No results found.");
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Error fetching from RAWG:", errorMessage);
    }
}

debugRawgFields().catch(console.error);
