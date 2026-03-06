import { db } from "../../database/config";
import { eq } from "drizzle-orm";
import {
    games, genres, themes, gameModes, platforms, platformVersions, franchises,
    languages, languageSupportTypes, stores,
    gameGenres, gameThemes, gameGameModes, gamePlatformVersions, gameFranchises,
    gameLanguages, gameLanguageSupports, gameExternalLinks,
    screenshots as screenshotsTable, gameRatings, gameAddedStats,
    igdbVideos, alanzokaVideos, videos as videosTable, ratingCategories,
} from "../../database/config/schema";
import { JoinedGameDbRow } from "../../database/models/JoinedGameDbRow";

/**
 * Responsible for executing all queries required to reconstruct a single full
 * game entity from its normalised, relational rows.
 *
 * Single Responsibility: this class knows HOW to query — the Repository only
 * decides WHEN to query, and the Mapper decides HOW to reconstruct the Entity.
 */
export class GameQueryAssembler {

    /**
     * Fetches all related rows for a game in parallel and assembles a
     * flat {@link JoinedGameDbRow} ready for the GameMapper.
     */
    static async assembleRow(gameId: number): Promise<JoinedGameDbRow | null> {
        const [gameRow] = await db.select().from(games).where(eq(games.id, gameId));
        if (!gameRow) return null;

        const [genreRows, themeRows, modeRows, platformRows, franchiseRows,
            langRows, linkRows, shotRows, ratingRows, [statsRow], igdbRows, alanRows,
        ] = await Promise.all([
            db.select({ name: genres.name })
                .from(gameGenres).innerJoin(genres, eq(genres.id, gameGenres.genreId))
                .where(eq(gameGenres.gameId, gameId)),

            db.select({ name: themes.name })
                .from(gameThemes).innerJoin(themes, eq(themes.id, gameThemes.themeId))
                .where(eq(gameThemes.gameId, gameId)),

            db.select({ name: gameModes.name })
                .from(gameGameModes).innerJoin(gameModes, eq(gameModes.id, gameGameModes.gameModeId))
                .where(eq(gameGameModes.gameId, gameId)),

            db.select({ platformName: platforms.name, versionName: platformVersions.name })
                .from(gamePlatformVersions)
                .innerJoin(platformVersions, eq(platformVersions.id, gamePlatformVersions.platformVersionId))
                .innerJoin(platforms, eq(platforms.id, platformVersions.platformId))
                .where(eq(gamePlatformVersions.gameId, gameId)),

            db.select({ name: franchises.name })
                .from(gameFranchises).innerJoin(franchises, eq(franchises.id, gameFranchises.franchiseId))
                .where(eq(gameFranchises.gameId, gameId)),

            db.select({ language: languages.name, supportType: languageSupportTypes.name })
                .from(gameLanguages)
                .innerJoin(languages, eq(languages.id, gameLanguages.languageId))
                .innerJoin(gameLanguageSupports, eq(gameLanguageSupports.gameLanguageId, gameLanguages.id))
                .innerJoin(languageSupportTypes, eq(languageSupportTypes.id, gameLanguageSupports.supportTypeId))
                .where(eq(gameLanguages.gameId, gameId)),

            db.select({ storeId: stores.id, storeName: stores.name, domainPattern: stores.domainPattern, url: gameExternalLinks.url })
                .from(gameExternalLinks)
                .innerJoin(stores, eq(stores.id, gameExternalLinks.storeId))
                .where(eq(gameExternalLinks.gameId, gameId)),

            db.select({ url: screenshotsTable.url })
                .from(screenshotsTable).where(eq(screenshotsTable.gameId, gameId)),

            db.select({ title: ratingCategories.title, score: ratingCategories.score, count: gameRatings.count, percent: gameRatings.percent })
                .from(gameRatings)
                .innerJoin(ratingCategories, eq(ratingCategories.id, gameRatings.ratingCategoryId))
                .where(eq(gameRatings.gameId, gameId)),

            db.select().from(gameAddedStats).where(eq(gameAddedStats.gameId, gameId)),

            db.select({ url: videosTable.url })
                .from(igdbVideos)
                .innerJoin(videosTable, eq(videosTable.id, igdbVideos.videoId))
                .where(eq(videosTable.gameId, gameId)),

            db.select({ url: videosTable.url, title: alanzokaVideos.title, publishedAt: alanzokaVideos.publishedAt, thumbnailUrl: alanzokaVideos.thumbnailUrl, channelTitle: alanzokaVideos.channelTitle })
                .from(alanzokaVideos)
                .innerJoin(videosTable, eq(videosTable.id, alanzokaVideos.videoId))
                .where(eq(videosTable.gameId, gameId)),
        ]);

        return {
            game: gameRow,
            genres: genreRows.map((r: { name: string }) => r.name),
            themes: themeRows.map((r: { name: string }) => r.name),
            modes: modeRows.map((r: { name: string }) => r.name),
            platforms: GameQueryAssembler.groupPlatforms(platformRows),
            franchises: franchiseRows.map((r: { name: string }) => r.name),
            languageSupports: GameQueryAssembler.groupLanguageSupports(langRows),
            externalLinks: linkRows,
            screenshots: shotRows.map((r: { url: string }) => r.url),
            ratings: ratingRows,
            addedStats: statsRow ?? null,
            igdbVideos: igdbRows.map((r: { url: string }) => r.url),
            alanzokaVideos: alanRows,
        };
    }

    // ─── Private grouping helpers ─────────────────────────────────────────────

    private static groupPlatforms(
        rows: { platformName: string; versionName: string }[],
    ): { name: string; versions: string[] }[] {
        const map = new Map<string, Set<string>>();
        for (const { platformName, versionName } of rows) {
            if (!map.has(platformName)) map.set(platformName, new Set());
            map.get(platformName)!.add(versionName);
        }
        return Array.from(map.entries()).map(([name, vs]) => ({ name, versions: Array.from(vs) }));
    }

    private static groupLanguageSupports(
        rows: { language: string; supportType: string }[],
    ): { language: string; supportTypes: string[] }[] {
        const map = new Map<string, Set<string>>();
        for (const { language, supportType } of rows) {
            if (!map.has(language)) map.set(language, new Set());
            map.get(language)!.add(supportType);
        }
        return Array.from(map.entries()).map(([language, types]) => ({ language, supportTypes: Array.from(types) }));
    }
}
