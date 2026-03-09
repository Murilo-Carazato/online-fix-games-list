import { eq } from "drizzle-orm";
import { db } from "../../database/config";
import {
    games,
    gameGenres, gameThemes, gameGameModes, gamePlatformVersions, gameFranchises,
    gameLanguages, gameExternalLinks, screenshots as screenshotsTable,
    gameRatings, gameAddedStats, videos as videosTable,
} from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

/**
 * Handles the core write operations for a single game row:
 * - Upsert of the `games` table entry (returns surrogate PK)
 * - Bulk delete of all child relation rows (cascade-safe)
 *
 * Responsibility: "manage the core game row lifecycle" — nothing else.
 * The Repository orchestrates; this DAO executes.
 */
export class GameWriteDao {

    /**
     * Inserts or updates the core `games` row and returns its surrogate PK.
     * Performs a SELECT-first upsert because Postgres ON CONFLICT requires
     * a known unique constraint — title is effectively the natural key here.
     */
    static async upsertCore(core: EnrichedGameDbModel['core']): Promise<number> {
        const [existing] = await db
            .select({ id: games.id })
            .from(games)
            .where(eq(games.baseTitle, core.baseTitle));

        if (existing) {
            await db.update(games).set(core).where(eq(games.id, existing.id));
            return existing.id;
        }

        const [inserted] = await db
            .insert(games)
            .values(core)
            .returning({ id: games.id });

        return inserted.id;
    }

    /**
     * Deletes all child relation rows for the given game.
     * FK ON DELETE CASCADE handles deeper children automatically
     * (e.g. gameLanguageSupports, igdb_videos, alanzoka_videos).
     */
    static async clearRelations(gameId: number): Promise<void> {
        await Promise.all([
            db.delete(gameGenres).where(eq(gameGenres.gameId, gameId)),
            db.delete(gameThemes).where(eq(gameThemes.gameId, gameId)),
            db.delete(gameGameModes).where(eq(gameGameModes.gameId, gameId)),
            db.delete(gamePlatformVersions).where(eq(gamePlatformVersions.gameId, gameId)),
            db.delete(gameFranchises).where(eq(gameFranchises.gameId, gameId)),
            db.delete(gameLanguages).where(eq(gameLanguages.gameId, gameId)),
            db.delete(gameExternalLinks).where(eq(gameExternalLinks.gameId, gameId)),
            db.delete(screenshotsTable).where(eq(screenshotsTable.gameId, gameId)),
            db.delete(gameRatings).where(eq(gameRatings.gameId, gameId)),
            db.delete(gameAddedStats).where(eq(gameAddedStats.gameId, gameId)),
            db.delete(videosTable).where(eq(videosTable.gameId, gameId)),
        ]);
    }
}
