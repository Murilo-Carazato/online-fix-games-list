import { IVideoResult } from '../models/Game';

export interface IVideoProvider {
    getVideosForGame(gameTitle: string): Promise<IVideoResult[] | null>;
}
