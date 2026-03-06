import { db } from "../../database/config";
import { inArray } from "drizzle-orm";
import {
    genres, themes, gameModes, franchises,
    gameGenres, gameThemes, gameGameModes, gameFranchises,
} from "../../database/config/schema";

// ─── Discriminator ────────────────────────────────────────────────────────────

/**
 * Identifies which M:N lookup relation to persist.
 * The DAO resolves the concrete table pair internally — callers never touch schema.
 */
export enum LookupRelation {
    Genres = 'genres',
    Themes = 'themes',
    GameModes = 'gameModes',
    Franchises = 'franchises',
}

// ─── Internal config map ──────────────────────────────────────────────────────

type RelationConfig = {
    lookupTable: typeof genres | typeof themes | typeof gameModes | typeof franchises;
    joinTable: typeof gameGenres | typeof gameThemes | typeof gameGameModes | typeof gameFranchises;
    fkField: 'genreId' | 'themeId' | 'gameModeId' | 'franchiseId';
};

const RELATION_CONFIG: Record<LookupRelation, RelationConfig> = {
    [LookupRelation.Genres]: { lookupTable: genres, joinTable: gameGenres, fkField: 'genreId' },
    [LookupRelation.Themes]: { lookupTable: themes, joinTable: gameThemes, fkField: 'themeId' },
    [LookupRelation.GameModes]: { lookupTable: gameModes, joinTable: gameGameModes, fkField: 'gameModeId' },
    [LookupRelation.Franchises]: { lookupTable: franchises, joinTable: gameFranchises, fkField: 'franchiseId' },
};

// ─── DAO ──────────────────────────────────────────────────────────────────────

/**
 * Handles all simple M:N lookup-table joins via a single, unified algorithm.
 *
 * The caller passes a {@link LookupRelation} discriminator to identify which
 * relation to persist. The concrete table references are fully encapsulated here —
 * the Repository never needs to know which intermediate tables are involved.
 *
 * DRY: one algorithm. Encapsulation: one place to modify if schema changes.
 */
export class LookupJoinDao {
    static async save(
        relation: LookupRelation,
        gameId: number,
        names: string[],
    ): Promise<void> {
        if (!names.length) return;

        const { lookupTable, joinTable, fkField } = RELATION_CONFIG[relation];

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
