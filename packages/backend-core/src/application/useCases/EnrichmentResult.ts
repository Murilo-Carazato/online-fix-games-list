/**
 * Result returned by the EnrichGamesUseCase after processing a batch.
 * Replaces the previous void return, giving callers meaningful outcome data.
 */
export interface EnrichmentResult {
    processed: number;
    enriched: number;
    failed: number;
}
