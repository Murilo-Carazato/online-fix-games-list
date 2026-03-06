import { VideoEntity } from '../entities/VideoEntity';

import { Result } from '../common/Result';
import { Failure } from '../common/Failure';

export interface IVideoGateway {
    getVideosForGame(gameTitle: string): Promise<Result<VideoEntity[] | null, Failure>>;
}
