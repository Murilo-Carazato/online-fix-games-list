import { eq } from "drizzle-orm";
import { db } from "../database/config";
import { gamePreferences } from "../database/config/schema";
import { IGamePreferenceRepository } from "../../domain/repositories/IGamePreferenceRepository";
import { ILoggerService } from "../../domain/services/ILoggerService";
import { Result } from "../../domain/common/Result";
import { Failure, StorageFailure } from "../../domain/common/Failure";

type GamePreference = { title: string; wantToPlay: boolean; ignored: boolean };

/**
 * Postgres implementation of IGamePreferenceRepository.
 * Manages user-defined game preferences (wantToPlay, ignored) in the database.
 */
export class PostgresGamePreferenceRepository implements IGamePreferenceRepository {
    constructor(private readonly logger: ILoggerService) { }

    async getPreferences(title: string): Promise<Result<GamePreference, Failure>> {
        try {
            const rows = await db
                .select()
                .from(gamePreferences)
                .where(eq(gamePreferences.title, title))
                .limit(1);

            const row = rows[0] ?? { title, wantToPlay: false, ignored: false };
            return Result.ok({ title: row.title, wantToPlay: row.wantToPlay, ignored: row.ignored });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error fetching preferences for "${title}": ${msg}`);
            return Result.fail(new StorageFailure(`Failed to get preferences: ${msg}`));
        }
    }

    async setWantToPlay(title: string, wantToPlay: boolean): Promise<Result<void, Failure>> {
        try {
            await db.insert(gamePreferences)
                .values({ title, wantToPlay, ignored: wantToPlay ? false : undefined })
                .onConflictDoUpdate({
                    target: gamePreferences.title,
                    set: { wantToPlay, ignored: wantToPlay ? false : undefined, updatedAt: new Date() }
                });
            return Result.ok();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error setting wantToPlay for "${title}": ${msg}`);
            return Result.fail(new StorageFailure(`Failed to update preference: ${msg}`));
        }
    }

    async setIgnored(title: string, ignored: boolean): Promise<Result<void, Failure>> {
        try {
            await db.insert(gamePreferences)
                .values({ title, ignored, wantToPlay: ignored ? false : undefined })
                .onConflictDoUpdate({
                    target: gamePreferences.title,
                    set: { ignored, wantToPlay: ignored ? false : undefined, updatedAt: new Date() }
                });
            return Result.ok();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error setting ignored for "${title}": ${msg}`);
            return Result.fail(new StorageFailure(`Failed to update preference: ${msg}`));
        }
    }
}
