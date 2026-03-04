import { IGameDataProvider } from '../../domain/interfaces/IGameDataProvider';
import { IgdbApiProvider } from '../api/IgdbApiProvider';
import { RawgApiProvider } from '../api/RawgApiProvider';
import { YoutubeApiProvider } from '../api/YoutubeApiProvider';
import { CompositeGameDataProvider } from '../providers/CompositeGameDataProvider';
import { GameDataMerger } from '../../domain/services/GameDataMerger';
import { AppConfig } from '../../config/AppConfig';

export class GameProviderFactory {
    public static createProvider(config: AppConfig): IGameDataProvider {
        if (config.apiProvider === 'composite') {
            if (!config.rawgApiKey || !config.igdbClientId || !config.igdbClientSecret) {
                throw new Error("RAWG_API_KEY, IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set to use the composite provider.");
            }

            const rawg = new RawgApiProvider(config.rawgApiKey);
            const igdb = new IgdbApiProvider(config.igdbClientId, config.igdbClientSecret);
            const youtube = new YoutubeApiProvider(config.youtubeApiKey, config.youtubeChannelId);
            const merger = new GameDataMerger();

            console.log("Configured to use: COMPOSITE API (IGDB + RAWG + Youtube)");
            return new CompositeGameDataProvider(igdb, rawg, youtube, merger);

        } else if (config.apiProvider === 'rawg') {
            if (!config.rawgApiKey) {
                throw new Error("RAWG_API_KEY must be set in environment variables to use the RAWG provider.");
            }
            console.log("Configured to use: RAWG API");
            return new RawgApiProvider(config.rawgApiKey);

        } else {
            if (!config.igdbClientId || !config.igdbClientSecret) {
                throw new Error("IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set to use the IGDB provider.");
            }
            console.log("Configured to use: IGDB API");
            return new IgdbApiProvider(config.igdbClientId, config.igdbClientSecret);
        }
    }
}

