import { IGameGateway } from '../../domain/gateways/IGameGateway';
import { AppConfig } from '../../domain/config/AppConfig';
import { IgdbGateway } from '../gateways/apis/IgdbGateway';
import { RawgGateway } from '../gateways/apis/RawgGateway';
import { YoutubeGateway } from '../gateways/apis/YoutubeGateway';
import { CompositeGameGateway } from '../gateways/CompositeGameGateway';

export class GameGatewayFactory {
    public static createGateway(config: AppConfig): IGameGateway {
        if (config.apiProvider === 'composite') {
            if (!config.rawgApiKey || !config.igdbClientId || !config.igdbClientSecret) {
                throw new Error("RAWG_API_KEY, IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set to use the composite provider.");
            }

            const rawg = new RawgGateway(config.rawgApiKey);
            const igdb = new IgdbGateway(config.igdbClientId, config.igdbClientSecret);
            const youtube = new YoutubeGateway(config.youtubeApiKey, config.youtubeChannelId);

            console.log("Configured to use: COMPOSITE API (IGDB + RAWG + Youtube)");
            return new CompositeGameGateway(igdb, rawg, youtube);

        } else if (config.apiProvider === 'rawg') {
            if (!config.rawgApiKey) {
                throw new Error("RAWG_API_KEY must be set in environment variables to use the RAWG API.");
            }
            console.log("Configured to use: RAWG API");
            return new RawgGateway(config.rawgApiKey);

        } else {
            if (!config.igdbClientId || !config.igdbClientSecret) {
                throw new Error("IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set to use the IGDB API.");
            }
            console.log("Configured to use: IGDB API");
            return new IgdbGateway(config.igdbClientId, config.igdbClientSecret);
        }
    }
}
