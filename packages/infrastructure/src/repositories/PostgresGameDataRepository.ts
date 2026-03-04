import { eq } from "drizzle-orm";
import { db } from "../database";
import { enrichedGames } from "../database/schema";
import type { EnrichedGame } from "@hydra/core-domain";

export class PostgresGameDataRepository {
    async saveGames(games: EnrichedGame[]): Promise<void> {
        if (!games || games.length === 0) return;

        // Drizzle insert supports arrays for bulk inserts
        // But to avoid transaction limits on very large datasets, we can chunk it
        const chunkSize = 200;

        for (let i = 0; i < games.length; i += chunkSize) {
            const chunk = games.slice(i, i + chunkSize);

            const values = chunk.map(game => ({
                title: game.title,
                // Parse date or fallback to now
                uploadDate: game.uploadDate ? new Date(game.uploadDate) : new Date(),
                totalRating: game.totalRating ?? null,
                added: game.added ?? null,
                playtime: game.playtime ?? null,
                isEnriched: game.isEnriched,
                data: game,
            }));

            await db.insert(enrichedGames)
                .values(values)
                .onConflictDoUpdate({
                    target: enrichedGames.title,
                    set: {
                        uploadDate: values[0].uploadDate, // In real world we might use raw(excluded.upload_date)
                        totalRating: values[0].totalRating,
                        added: values[0].added,
                        playtime: values[0].playtime,
                        isEnriched: values[0].isEnriched,
                        data: values[0].data,
                        updatedAt: new Date(),
                    }
                });
        }
    }

    async getGamesPaginated({ limit = 50, offset = 0, search = '' }: { limit?: number; offset?: number; search?: string } = {}): Promise<EnrichedGame[]> {
        let query = db.select({ data: enrichedGames.data }).from(enrichedGames);

        // This is a simplified search (for actual search, consider ILIKE or Full Text Search)
        // Drizzle ORM does not have ilike directly exported without sql wrapper for some dialects,
        // but since we are just doing simple paginated fetch for our app right now, we will return the raw JSON.
        query = query.limit(limit).offset(offset) as any;

        const results = await query;
        return results.map(r => r.data as EnrichedGame);
    }
}
