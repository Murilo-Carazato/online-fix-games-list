import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const RAWG_API_KEY = process.env.RAWG_API_KEY;

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
            const outputPath = path.resolve(__dirname, '../data/rawg_full_debug.json');
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`Full data saved to: ${outputPath}`);
        } else {
            console.log("No results found.");
        }
    } catch (error) {
        console.error("Error fetching from RAWG:", error);
    }
}

debugRawgFields().catch(console.error);
