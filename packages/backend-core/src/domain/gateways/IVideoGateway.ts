import { IVideoResult } from '../entities/Game';

export interface IVideoGateway {
    getVideosForGame(gameTitle: string): Promise<IVideoResult[] | null>;
}
