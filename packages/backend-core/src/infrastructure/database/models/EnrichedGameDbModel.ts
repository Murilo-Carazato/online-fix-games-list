/**
 * Value Object representing a single row in the `enriched_games` table.
 * Constructed explicitly by GameMapper.toDbModel() before writing to the database.
 * Lives in the Infrastructure layer — decouples the database schema from Domain Entities.
 */
export class EnrichedGameDbModel {
    constructor(
        public readonly title: string,
        public readonly uploadDate: Date,
        public readonly totalRating: number | null,
        public readonly added: number | null,
        public readonly playtime: number | null,
        public readonly isEnriched: boolean,
        public readonly data: Record<string, unknown>,
        public readonly updatedAt: Date
    ) { }
}
