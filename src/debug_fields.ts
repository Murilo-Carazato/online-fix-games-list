import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.IGDB_CLIENT_ID;
const CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET;

async function debugFields() {
    console.log("=== IGDB FULL FIELDS DEBUG ===");

    // 1. Authenticate
    const authRes = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`);
    const accessToken = authRes.data.access_token;

    // 2. Fetch Cyberpunk 2077 with ALL fields (*)
    const query = `
      search "Cyberpunk 2077"; 
      fields *; 
      limit 1;
    `;

    const response = await axios.post('https://api.igdb.com/v4/games', query, {
        headers: {
            'Client-ID': CLIENT_ID!,
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'text/plain'
        }
    });

    console.log(JSON.stringify(response.data[0], null, 2));
}

debugFields().catch(console.error);
