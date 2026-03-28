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

// ─── Failure Categorisation ───────────────────────────────────────────────────

/**
 * Represents one logged enrichment failure.
 * `warnings` carries per-source error messages when available.
 */
export interface FailureEntry {
    title: string;
    reason: string;
    warnings?: string[];
}

/**
 * The three log buckets produced by each enrichment run.
 *
 * - apiErrors       → technical errors on primary sources (IGDB/RAWG quota/rate-limit/5xx) — **actionable**
 * - notFoundAll     → game not found in ANY primary source (IGDB + RAWG both returned nothing)
 * - partialNotFound → game found by at least one primary source; another returned "not found"
 *
 * NOTE: YouTube is a supplemental source and its errors DO NOT affect bucket routing.
 * YouTube quota/rate-limit warnings appear inside entry.warnings for context only.
 */
export interface FailureBuckets {
    apiErrors: FailureEntry[];
    notFoundAll: FailureEntry[];
    partialNotFound: FailureEntry[];
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

        const uniqueGames = this.deduplicateGames(rawGames);
        this.logger.info(`Deduplicated: ${uniqueGames.length} unique games remaining.`);

        const gamesToProcess = params.limit
            ? uniqueGames.slice(0, params.limit)
            : uniqueGames;

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

        const buckets: FailureBuckets = { apiErrors: [], notFoundAll: [], partialNotFound: [] };

        for (let i = 0; i < gamesToProcess.length; i += params.chunkSize) {
            const chunk = gamesToProcess.slice(i, i + params.chunkSize);
            const chunkIndex = Math.floor(i / params.chunkSize) + 1;

            const { results, enriched, failed, skipped, chunkBuckets } =
                await this.processChunk(chunk, alreadyEnriched);

            enrichedCount += enriched;
            failedCount += failed;
            totalSkipped += skipped;
            processedCount += results.length;

            buckets.apiErrors.push(...chunkBuckets.apiErrors);
            buckets.notFoundAll.push(...chunkBuckets.notFoundAll);
            buckets.partialNotFound.push(...chunkBuckets.partialNotFound);

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

        await this.writeLogs(buckets);

        return Result.ok(
            new EnrichGamesResponse(processedCount, enrichedCount, failedCount, totalSkipped)
        );
    }

    /**
     * Writes the three categorised failure logs to the `logs/` directory.
     * Each file is fully overwritten on every run (idempotent).
     */
    private async writeLogs(buckets: FailureBuckets): Promise<void> {
        const logDir = path.join(process.cwd(), 'logs');
        try {
            await fs.mkdir(logDir, { recursive: true });
        } catch (err) {
            this.logger.error(`Failed to create logs directory: ${err}`);
            return;
        }

        const files: Array<{ name: string; entries: FailureEntry[] }> = [
            { name: 'api_errors.json', entries: buckets.apiErrors },
            { name: 'not_found_all.json', entries: buckets.notFoundAll },
            { name: 'partial_not_found.json', entries: buckets.partialNotFound },
        ];

        for (const { name, entries } of files) {
            try {
                const filePath = path.join(logDir, name);
                await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
                this.logger.info(`[Logs] Wrote ${entries.length} entries → ${name}`);
            } catch (err) {
                this.logger.error(`Failed to write ${name}: ${err}`);
            }
        }
    }

    // ── Private helpers (SRP cohesion) ────────────────────────────────────────

    /**
     * Returns true when a warning string represents a **technical** failure
     * on a **primary data source** (IGDB or RAWG): quota, rate-limit, 5xx, timeout.
     *
     * YouTube errors are intentionally excluded — YouTube is supplemental and its
     * quota state must not promote a "game not found on IGDB" entry into apiErrors.
     */
    private isPrimaryTechnicalError(warning: string): boolean {
        if (warning.toLowerCase().includes('youtube')) return false;

        const technicalPatterns = [
            'quota exceeded',
            'rate limit',
            '429',
            '502',
            '503',
            '500',
            'request failed with status code',
            'timeout',
        ];
        return technicalPatterns.some(p => warning.toLowerCase().includes(p));
    }

    /**
     * Returns true when a warning is a YouTube-specific technical error
     * (quota exceeded, rate-limit, 429). Used to filter YouTube out of
     * the primary-source classification logic.
     */
    private isYouTubeTechnicalError(warning: string): boolean {
        if (!warning.toLowerCase().includes('youtube')) return false;
        const technicalPatterns = ['quota exceeded', 'rate limit', '429'];
        return technicalPatterns.some(p => warning.toLowerCase().includes(p));
    }

    /**
     * Classifies a list of per-source warnings into the appropriate bucket.
     *
     * Classification is driven exclusively by **primary source** (IGDB / RAWG) outcomes.
     * YouTube quota / rate-limit errors are informational only and appear in the
     * entry's `warnings` field but do NOT influence bucket routing.
     *
     * Priority (primary sources only):
     *  1. Any primary source returned a technical error → `apiErrors`
     *  2. ALL primary sources returned "not found"      → `notFoundAll`
     *  3. Only SOME primary sources returned "not found"→ `partialNotFound`
     *
     * Edge case: if there are NO primary-source warnings at all (e.g. only
     * YouTube errors), the entry goes to `apiErrors` as a precaution.
     */
    private classifyAndPush(
        buckets: FailureBuckets,
        entry: FailureEntry,
        warnings: string[],
    ): void {
        // Strip YouTube-specific technical errors — they don't influence routing
        const primaryWarnings = warnings.filter(w => !this.isYouTubeTechnicalError(w));

        // Edge-case: nothing but YouTube errors — treat as technical/actionable
        if (primaryWarnings.length === 0) {
            buckets.apiErrors.push(entry);
            return;
        }

        // Any primary source (IGDB/RAWG) had a technical failure
        if (primaryWarnings.some(w => this.isPrimaryTechnicalError(w))) {
            buckets.apiErrors.push(entry);
            return;
        }

        // Remaining primary warnings are "not found" type.
        // "notFoundAll" requires that BOTH IGDB and RAWG explicitly returned "not found".
        // Sources that succeed do not generate a warning, so if only one source has a
        // "not found" warning, it means the other source found the game → partialNotFound.
        const notFoundWarnings = primaryWarnings.filter(w =>
            w.toLowerCase().includes('no matching game found') ||
            w.toLowerCase().includes('no matching')
        );

        const igdbNotFound = notFoundWarnings.some(w => w.toLowerCase().includes('igdb'));
        const rawgNotFound = notFoundWarnings.some(w => w.toLowerCase().includes('rawg'));
        const bothNotFound = igdbNotFound && rawgNotFound;

        if (bothNotFound) {
            buckets.notFoundAll.push(entry);
        } else {
            buckets.partialNotFound.push(entry);
        }
    }

    /**
     * Deduplicates the raw list of games based on their cleaned base title.
     * When duplicates are found, keeps the version with the most recent uploadDate.
     */
    private deduplicateGames(games: HydraGameEntity[]): HydraGameEntity[] {
        const uniqueGames = new Map<string, HydraGameEntity>();

        for (const game of games) {
            const baseTitle = this.titleCleaner.clean(game.title);
            const existing = uniqueGames.get(baseTitle);

            if (!existing) {
                uniqueGames.set(baseTitle, game);
            } else {
                const currentDate = game.uploadDate ? new Date(game.uploadDate).getTime() : 0;
                const existingDate = existing.uploadDate ? new Date(existing.uploadDate).getTime() : 0;

                // Keep the newer game
                if (currentDate > existingDate) {
                    uniqueGames.set(baseTitle, game);
                }
            }
        }

        return Array.from(uniqueGames.values());
    }

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
     * Processes a single chunk of games and returns aggregate stats
     * along with pre-classified failure buckets.
     */
    private async processChunk(
        chunk: HydraGameEntity[],
        alreadyEnriched: Set<string>,
    ): Promise<{
        results: EnrichedGameEntity[];
        enriched: number;
        failed: number;
        skipped: number;
        chunkBuckets: FailureBuckets;
    }> {
        let enriched = 0;
        let failed = 0;
        let skipped = 0;
        const chunkBuckets: FailureBuckets = { apiErrors: [], notFoundAll: [], partialNotFound: [] };

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

                // Parse the combined gateway error string into individual source messages
                // so we can correctly classify the failure.
                const gatewayWarnings = errorMsg
                    .split('|')
                    .map(s => s.trim())
                    .filter(Boolean);

                this.classifyAndPush(
                    chunkBuckets,
                    { title: game.title, reason: `Gateway error: ${errorMsg}`, warnings: gatewayWarnings },
                    gatewayWarnings,
                );

                results.push(new EnrichedGameEntity(game));
                continue;
            }

            const externalData = externalDataRes.getValue();
            if (!externalData) {
                this.logger.warn(`[${cleanTitle}] No external data found.`);
                failed++;
                chunkBuckets.notFoundAll.push({ title: game.title, reason: 'No external data found from any API' });
                results.push(new EnrichedGameEntity(game));
                continue;
            }

            const merged = this.gameDataMerger.merge(externalData, game);
            if (!merged) {
                this.logger.warn(`[${cleanTitle}] Merge produced no result.`);
                failed++;
                chunkBuckets.notFoundAll.push({ title: game.title, reason: 'Merge algorithm discarded the data' });
                results.push(new EnrichedGameEntity(game));
                continue;
            }

            this.logger.info(`[${cleanTitle}] ✓ Enriched (rating: ${merged.totalRating ?? 'N/A'})`);
            enriched++;
            results.push(merged);

            // The game was found and enriched.
            // Split warnings by type: technical errors (quota/rate-limit/5xx) go to
            // apiErrors, while "not found" from individual sources go to partialNotFound.
            // A single game may appear in BOTH files if it has both types of warnings.
            if (externalData.warnings && externalData.warnings.length > 0) {
                const techWarnings = externalData.warnings.filter(w => this.isTechnicalWarning(w));
                const notFoundWarnings = externalData.warnings.filter(w => this.isNotFoundWarning(w));

                if (techWarnings.length > 0) {
                    chunkBuckets.apiErrors.push({
                        title: game.title,
                        reason: 'Enriched — but some APIs returned technical errors',
                        warnings: techWarnings,
                    });
                }
                if (notFoundWarnings.length > 0) {
                    chunkBuckets.partialNotFound.push({
                        title: game.title,
                        reason: 'Enriched — but one or more APIs did not find the game',
                        warnings: notFoundWarnings,
                    });
                }
            }
        }

        return { results, enriched, failed, skipped, chunkBuckets };
    }

    /**
     * Returns true if the warning string represents a **technical** API error:
     * quota exceeded, rate limit (429), or server errors (5xx / timeout).
     * Applies to any source — IGDB, RAWG, YouTube, etc.
     */
    private isTechnicalWarning(warning: string): boolean {
        const patterns = [
            'quota exceeded',
            'rate limit',
            '429',
            '502',
            '503',
            '500',
            'request failed with status code',
            'timeout',
        ];
        return patterns.some(p => warning.toLowerCase().includes(p));
    }

    /**
     * Returns true if the warning string represents a "not found" response
     * from a data source (IGDB, RAWG, etc.) — i.e. the game simply was not
     * in that source's database.
     */
    private isNotFoundWarning(warning: string): boolean {
        return (
            warning.toLowerCase().includes('no matching game found') ||
            warning.toLowerCase().includes('no matching')
        );
    }
}

