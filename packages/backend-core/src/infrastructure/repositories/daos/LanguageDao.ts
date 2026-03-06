import { db } from "../../database/config";
import { eq } from "drizzle-orm";
import { languages, languageSupportTypes, gameLanguages, gameLanguageSupports } from "../../database/config/schema";
import { EnrichedGameDbModel } from "../../database/models/EnrichedGameDbModel";

export class LanguageDao {
    static async save(gameId: number, supports: EnrichedGameDbModel["languageSupports"]): Promise<void> {
        if (!supports.length) return;

        for (const ls of supports) {
            await db.insert(languages).values({ name: ls.language }).onConflictDoNothing();
            const [lang] = await db.select({ id: languages.id }).from(languages).where(eq(languages.name, ls.language));

            const [gameLang] = await db.insert(gameLanguages).values({ gameId, languageId: lang.id }).returning({ id: gameLanguages.id });

            for (const st of ls.supportTypes) {
                await db.insert(languageSupportTypes).values({ name: st }).onConflictDoNothing();
                const [type] = await db.select({ id: languageSupportTypes.id }).from(languageSupportTypes).where(eq(languageSupportTypes.name, st));
                await db.insert(gameLanguageSupports).values({ gameLanguageId: gameLang.id, supportTypeId: type.id }).onConflictDoNothing();
            }
        }
    }
}
