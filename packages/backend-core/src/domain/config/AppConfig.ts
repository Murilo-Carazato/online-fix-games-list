/**
 * The AppConfig interface defines the configuration contract for the data pipeline.
 * Kept in core-domain so that infrastructure/factories can depend on it
 * without introducing circular dependencies.
 */
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
