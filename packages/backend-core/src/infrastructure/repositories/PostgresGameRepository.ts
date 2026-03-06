import { eq, ilike, desc, asc, inArray } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import { db } from "../database/config";
import { games } from "../database/config/schema";
import { LookupJoinDao } from "./daos/LookupJoinDao";
import { PlatformDao } from "./daos/PlatformDao";
import { LanguageDao } from "./daos/LanguageDao";
import { MiscDao } from "./daos/MiscDao";
import { RatingDao } from "./daos/RatingDao";
import { VideoDao } from "./daos/VideoDao";
import { GameWriteDao } from "./daos/GameWriteDao";
import { GameQueryAssembler } from "./daos/GameQueryAssembler";
import { EnrichedGameEntity } from "../../domain/entities/EnrichedGameEntity";
import { IGameRepository, PaginatedQueryProps, SortKey } from "../../domain/repositories/IGameRepository";
import { ILoggerService } from "../../domain/services/ILoggerService";
import { GameMapper } from "../mappers/GameMapper";
import { Result } from "../../domain/common/Result";
import { StorageFailure, NotFoundFailure } from "../../domain/common/Failure";
import { EnrichedGameDbModel } from "../database/models/EnrichedGameDbModel";

export class PostgresGameRepository implements IGameRepository {
    constructor(private readonly logger: ILoggerService) { }

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
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error saving games to Postgres: ${msg}`);
            return Result.fail(new StorageFailure(`Failed to save games: ${msg}`));
        }
    }

    private async saveEntityRelations(entity: EnrichedGameEntity): Promise<void> {
        const dbData: EnrichedGameDbModel = GameMapper.toDb(entity);

        // 1. Upsert core `games` row — retrieve the surrogate PK
        const gameId = await GameWriteDao.upsertCore(dbData.core);

        // 2. Delete all stale relation rows (FK cascades handle deep children)
        await GameWriteDao.clearRelations(gameId);

        // 3. Re-insert fresh relation rows via their dedicated DAOs
        await Promise.all([
            LookupJoinDao.saveGenres(gameId, dbData.genres),
            LookupJoinDao.saveThemes(gameId, dbData.themes),
            LookupJoinDao.saveGameModes(gameId, dbData.gameModes),
            LookupJoinDao.saveFranchises(gameId, dbData.franchises),
            PlatformDao.save(gameId, dbData.platforms),
            LanguageDao.save(gameId, dbData.languageSupports),
            MiscDao.saveExternalLinks(gameId, dbData.externalLinks),
            MiscDao.saveScreenshots(gameId, dbData.screenshots),
            RatingDao.save(gameId, dbData.ratings),
            MiscDao.saveAddedStats(gameId, dbData.addedStats),
            VideoDao.save(gameId, dbData.igdbVideos, dbData.alanzokaVideos),
        ]);
    }

    // ─── READS ────────────────────────────────────────────────────────────────

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

    async getGamesPaginated(props: PaginatedQueryProps = {}): Promise<Result<EnrichedGameEntity[], StorageFailure>> {
        const { limit = 50, offset = 0, search, sort = 'date', sortDirection = 'desc' } = props;

        // Strictly typed column map — no `any` needed
        const orderMap: Record<SortKey, AnyColumn> = {
            date: games.uploadDate,
            rating: games.totalRating,
            popularity: games.addedTotal,
            title: games.title,
            playtime: games.playtime,
        };

        try {
            let query = db
                .select({ id: games.id, title: games.title })
                .from(games)
                .$dynamic();

            if (search) query = query.where(ilike(games.title, `%${search}%`));

            const orderFn = sortDirection === 'asc' ? asc : desc;
            query = query.orderBy(orderFn(orderMap[sort])).limit(limit).offset(offset);

            const rows = await query;
            const results = await Promise.all(
                rows.map((r: { id: number; title: string }) => this.hydrateEntity(r.id, r.title))
            );

            const entities = results
                .filter(r => r.isSuccess)
                .map(r => r.getValue());

            return Result.ok(entities);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            return Result.fail(new StorageFailure(`Failed to query paginated games: ${msg}`));
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
}
