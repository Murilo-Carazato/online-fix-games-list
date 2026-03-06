import { db } from "../../database/config";
import { gameExternalLinks, screenshots as screenshotsTable, gameAddedStats } from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

export class MiscDao {
    static async saveExternalLinks(gameId: number, values: EnrichedGameDbModel["externalLinks"]): Promise<void> {
        if (values.length) {
            const mapped = values.map(v => ({ gameId, storeId: v.storeId, url: v.url }));
            await db.insert(gameExternalLinks).values(mapped);
        }
    }

    static async saveScreenshots(gameId: number, values: EnrichedGameDbModel["screenshots"]): Promise<void> {
        if (values.length) {
            const mapped = values.map(v => ({ gameId, url: v.url }));
            await db.insert(screenshotsTable).values(mapped);
        }
    }

    static async saveAddedStats(gameId: number, values: EnrichedGameDbModel["addedStats"]): Promise<void> {
        if (values) await db.insert(gameAddedStats).values({ gameId, ...values });
    }
}
