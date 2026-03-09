import { IGameGateway } from '../../domain/gateways/IGameGateway';
import { IHydraGateway } from '../../domain/gateways/IHydraGateway';
import { IGameRepository } from '../../domain/repositories/IGameRepository';
import { ITitleCleanerService } from '../../domain/services/ITitleCleanerService';
import { IGameDataMergerService } from '../../domain/services/IGameDataMergerService';
import { ILoggerService } from '../../domain/services/ILoggerService';
import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { HydraGameEntity } from '../../domain/entities/HydraGameEntity';
import { Result } from '../../domain/common/Result';
import { Failure } from '../../domain/common/Failure';
import * as fs from 'fs/promises';
import * as path from 'path';

// ─── Params / Response (Value Objects) ───────────────────────────────────────

export class EnrichGamesParams {
    constructor(
        public readonly inputFilePath: string,
        /** Hard cap on number of source games to process (undefined = all). */
        public readonly limit?: number,
        /** Number of games processed in parallel per iteration. Default: 10. */
        public readonly chunkSize: number = 10,
        /**
         * When true (default), games that already have IGDB enrichment data in
         * the DB are skipped — avoiding redundant API calls on re-runs.
         */
        public readonly skipEnriched: boolean = true,
    ) { }
}

export class EnrichGamesResponse {
    constructor(
        public readonly processed: number,
        public readonly enriched: number,
        public readonly failed: number,
        public readonly skipped: number,
    ) { }
}

// ─── Use Case (SRP · OCP · DIP) ──────────────────────────────────────────────

/**
 * Enriches raw Hydra game entries with external data (IGDB / RAWG / YouTube)
 * and persists them to the repository **after each chunk** (checkpoint pattern).
 *
 * Responsibilities:
 *  - Orchestrate gateways and the merger service.
 *  - Persist incrementally so a crash or manual interrupt never loses progress.
 *  - Skip already-enriched titles on re-runs (idempotent by default).
 *
 * The class is open for extension (e.g. a dry-run flag) without touching its
 * core logic, satisfying OCP.
 */
export class EnrichGamesUseCase {
    constructor(
        private readonly gameGateway: IGameGateway,
        private readonly hydraGateway: IHydraGateway,
        private readonly gameRepository: IGameRepository,
        private readonly titleCleaner: ITitleCleanerService,
        private readonly gameDataMerger: IGameDataMergerService,
        private readonly logger: ILoggerService,
    ) { }

    public async execute(params: EnrichGamesParams): Promise<Result<EnrichGamesResponse, Failure>> {
        // ── 1. Load raw source games ──────────────────────────────────────────
        this.logger.info(`Loading games from ${params.inputFilePath}...`);

        const loadResult = await this.hydraGateway.loadGames(params.inputFilePath);
        if (loadResult.isFailure) return Result.fail(loadResult.getError());

        const rawGames = loadResult.getValue();
        this.logger.info(`Loaded ${rawGames.length} source games.`);

        const gamesToProcess = params.limit
            ? rawGames.slice(0, params.limit)
            : rawGames;

        // ── 2. Determine which titles already have enrichment data ────────────
        const alreadyEnriched = await this.resolveEnrichedTitles(params.skipEnriched);

        const skippedCount = this.countSkippable(gamesToProcess, alreadyEnriched);
        const totalToEnrich = gamesToProcess.length - skippedCount;

        this.logger.info(
            `Processing ${gamesToProcess.length} games ` +
            `(${skippedCount} already enriched, ${totalToEnrich} to fetch) ` +
            `in chunks of ${params.chunkSize}.`
        );

        // ── 3. Process + persist one chunk at a time (checkpoint pattern) ─────
        let processedCount = 0;
        let enrichedCount = 0;
        let failedCount = 0;
        let totalSkipped = 0;
        const totalChunks = Math.ceil(gamesToProcess.length / params.chunkSize);
        const failedAttempts: Array<{ title: string, reason: string }> = [];

        for (let i = 0; i < gamesToProcess.length; i += params.chunkSize) {
            const chunk = gamesToProcess.slice(i, i + params.chunkSize);
            const chunkIndex = Math.floor(i / params.chunkSize) + 1;

            const { results, enriched, failed, skipped, failedDetails } =
                await this.processChunk(chunk, alreadyEnriched);

            enrichedCount += enriched;
            failedCount += failed;
            totalSkipped += skipped;
            processedCount += results.length;
            failedAttempts.push(...failedDetails);

            // Persist immediately — progress survives interrupts
            const gamesWithData = results.filter(g => !alreadyEnriched.has(g.title));
            if (gamesWithData.length > 0) {
                const saveResult = await this.gameRepository.saveGames(gamesWithData);
                if (saveResult.isFailure) {
                    this.logger.error(
                        `[Chunk ${chunkIndex}/${totalChunks}] Save failed: ${saveResult.getError().message}`
                    );
                    // Non-fatal: log and continue so remaining chunks are not lost
                } else {
                    this.logger.info(
                        `[Chunk ${chunkIndex}/${totalChunks}] ✓ Saved ${gamesWithData.length} game(s). ` +
                        `(${enrichedCount} enriched, ${failedCount} failed, ${totalSkipped} skipped so far)`
                    );
                }
            } else {
                this.logger.info(
                    `[Chunk ${chunkIndex}/${totalChunks}] All skipped (already enriched).`
                );
            }
        }

        this.logger.info(
            `Done. ${processedCount} processed | ${enrichedCount} enriched | ` +
            `${failedCount} failed | ${totalSkipped} skipped.`
        );

        if (failedAttempts.length > 0) {
            try {
                // Determine a safe logs directory based on the execution context
                const logDir = path.join(process.cwd(), 'logs');
                await fs.mkdir(logDir, { recursive: true });
                const logFile = path.join(logDir, 'failed_enrichments.json');
                await fs.writeFile(logFile, JSON.stringify(failedAttempts, null, 2), 'utf-8');
                this.logger.info(`Wrote ${failedAttempts.length} failed attempts to ${logFile}`);
            } catch (err) {
                this.logger.error(`Failed to write failed attempts log: ${err}`);
            }
        }

        return Result.ok(
            new EnrichGamesResponse(processedCount, enrichedCount, failedCount, totalSkipped)
        );
    }

    // ── Private helpers (SRP cohesion) ────────────────────────────────────────

    /**
     * Returns the set of already-enriched titles, or an empty set when
     * `skipEnriched` is false or the DB query fails (fail-open strategy).
     */
    private async resolveEnrichedTitles(skipEnriched: boolean): Promise<Set<string>> {
        if (!skipEnriched) return new Set();

        const result = await this.gameRepository.getEnrichedTitles();
        if (result.isFailure) {
            this.logger.warn(
                'Could not fetch enriched titles — proceeding without skip optimisation.'
            );
            return new Set();
        }

        const titles = result.getValue();
        this.logger.info(`${titles.size} title(s) already enriched — will be skipped.`);
        return titles;
    }

    private countSkippable(
        games: HydraGameEntity[],
        alreadyEnriched: Set<string>
    ): number {
        return games.filter(g => alreadyEnriched.has(g.title)).length;
    }

    /**
     * Processes a single chunk of games in parallel and returns aggregate stats.
     */
    private async processChunk(
        chunk: HydraGameEntity[],
        alreadyEnriched: Set<string>,
    ): Promise<{
        results: EnrichedGameEntity[];
        enriched: number;
        failed: number;
        skipped: number;
        failedDetails: Array<{ title: string, reason: string }>;
    }> {
        let enriched = 0;
        let failed = 0;
        let skipped = 0;
        const failedDetails: Array<{ title: string, reason: string }> = [];

        const results: EnrichedGameEntity[] = [];

        for (const game of chunk) {
            // Idempotency: skip if already in DB
            if (alreadyEnriched.has(game.title)) {
                skipped++;
                results.push(new EnrichedGameEntity(game));
                continue;
            }

            const cleanTitle = this.titleCleaner.clean(game.title);

            const externalDataRes = await this.gameGateway.getGameDetails(cleanTitle);
            if (externalDataRes.isFailure) {
                const errorMsg = externalDataRes.getError().message;
                this.logger.warn(`[${cleanTitle}] Gateway error: ${errorMsg}`);
                failed++;
                failedDetails.push({ title: game.title, reason: `Gateway error: ${errorMsg}` });
                results.push(new EnrichedGameEntity(game));
                continue;
            }

            const externalData = externalDataRes.getValue();
            if (!externalData) {
                this.logger.warn(`[${cleanTitle}] No external data found.`);
                failed++;
                failedDetails.push({ title: game.title, reason: 'No external data found from API' });
                results.push(new EnrichedGameEntity(game));
                continue;
            }

            const merged = this.gameDataMerger.merge(externalData, game);
            if (!merged) {
                this.logger.warn(`[${cleanTitle}] Merge produced no result.`);
                failed++;
                failedDetails.push({ title: game.title, reason: 'Merge algorithm discarded the data' });
                results.push(new EnrichedGameEntity(game));
                continue;
            }

            this.logger.info(`[${cleanTitle}] ✓ Enriched (rating: ${merged.totalRating ?? 'N/A'})`);
            enriched++;
            results.push(merged);
        }

        return { results, enriched, failed, skipped, failedDetails };
    }
}
