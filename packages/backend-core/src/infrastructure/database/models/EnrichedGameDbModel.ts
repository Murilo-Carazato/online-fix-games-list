/**
 * Represents a single row in the `enriched_games` table.
 * This model belongs to the Infrastructure layer and decouples
 * the database schema from the Domain Entity.
 */
export interface EnrichedGameDbModel {
    title: string;
    uploadDate: Date;
    totalRating: number | null;
    added: number | null;
    playtime: number | null;
    isEnriched: boolean;
    data: Record<string, unknown>;
    updatedAt: Date;
}
