import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const CLIENT_ID = process.env.IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;

async function debugFields() {
    console.log("=== IGDB FULL FIELDS DEBUG (Saving to File) ===");

    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error("ERROR: IGDB credentials not found in environment.");
        return;
    }

    // 1. Authenticate
    const authRes = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`);
    const accessToken = authRes.data.access_token;

    // 2. Fetch Cyberpunk 2077 with ALL fields (*)
    const query = `
      search "REANIMAL"; 
      fields *; 
      limit 1;
    `;

    try {
        const response = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': CLIENT_ID!,
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'text/plain'
            }
        });

        if (response.data && response.data.length > 0) {
            const data = response.data[0];
            const outputPath = path.resolve(__dirname, '../data/debug/igdb_full_debug.json');
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`Full IGDB data saved to: ${outputPath}`);
        } else {
            console.log("No results found in IGDB.");
        }
    } catch (error) {
        console.error("Error fetching from IGDB:", error);
    }
}

debugFields().catch(console.error);
