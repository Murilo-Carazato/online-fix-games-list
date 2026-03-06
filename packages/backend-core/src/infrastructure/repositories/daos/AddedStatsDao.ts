import { db } from "../../database/config";
import { gameAddedStats } from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

export class AddedStatsDao {
    static async save(gameId: number, values: EnrichedGameDbModel["addedStats"]): Promise<void> {
        if (values) await db.insert(gameAddedStats).values({ gameId, ...values });
    }
}
