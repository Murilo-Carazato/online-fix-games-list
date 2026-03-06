import { eq, ilike, desc, asc, and, or, isNull, sql } from "drizzle-orm";
import { db } from "../database";
import { enrichedGames, gamePreferences } from "../database/schema";
import { EnrichedGameEntity } from "../../domain/entities/EnrichedGameEntity";
import { HydraGameEntity } from "../../domain/entities/HydraGameEntity";
import { IGameRepository } from "../../domain/repositories/IGameRepository";
import { GameMapper } from "../mappers/GameMapper";
import { Result } from "../../domain/common/Result";
import { StorageFailure } from "../../domain/common/Failure";

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

export class PostgresGameRepository implements IGameRepository {

    async saveGames(games: EnrichedGameEntity[]): Promise<Result<void, StorageFailure>> {
        if (!games || games.length === 0) return Result.ok();

        // Drizzle insert supports arrays for bulk inserts
        // But to avoid transaction limits on very large datasets, we can chunk it
        const chunkSize = 200;

        try {

            for (let i = 0; i < games.length; i += chunkSize) {
                const chunk = games.slice(i, i + chunkSize);

                const values = chunk.map(game => {
                    const dbModel = GameMapper.toDbModel(game);
                    return {
                        title: dbModel.title,
                        uploadDate: dbModel.uploadDate,
                        totalRating: dbModel.totalRating,
                        added: dbModel.added,
                        playtime: dbModel.playtime,
                        isEnriched: dbModel.isEnriched,
                        data: game, // schema expects EnrichedGameEntity via $type<>
                    };
                });

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
            return Result.ok();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error('Error saving games to Postgres:', msg);
            return Result.fail(new StorageFailure(`Failed to save games to DB: ${msg}`));
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

        const results = await query;
        return results.map(r => GameMapper.toDomain({
            ...(r.data as any),
            wantToPlay: r.wantToPlay ?? false,
            ignored: r.ignored ?? false,
        }));
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
