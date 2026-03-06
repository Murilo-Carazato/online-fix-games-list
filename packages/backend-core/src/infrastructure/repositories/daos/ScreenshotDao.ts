import { db } from "../../database/config";
import { screenshots as screenshotsTable } from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

export class ScreenshotDao {
    static async save(gameId: number, values: EnrichedGameDbModel["screenshots"]): Promise<void> {
        if (values.length) {
            const mapped = values.map(v => ({ gameId, url: v.url }));
            await db.insert(screenshotsTable).values(mapped);
        }
    }
}
