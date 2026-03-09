import { db } from '../config/index';
import { games } from '../config/schema';
import { TitleCleanerService } from '../../../domain/services/TitleCleanerService';
import { ConsoleLoggerService } from '../../logging/ConsoleLoggerService';
import { inArray, eq } from 'drizzle-orm';

async function main() {
    const logger = new ConsoleLoggerService();
    const cleaner = new TitleCleanerService();

    logger.info('Starting DB Duplicate Cleanup...');

    // 1. Fetch all games
    const allGames = await db.select({
        id: games.id,
        title: games.title,
        baseTitle: games.baseTitle,
        uploadDate: games.uploadDate
    }).from(games);

    logger.info(`Fetched ${allGames.length} games from database.`);

    // 2. Group by cleaned title
    const grouped = new Map<string, typeof allGames>();
    for (const game of allGames) {
        const cleaned = cleaner.clean(game.title);
        if (!grouped.has(cleaned)) {
            grouped.set(cleaned, []);
        }
        grouped.get(cleaned)!.push(game);
    }

    logger.info(`Found ${grouped.size} unique base titles.`);

    // 3. Process groups
    let deletedCount = 0;
    let updatedCount = 0;

    for (const [cleanTitle, group] of grouped.entries()) {
        // Sort by uploadDate descending (newest first)
        group.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

        const keep = group[0]; // The newest one to keep
        const toDeleteIds = group.slice(1).map(g => g.id);

        if (toDeleteIds.length > 0) {
            logger.info(`[${cleanTitle}] Duplicates found: keeping ID ${keep.id}, deleting IDs: ${toDeleteIds.join(', ')}`);
            await db.delete(games).where(inArray(games.id, toDeleteIds));
            deletedCount += toDeleteIds.length;
        }

        // Update the kept row if its baseTitle is incorrect
        if (keep.baseTitle !== cleanTitle) {
            await db.update(games)
                .set({ baseTitle: cleanTitle })
                .where(eq(games.id, keep.id));
            updatedCount++;
        }
    }

    logger.info(`Cleanup complete! Deleted ${deletedCount} duplicates. Updated ${updatedCount} baseTitles.`);
    process.exit(0);
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
