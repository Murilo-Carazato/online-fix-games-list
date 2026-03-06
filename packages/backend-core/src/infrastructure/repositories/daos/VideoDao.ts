import { db } from "../../database/config";
import { videos as videosTable, igdbVideos, alanzokaVideos } from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

export class VideoDao {
    static async save(gameId: number, igdbRows: EnrichedGameDbModel["igdbVideos"], alanzokaRows: EnrichedGameDbModel["alanzokaVideos"]): Promise<void> {
        for (const v of igdbRows) {
            const [base] = await db.insert(videosTable).values({ gameId, url: v.url }).returning({ id: videosTable.id });
            await db.insert(igdbVideos).values({ videoId: base.id });
        }

        for (const v of alanzokaRows) {
            const [base] = await db.insert(videosTable).values({ gameId, url: v.url }).returning({ id: videosTable.id });
            await db.insert(alanzokaVideos).values({
                videoId: base.id,
                title: v.title,
                publishedAt: v.publishedAt,
                thumbnailUrl: v.thumbnailUrl,
                channelTitle: v.channelTitle
            });
        }
    }
}
