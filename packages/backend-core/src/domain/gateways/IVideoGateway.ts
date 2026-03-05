import { VideoEntity } from '../entities/VideoEntity';

export interface IVideoGateway {
    getVideosForGame(gameTitle: string): Promise<VideoEntity[] | null>;
}
