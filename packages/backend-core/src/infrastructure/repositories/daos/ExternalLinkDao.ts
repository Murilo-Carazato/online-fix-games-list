import { db } from "../../database/config";
import { gameExternalLinks } from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

export class ExternalLinkDao {
    static async save(gameId: number, values: EnrichedGameDbModel["externalLinks"]): Promise<void> {
        if (values.length) {
            const mapped = values.map(v => ({ gameId, storeId: v.storeId, url: v.url }));
            await db.insert(gameExternalLinks).values(mapped);
        }
    }
}
