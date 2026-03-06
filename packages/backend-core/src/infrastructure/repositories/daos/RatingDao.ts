import { db } from "../../database/config";
import { eq } from "drizzle-orm";
import { ratingCategories, gameRatings } from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

export class RatingDao {
    static async save(gameId: number, ratings: EnrichedGameDbModel["ratings"]): Promise<void> {
        if (!ratings.length) return;

        const rows = await Promise.all(ratings.map(async (r) => {
            await db.insert(ratingCategories).values({ title: r.title.toLowerCase(), score: r.score ?? 0 }).onConflictDoNothing();
            const [category] = await db.select({ id: ratingCategories.id })
                .from(ratingCategories).where(eq(ratingCategories.title, r.title.toLowerCase()));
            return { gameId, ratingCategoryId: category.id, count: r.count, percent: r.percent };
        }));

        if (rows.length) await db.insert(gameRatings).values(rows);
    }
}
