import { db } from "../../database/config";
import { eq, and } from "drizzle-orm";
import { platforms, platformVersions, gamePlatformVersions } from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

export class PlatformDao {
    static async save(gameId: number, platformsData: EnrichedGameDbModel["platforms"]): Promise<void> {
        if (!platformsData.length) return;

        for (const p of platformsData) {
            await db.insert(platforms).values({ name: p.name }).onConflictDoNothing();
            const [plat] = await db.select({ id: platforms.id }).from(platforms).where(eq(platforms.name, p.name));

            for (const v of p.versions) {
                await db.insert(platformVersions).values({ platformId: plat.id, name: v }).onConflictDoNothing();
                const [ver] = await db.select({ id: platformVersions.id }).from(platformVersions).where(and(eq(platformVersions.platformId, plat.id), eq(platformVersions.name, v)));
                await db.insert(gamePlatformVersions).values({ gameId, platformVersionId: ver.id }).onConflictDoNothing();
            }
        }
    }
}
