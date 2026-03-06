import { Result } from '../common/Result';
import { Failure } from '../common/Failure';

/**
 * Domain contract for persisting and querying game user preferences.
 * Implementations write to and read from a database (Postgres).
 */
export interface IGamePreferenceRepository {
    getPreferences(title: string): Promise<Result<{ title: string; wantToPlay: boolean; ignored: boolean }, Failure>>;
    setWantToPlay(title: string, wantToPlay: boolean): Promise<Result<void, Failure>>;
    setIgnored(title: string, ignored: boolean): Promise<Result<void, Failure>>;
}
