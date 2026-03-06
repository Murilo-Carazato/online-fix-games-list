import { db } from "../../database/config";
import { inArray } from "drizzle-orm";
import {
    genres, themes, gameModes, franchises,
    gameGenres, gameThemes, gameGameModes, gameFranchises,
} from "../../database/config/schema";

/**
 * DAO responsible for all simple M:N lookup-table joins.
 *
 * Each method encapsulates the full upsert-lookup-join sequence for a
 * specific relation, so the Repository never needs to know which
 * intermediate tables are involved.
 */
export class LookupJoinDao {
    static async saveGenres(gameId: number, names: string[]): Promise<void> {
        return LookupJoinDao.persistLookupJoin(gameId, names, genres, gameGenres, 'genreId');
    }

    static async saveThemes(gameId: number, names: string[]): Promise<void> {
        return LookupJoinDao.persistLookupJoin(gameId, names, themes, gameThemes, 'themeId');
    }

    static async saveGameModes(gameId: number, names: string[]): Promise<void> {
        return LookupJoinDao.persistLookupJoin(gameId, names, gameModes, gameGameModes, 'gameModeId');
    }

    static async saveFranchises(gameId: number, names: string[]): Promise<void> {
        return LookupJoinDao.persistLookupJoin(gameId, names, franchises, gameFranchises, 'franchiseId');
    }

    // ─── Private implementation ───────────────────────────────────────────────
    // The generic algorithm lives here, hidden from callers.

    private static async persistLookupJoin(
        gameId: number,
        names: string[],
        lookupTable: typeof genres | typeof themes | typeof gameModes | typeof franchises,
        joinTable: typeof gameGenres | typeof gameThemes | typeof gameGameModes | typeof gameFranchises,
        fkField: 'genreId' | 'themeId' | 'gameModeId' | 'franchiseId',
    ): Promise<void> {
        if (!names.length) return;

        await Promise.all(names.map(name =>
            db.insert(lookupTable).values({ name }).onConflictDoNothing()
        ));

        const rows = await db
            .select({ id: lookupTable.id })
            .from(lookupTable)
            .where(inArray(lookupTable.name, names));

        const joinValues = rows.map((row: { id: number }) => ({ gameId, [fkField]: row.id }));
        if (joinValues.length) await db.insert(joinTable).values(joinValues);
    }
}
