import { eq, ilike, desc, asc, inArray, between, exists, and, or, sql } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import { db } from "../database/config";
import { games, gameGenres, genres, gameThemes, themes, gameGameModes, gameModes, gameLanguages, languages, gameExternalLinks, stores, alanzokaVideos, videos, screenshots } from "../database/config/schema";
import { LookupJoinDao, LookupRelation } from "./daos/LookupJoinDao";
import { PlatformDao } from "./daos/PlatformDao";
import { LanguageDao } from "./daos/LanguageDao";
import { ExternalLinkDao } from "./daos/ExternalLinkDao";
import { ScreenshotDao } from "./daos/ScreenshotDao";
import { AddedStatsDao } from "./daos/AddedStatsDao";
import { RatingDao } from "./daos/RatingDao";
import { VideoDao } from "./daos/VideoDao";
import { GameWriteDao } from "./daos/GameWriteDao";
import { GameQueryAssembler } from "./assemblers/GameQueryAssembler";
import { EnrichedGameEntity } from "../../domain/entities/EnrichedGameEntity";
import { IGameRepository, PaginatedQueryProps, SortKey, FilterOptions } from "../../domain/repositories/IGameRepository";
import { ILoggerService } from "../../domain/services/ILoggerService";
import { GameMapper } from "../mappers/GameMapper";
import { Result } from "../../domain/common/Result";
import { StorageFailure, NotFoundFailure } from "../../domain/common/Failure";
import { EnrichedGameDbModel } from "../database/models/EnrichedGameDbModel";
import { ITitleCleanerService } from "../../domain/services/ITitleCleanerService";

export class PostgresGameRepository implements IGameRepository {
    private gameMapper: GameMapper;

    constructor(
        private readonly logger: ILoggerService,
        titleCleaner: ITitleCleanerService
    ) {
        this.gameMapper = new GameMapper(titleCleaner);
    }

    // ─── WRITES ───────────────────────────────────────────────────────────────

    async saveGames(gameEntities: EnrichedGameEntity[]): Promise<Result<void, StorageFailure>> {
        if (!gameEntities?.length) return Result.ok();

        try {
            const titles = gameEntities.map(g => g.title);
            const existingResult = await this.getGames(titles);

            // Build a lookup map from existing entities for O(1) dirty checking
            const existingMap = new Map<string, EnrichedGameEntity>();
            if (existingResult.isSuccess) {
                for (const existing of existingResult.getValue()) {
                    existingMap.set(existing.title, existing);
                }
            }

            let savedCount = 0;
            for (const entity of gameEntities) {
                const existing = existingMap.get(entity.title);

                // Skip unchanged entities — dirty check delegates to the domain entity
                if (!existing || entity.hasChanges(existing)) {
                    await db.transaction(async () => {
                        await this.saveEntityRelations(entity);
                    });
                    savedCount++;
                }
            }

            this.logger.info(
                `[Repository] Skipped ${gameEntities.length - savedCount} unchanged game(s). Saved ${savedCount} game(s).`
            );
            return Result.ok();

        } catch (error: unknown) {
            console.error(error); // DEBUG
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error saving games to Postgres: ${msg}`);
            return Result.fail(new StorageFailure(`Failed to save games: ${msg}`));
        }

    }

    private async saveEntityRelations(entity: EnrichedGameEntity): Promise<void> {
        const dbData: EnrichedGameDbModel = this.gameMapper.toDb(entity);

        // 1. Upsert core `games` row — retrieve the surrogate PK
        const gameId = await GameWriteDao.upsertCore(dbData.core);

        // 2. Delete all stale relation rows (FK cascades handle deep children)
        await GameWriteDao.clearRelations(gameId);

        // 3. Re-insert fresh relation rows via their dedicated DAOs
        await Promise.all([
            LookupJoinDao.save(LookupRelation.Genres, gameId, dbData.genres),
            LookupJoinDao.save(LookupRelation.Themes, gameId, dbData.themes),
            LookupJoinDao.save(LookupRelation.GameModes, gameId, dbData.gameModes),
            LookupJoinDao.save(LookupRelation.Franchises, gameId, dbData.franchises),
            PlatformDao.save(gameId, dbData.platforms),
            LanguageDao.save(gameId, dbData.languageSupports),
            ExternalLinkDao.save(gameId, dbData.externalLinks),
            ScreenshotDao.save(gameId, dbData.screenshots),
            RatingDao.save(gameId, dbData.ratings),
            AddedStatsDao.save(gameId, dbData.addedStats),
            VideoDao.save(gameId, dbData.igdbVideos, dbData.alanzokaVideos),
        ]);
    }

    // ─── READS ────────────────────────────────────────────────────────────────

    async getEnrichedTitles(): Promise<Result<Set<string>, StorageFailure>> {
        try {
            const rows = await db
                .select({ title: games.title })
                .from(games)
                .where(sql`${games.igdbId} IS NOT NULL`);

            return Result.ok(new Set(rows.map(r => r.title)));
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return Result.fail(new StorageFailure(`Failed to read enriched titles: ${msg}`));
        }
    }

    async getGames(titles: string[]): Promise<Result<EnrichedGameEntity[], StorageFailure>> {
        if (!titles.length) return Result.ok([]);

        try {
            const rows = await db
                .select({ id: games.id, title: games.title })
                .from(games)
                .where(inArray(games.title, titles));

            const results = await Promise.all(
                rows.map((r: { id: number; title: string }) => this.hydrateEntity(r.id, r.title))
            );

            // Filter out NotFound entries — partial success is still a valid read
            const entities = results
                .filter(r => r.isSuccess)
                .map(r => r.getValue());

            return Result.ok(entities);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return Result.fail(new StorageFailure(`Failed to read games: ${msg}`));
        }
    }

    async getGamesPaginated(props: PaginatedQueryProps = {}): Promise<Result<{ data: EnrichedGameEntity[]; totalCount: number }, StorageFailure>> {
        const { limit = 50, offset = 0, search, sort = 'date', sortDirection = 'desc', filters } = props;

        // Strictly typed column map — no `any` needed
        const orderMap: Record<SortKey, AnyColumn> = {
            date: games.uploadDate,
            rating: games.totalRating,
            popularity: games.addedTotal,
            title: games.title,
            playtime: games.playtime,
            fileSize: games.fileSizeValue,
        };

        try {
            let query = db
                .select({ id: games.id, title: games.title })
                .from(games)
                .$dynamic();

            const conditions = [];

            if (search) {
                conditions.push(ilike(games.title, `%${search}%`));
            }

            if (filters) {
                if (filters.fileSizeMin !== undefined && filters.fileSizeMax !== undefined) {
                    conditions.push(between(games.fileSizeValue, filters.fileSizeMin, filters.fileSizeMax));
                }
                if (filters.ratingMin !== undefined && filters.ratingMax !== undefined) {
                    conditions.push(between(games.totalRating, filters.ratingMin, filters.ratingMax));
                }
                if (filters.addedByMin !== undefined && filters.addedByMax !== undefined) {
                    conditions.push(between(games.addedTotal, filters.addedByMin, filters.addedByMax));
                }

                if (filters.genres?.length) {
                    conditions.push(
                        exists(
                            db.select({ id: sql`1` }).from(gameGenres)
                                .innerJoin(genres, eq(gameGenres.genreId, genres.id))
                                .where(and(eq(gameGenres.gameId, games.id), inArray(genres.name, filters.genres)))
                        )
                    );
                }

                if (filters.themes?.length) {
                    conditions.push(
                        exists(
                            db.select({ id: sql`1` }).from(gameThemes)
                                .innerJoin(themes, eq(gameThemes.themeId, themes.id))
                                .where(and(eq(gameThemes.gameId, games.id), inArray(themes.name, filters.themes)))
                        )
                    );
                }

                if (filters.gameModes?.length) {
                    conditions.push(
                        exists(
                            db.select({ id: sql`1` }).from(gameGameModes)
                                .innerJoin(gameModes, eq(gameGameModes.gameModeId, gameModes.id))
                                .where(and(eq(gameGameModes.gameId, games.id), inArray(gameModes.name, filters.gameModes)))
                        )
                    );
                }

                if (filters.languages?.length) {
                    conditions.push(
                        exists(
                            db.select({ id: sql`1` }).from(gameLanguages)
                                .innerJoin(languages, eq(gameLanguages.languageId, languages.id))
                                .where(and(eq(gameLanguages.gameId, games.id), inArray(languages.name, filters.languages)))
                        )
                    );
                }

                if (filters.stores?.length) {
                    conditions.push(
                        exists(
                            db.select({ id: sql`1` }).from(gameExternalLinks)
                                .innerJoin(stores, eq(gameExternalLinks.storeId, stores.id))
                                .where(and(eq(gameExternalLinks.gameId, games.id), inArray(stores.name, filters.stores)))
                        )
                    );
                }

                if (filters.hasAlanzoka) {
                    conditions.push(
                        exists(
                            db.select({ id: sql`1` }).from(alanzokaVideos)
                                .innerJoin(videos, eq(alanzokaVideos.videoId, videos.id))
                                .where(eq(videos.gameId, games.id))
                        )
                    );
                }

                if (filters.hasMedia) {
                    conditions.push(
                        or(
                            exists(db.select({ id: sql`1` }).from(screenshots).where(eq(screenshots.gameId, games.id))),
                            exists(db.select({ id: sql`1` }).from(videos).where(eq(videos.gameId, games.id)))
                        )
                    );
                }
            }

            if (conditions.length > 0) {
                query = query.where(and(...conditions));
            }

            const countQuery = db
                .select({ count: sql<number>`count(*)` })
                .from(games)
                .$dynamic();

            if (conditions.length > 0) {
                countQuery.where(and(...conditions));
            }

            const [{ count }] = await countQuery;
            const totalCount = Number(count);

            const orderFn = sortDirection === 'asc' ? asc : desc;
            query = query.orderBy(orderFn(orderMap[sort])).limit(limit).offset(offset);

            const rows = await query;
            const results = await Promise.all(
                rows.map((r: { id: number; title: string }) => this.hydrateEntity(r.id, r.title))
            );

            const entities = results
                .filter(r => r.isSuccess)
                .map(r => r.getValue());

            return Result.ok({ data: entities, totalCount });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return Result.fail(new StorageFailure(`Failed to query paginated games: ${msg}`));
        }
    }

    async getGameById(id: number): Promise<Result<EnrichedGameEntity, StorageFailure | NotFoundFailure>> {
        try {
            const rows = await db
                .select({ title: games.title })
                .from(games)
                .where(eq(games.id, id))
                .limit(1);

            if (!rows.length) {
                return Result.fail(new NotFoundFailure(`Game not found in DB with id=${id}`));
            }

            return this.hydrateEntity(id, rows[0].title);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return Result.fail(new StorageFailure(`Failed to read game by id: ${msg}`));
        }
    }

    /**
     * Hydrates a complete domain entity for one game by delegating all DB
     * queries to {@link GameQueryAssembler} and reconstruction to {@link GameMapper}.
     *
     * Returns a typed {@link NotFoundFailure} when the game row no longer exists,
     * instead of silently returning a shell object that hides the missing data.
     */
    private async hydrateEntity(
        gameId: number,
        title: string,
    ): Promise<Result<EnrichedGameEntity, NotFoundFailure | StorageFailure>> {
        try {
            const row = await GameQueryAssembler.assembleRow(gameId);

            if (!row) {
                return Result.fail(new NotFoundFailure(`Game not found in DB: "${title}" (id=${gameId})`));
            }

            return Result.ok(GameMapper.toDomain(row));
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return Result.fail(new StorageFailure(`Failed to hydrate entity for game "${title}": ${msg}`));
        }
    }

    async getFilterOptions(): Promise<Result<FilterOptions, StorageFailure>> {
        try {
            const [genresRows, themesRows, modesRows, langRows, storesRows] = await Promise.all([
                db.select({ name: genres.name }).from(genres).orderBy(genres.name),
                db.select({ name: themes.name }).from(themes).orderBy(themes.name),
                db.select({ name: gameModes.name }).from(gameModes).orderBy(gameModes.name),
                db.select({ name: languages.name }).from(languages).orderBy(languages.name),
                db.select({ name: stores.name }).from(stores).orderBy(stores.name),
            ]);

            return Result.ok({
                genres: genresRows.map(r => r.name),
                themes: themesRows.map(r => r.name),
                gameModes: modesRows.map(r => r.name),
                languages: langRows.map(r => r.name),
                stores: storesRows.map(r => r.name),
            });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return Result.fail(new StorageFailure(`Failed to get filter options: ${msg}`));
        }
    }
}
