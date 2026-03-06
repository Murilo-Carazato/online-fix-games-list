import { eq, ilike, desc, asc, and, or, isNull, sql, inArray } from "drizzle-orm";
import { db } from "../database/config";
import {
    games, gameGenres, gameThemes, gameGameModes, gamePlatformVersions, gameFranchises,
    gameLanguages, gameLanguageSupports, gameExternalLinks, screenshots as screenshotsTable,
    gameRatings, gameAddedStats, igdbVideos, alanzokaVideos, videos as videosTable,
    genres, themes, gameModes, platforms, platformVersions, franchises, languages, languageSupportTypes,
    stores, ratingCategories
} from "../database/config/schema";
import { EnrichedGameEntity } from "../../domain/entities/EnrichedGameEntity";
import { HydraGameEntity } from "../../domain/entities/HydraGameEntity";
import { IGameRepository } from "../../domain/repositories/IGameRepository";
import { ILoggerService } from "../../domain/services/ILoggerService";
import { GameMapper, JoinedGameDbRow } from "../mappers/GameMapper";
import { Result } from "../../domain/common/Result";
import { Failure, StorageFailure } from "../../domain/common/Failure";
import { EnrichedGameDbModel } from "../database/models/EnrichedGameDbModel";

export type SortKey = 'date' | 'rating' | 'popularity' | 'title' | 'playtime';
export type FilterKey = 'all';

export interface PaginatedQueryProps {
    limit?: number;
    offset?: number;
    search?: string;
    filter?: FilterKey;
    sort?: SortKey;
    sortDirection?: 'asc' | 'desc';
}

export class PostgresGameRepository implements IGameRepository {
    constructor(private readonly logger: ILoggerService) { }

    // ─── WRITES ───────────────────────────────────────────────────────────────

    async saveGames(gameEntities: EnrichedGameEntity[]): Promise<Result<void, StorageFailure>> {
        if (!gameEntities?.length) return Result.ok();

        try {
            for (const entity of gameEntities) {
                await db.transaction(async () => {
                    await this.saveEntityRelations(entity);
                });
            }
            this.logger.info(`[Repository] Saved ${gameEntities.length} game(s) to the relational schema.`);
            return Result.ok();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error saving games to Postgres: ${msg}`);
            return Result.fail(new StorageFailure(`Failed to save games: ${msg}`));
        }
    }

    private async saveEntityRelations(entity: EnrichedGameEntity): Promise<void> {
        const dbData = GameMapper.toDb(entity);

        // 1. Upsert the core game row and retrieve the surrogate ID
        let gameId: number;
        const [existing] = await db.select({ id: games.id }).from(games).where(eq(games.title, dbData.core.title));

        if (existing) {
            await db.update(games).set(dbData.core).where(eq(games.id, existing.id));
            gameId = existing.id;
        } else {
            const [inserted] = await db.insert(games).values(dbData.core).returning({ id: games.id });
            gameId = inserted.id;
        }

        // 2. Clear all existing relation rows linked by gameId
        await Promise.all([
            db.delete(gameGenres).where(eq(gameGenres.gameId, gameId)),
            db.delete(gameThemes).where(eq(gameThemes.gameId, gameId)),
            db.delete(gameGameModes).where(eq(gameGameModes.gameId, gameId)),
            db.delete(gamePlatformVersions).where(eq(gamePlatformVersions.gameId, gameId)),
            db.delete(gameFranchises).where(eq(gameFranchises.gameId, gameId)),
            db.delete(gameLanguages).where(eq(gameLanguages.gameId, gameId)), // Cascades to gameLanguageSupports
            db.delete(gameExternalLinks).where(eq(gameExternalLinks.gameId, gameId)),
            db.delete(screenshotsTable).where(eq(screenshotsTable.gameId, gameId)),
            db.delete(gameRatings).where(eq(gameRatings.gameId, gameId)),
            db.delete(gameAddedStats).where(eq(gameAddedStats.gameId, gameId)),
            db.delete(videosTable).where(eq(videosTable.gameId, gameId)), // Cascades to igdb_videos and alanzoka_videos
        ]);

        // 3. Re-insert lookup-linked join tables
        await Promise.all([
            this.saveLookupJoins(gameId, dbData.genres, genres, gameGenres, 'genreId'),
            this.saveLookupJoins(gameId, dbData.themes, themes, gameThemes, 'themeId'),
            this.saveLookupJoins(gameId, dbData.gameModes, gameModes, gameGameModes, 'gameModeId'),
            this.saveLookupJoins(gameId, dbData.franchises, franchises, gameFranchises, 'franchiseId'),
            this.savePlatforms(gameId, dbData.platforms),
            this.saveLanguageSupports(gameId, dbData.languageSupports),
            this.saveExternalLinks(gameId, dbData.externalLinks),
            this.saveScreenshots(gameId, dbData.screenshots),
            this.saveRatings(gameId, dbData.ratings),
            this.saveAddedStats(gameId, dbData.addedStats),
            this.saveVideos(gameId, dbData.igdbVideos, dbData.alanzokaVideos),
        ]);
    }

    private async saveLookupJoins(
        gameId: number,
        names: string[],
        lookupTable: typeof genres | typeof themes | typeof gameModes | typeof franchises,
        joinTable: typeof gameGenres | typeof gameThemes | typeof gameGameModes | typeof gameFranchises,
        fkField: 'genreId' | 'themeId' | 'gameModeId' | 'franchiseId'
    ): Promise<void> {
        if (!names.length) return;

        await Promise.all(names.map(name =>
            db.insert(lookupTable).values({ name }).onConflictDoNothing()
        ));
        const rows = await db.select({ id: lookupTable.id, name: lookupTable.name })
            .from(lookupTable)
            .where(inArray(lookupTable.name, names));

        const joinValues = rows.map((row: { id: number, name: string }) => ({ gameId, [fkField]: row.id }));
        if (joinValues.length) await db.insert(joinTable).values(joinValues);
    }

    // Complex 1:N relations

    private async savePlatforms(gameId: number, platformsData: EnrichedGameDbModel["platforms"]): Promise<void> {
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

    private async saveLanguageSupports(gameId: number, supports: EnrichedGameDbModel["languageSupports"]): Promise<void> {
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

    private async saveExternalLinks(gameId: number, values: EnrichedGameDbModel["externalLinks"]): Promise<void> {
        if (values.length) {
            const mapped = values.map(v => ({ gameId, storeId: v.storeId, url: v.url }));
            await db.insert(gameExternalLinks).values(mapped);
        }
    }

    private async saveScreenshots(gameId: number, values: EnrichedGameDbModel["screenshots"]): Promise<void> {
        if (values.length) {
            const mapped = values.map(v => ({ gameId, url: v.url }));
            await db.insert(screenshotsTable).values(mapped);
        }
    }

    private async saveRatings(gameId: number, ratings: EnrichedGameDbModel["ratings"]): Promise<void> {
        if (!ratings.length) return;

        const rows = await Promise.all(ratings.map(async (r) => {
            await db.insert(ratingCategories).values({ title: r.title.toLowerCase(), score: r.score ?? 0 }).onConflictDoNothing();
            const [category] = await db.select({ id: ratingCategories.id })
                .from(ratingCategories).where(eq(ratingCategories.title, r.title.toLowerCase()));
            return { gameId, ratingCategoryId: category.id, count: r.count, percent: r.percent };
        }));

        if (rows.length) await db.insert(gameRatings).values(rows);
    }

    private async saveAddedStats(gameId: number, values: EnrichedGameDbModel["addedStats"]): Promise<void> {
        if (values) await db.insert(gameAddedStats).values({ gameId, ...values });
    }

    private async saveVideos(gameId: number, igdbRows: EnrichedGameDbModel["igdbVideos"], alanzokaRows: EnrichedGameDbModel["alanzokaVideos"]): Promise<void> {
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

    // ─── READS ────────────────────────────────────────────────────────────────

    async getGames(titles: string[]): Promise<EnrichedGameEntity[]> {
        if (!titles.length) return [];
        const rows = await db.select().from(games).where(inArray(games.title, titles));
        return Promise.all(rows.map((r: { id: number, title: string }) => this.loadFullEntity(r.id, r.title)));
    }

    async getGamesPaginated(props: PaginatedQueryProps = {}): Promise<EnrichedGameEntity[]> {
        const { limit = 50, offset = 0, search, filter = 'all', sort = 'date', sortDirection = 'desc' } = props;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orderMap: Record<SortKey, any> = {
            date: games.uploadDate,
            rating: games.totalRating,
            popularity: games.addedTotal,
            title: games.title,
            playtime: games.playtime,
        };

        let query = db
            .select({ id: games.id, title: games.title })
            .from(games)
            .$dynamic();

        if (search) query = query.where(ilike(games.title, `%${search}%`));

        const orderFn = sortDirection === 'asc' ? asc : desc;
        query = query.orderBy(orderFn(orderMap[sort])).limit(limit).offset(offset);

        const rows = await query;
        return Promise.all(rows.map((r: { id: number, title: string }) => this.loadFullEntity(r.id, r.title)));
    }

    async getGlobalStats() {
        const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(games);
        return { total };
    }

    /**
     * Hydrates a full entity for one game by joining all related tables in parallel.
     */
    private async loadFullEntity(gameId: number, title: string): Promise<EnrichedGameEntity> {
        const [gameRow] = await db.select().from(games).where(eq(games.id, gameId));

        if (!gameRow) {
            return new EnrichedGameEntity(new HydraGameEntity('', title, new Date().toISOString()));
        }

        const [genreRows, themeRows, modeRows, platformRows, franchiseRows,
            langRows, linkRows, shotRows, ratingRows, [statsRow], igdbRows, alanRows] = await Promise.all([
                db.select({ name: genres.name }).from(gameGenres)
                    .innerJoin(genres, eq(genres.id, gameGenres.genreId)).where(eq(gameGenres.gameId, gameId)),
                db.select({ name: themes.name }).from(gameThemes)
                    .innerJoin(themes, eq(themes.id, gameThemes.themeId)).where(eq(gameThemes.gameId, gameId)),
                db.select({ name: gameModes.name }).from(gameGameModes)
                    .innerJoin(gameModes, eq(gameModes.id, gameGameModes.gameModeId)).where(eq(gameGameModes.gameId, gameId)),
                db.select({ platformName: platforms.name, versionName: platformVersions.name }).from(gamePlatformVersions)
                    .innerJoin(platformVersions, eq(platformVersions.id, gamePlatformVersions.platformVersionId))
                    .innerJoin(platforms, eq(platforms.id, platformVersions.platformId))
                    .where(eq(gamePlatformVersions.gameId, gameId)),
                db.select({ name: franchises.name }).from(gameFranchises)
                    .innerJoin(franchises, eq(franchises.id, gameFranchises.franchiseId)).where(eq(gameFranchises.gameId, gameId)),
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
                db.select({ url: screenshotsTable.url }).from(screenshotsTable).where(eq(screenshotsTable.gameId, gameId)),
                db.select({ title: ratingCategories.title, score: ratingCategories.score, count: gameRatings.count, percent: gameRatings.percent })
                    .from(gameRatings)
                    .innerJoin(ratingCategories, eq(ratingCategories.id, gameRatings.ratingCategoryId))
                    .where(eq(gameRatings.gameId, gameId)),
                db.select().from(gameAddedStats).where(eq(gameAddedStats.gameId, gameId)),
                db.select({ url: videosTable.url }).from(igdbVideos)
                    .innerJoin(videosTable, eq(videosTable.id, igdbVideos.videoId))
                    .where(eq(videosTable.gameId, gameId)),
                db.select({
                    url: videosTable.url,
                    title: alanzokaVideos.title,
                    publishedAt: alanzokaVideos.publishedAt,
                    thumbnailUrl: alanzokaVideos.thumbnailUrl,
                    channelTitle: alanzokaVideos.channelTitle
                }).from(alanzokaVideos)
                    .innerJoin(videosTable, eq(videosTable.id, alanzokaVideos.videoId))
                    .where(eq(videosTable.gameId, gameId)),
            ]);

        // Group rows back into hierarchical shapes expected by JoinedGameDbRow
        const platMap = new Map<string, Set<string>>();
        for (const p of platformRows) {
            if (!platMap.has(p.platformName)) platMap.set(p.platformName, new Set());
            platMap.get(p.platformName)!.add(p.versionName);
        }
        const mappedPlatforms = Array.from(platMap.entries()).map(([name, versionsSet]) => ({
            name,
            versions: Array.from(versionsSet)
        }));

        const langMap = new Map<string, Set<string>>();
        for (const ls of langRows) {
            if (!langMap.has(ls.language)) langMap.set(ls.language, new Set());
            langMap.get(ls.language)!.add(ls.supportType);
        }
        const mappedLanguageSupports = Array.from(langMap.entries()).map(([language, types]) => ({
            language,
            supportTypes: Array.from(types)
        }));

        const rowParams: JoinedGameDbRow = {
            game: gameRow,
            genres: genreRows.map((r: { name: string }) => r.name),
            themes: themeRows.map((r: { name: string }) => r.name),
            modes: modeRows.map((r: { name: string }) => r.name),
            platforms: mappedPlatforms,
            franchises: franchiseRows.map((r: { name: string }) => r.name),
            languageSupports: mappedLanguageSupports,
            externalLinks: linkRows,
            screenshots: shotRows.map((r: { url: string }) => r.url),
            ratings: ratingRows,
            addedStats: statsRow ?? null,
            igdbVideos: igdbRows.map((r: { url: string }) => r.url),
            alanzokaVideos: alanRows,
        };

        return GameMapper.toDomain(rowParams);
    }
}
