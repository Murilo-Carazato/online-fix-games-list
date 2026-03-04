import { eq } from "drizzle-orm";
import { db } from "../database";
import { gamePreferences } from "../database/schema";

export class PostgresGameRepository {
    async getPreferences(title: string) {
        const result = await db.select().from(gamePreferences).where(eq(gamePreferences.title, title)).limit(1);
        return result[0] || { title, wantToPlay: false, ignored: false };
    }

    async setWantToPlay(title: string, wantToPlay: boolean) {
        await db.insert(gamePreferences)
            .values({ title, wantToPlay, ignored: wantToPlay ? false : undefined })
            .onConflictDoUpdate({
                target: gamePreferences.title,
                set: { wantToPlay, ignored: wantToPlay ? false : undefined, updatedAt: new Date() }
            });
    }

    async setIgnored(title: string, ignored: boolean) {
        await db.insert(gamePreferences)
            .values({ title, ignored, wantToPlay: ignored ? false : undefined })
            .onConflictDoUpdate({
                target: gamePreferences.title,
                set: { ignored, wantToPlay: ignored ? false : undefined, updatedAt: new Date() }
            });
    }
}

