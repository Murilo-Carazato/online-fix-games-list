import { eq, ilike, desc, asc, and, or, isNull, sql } from "drizzle-orm";
import { db } from "../database";
import { enrichedGames, gamePreferences } from "../database/schema";
import { HydraGameEntity, EnrichedGameEntity } from "../../domain/entities/Game";
import { IGameRepository } from "../../domain/repositories/IGameRepository";

export type SortKey = 'date' | 'rating' | 'popularity' | 'title' | 'playtime';
export type FilterKey = 'all' | 'wantToPlay' | 'ignored' | 'untagged';

export interface PaginatedQueryProps {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: SortKey;
    sortDir?: 'asc' | 'desc';
    filterBy?: FilterKey;
}

export class PostgresGameDataRepository implements IGameRepository {
    async loadGames(path: string): Promise<HydraGameEntity[]> {
        throw new Error("PostgresGameDataRepository.loadGames is not implemented. Use JsonGameRepository to read local files.");
    }

    async saveGames(path: string, games: EnrichedGameEntity[]): Promise<void> {
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
                        uploadDate: sql`excluded.upload_date`,
                        totalRating: sql`excluded.total_rating`,
                        added: sql`excluded.added`,
                        playtime: sql`excluded.playtime`,
                        isEnriched: sql`excluded.is_enriched`,
                        data: sql`excluded.data`,
                        updatedAt: new Date(),
                    }
                });
        }
    }

    async getGamesPaginated({ limit = 50, offset = 0, search = '', sortBy = 'date', sortDir = 'desc', filterBy = 'all' }: PaginatedQueryProps = {}): Promise<EnrichedGameEntity[]> {
        let query = db
            .select({
                data: enrichedGames.data,
                wantToPlay: gamePreferences.wantToPlay,
                ignored: gamePreferences.ignored
            })
            .from(enrichedGames)
            .leftJoin(gamePreferences, eq(enrichedGames.title, gamePreferences.title))
            .$dynamic(); // Required to allow conditional chaining

        const conditions = [];

        if (search.trim()) {
            conditions.push(ilike(enrichedGames.title, `%${search}%`));
        }

        if (filterBy === 'wantToPlay') {
            conditions.push(eq(gamePreferences.wantToPlay, true));
        } else if (filterBy === 'ignored') {
            conditions.push(eq(gamePreferences.ignored, true));
        } else if (filterBy === 'untagged') {
            conditions.push(
                or(
                    isNull(gamePreferences.title),
                    and(
                        eq(gamePreferences.wantToPlay, false),
                        eq(gamePreferences.ignored, false)
                    )
                )
            );
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        const orderFn = sortDir === 'asc' ? asc : desc;
        let orderColumn;

        switch (sortBy) {
            case 'date': orderColumn = enrichedGames.uploadDate; break;
            case 'rating': orderColumn = enrichedGames.totalRating; break;
            case 'popularity': orderColumn = enrichedGames.added; break;
            case 'playtime': orderColumn = enrichedGames.playtime; break;
            case 'title': orderColumn = enrichedGames.title; break;
            default: orderColumn = enrichedGames.uploadDate;
        }

        // Apply ordering with nullsLast for numerical columns so items with null ratings go to the end
        query = query.orderBy(
            sortBy !== 'title' && sortBy !== 'date'
                ? sql`${orderColumn} ${sql.raw(sortDir === 'asc' ? 'ASC' : 'DESC')} NULLS LAST`
                : orderFn(orderColumn)
        );

        query = query.limit(limit).offset(offset);

        // Map the results, combining the nested JSON payload with the current relational user preference state
        const results = await query;
        return results.map(r => ({
            ...(r.data as any),
            wantToPlay: r.wantToPlay ?? false,
            ignored: r.ignored ?? false
        } as EnrichedGameEntity));
    }

    async getGlobalStats(): Promise<{ total: number; wantToPlay: number; ignored: number }> {
        const [{ totalCount }] = await db
            .select({ totalCount: sql<number>`count(*)::int` })
            .from(enrichedGames);

        const [{ wantToPlayCount }] = await db
            .select({ wantToPlayCount: sql<number>`count(*)::int` })
            .from(gamePreferences)
            .where(eq(gamePreferences.wantToPlay, true));

        const [{ ignoredCount }] = await db
            .select({ ignoredCount: sql<number>`count(*)::int` })
            .from(gamePreferences)
            .where(eq(gamePreferences.ignored, true));

        return {
            total: totalCount,
            wantToPlay: wantToPlayCount,
            ignored: ignoredCount,
        };
    }
}
