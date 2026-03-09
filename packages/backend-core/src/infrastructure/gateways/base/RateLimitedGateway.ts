import { ILoggerService } from '../../../domain/services/ILoggerService';
import { Result } from '../../../domain/common/Result';
import { Failure, ServerFailure } from '../../../domain/common/Failure';


/**
 * Abstract base class for external API gateways requiring rate limiting.
 *
 * Applies the Template Method pattern: subclasses inherit the shared
 * rate-limiting and try/catch skeleton, while implementing the API-specific
 * request logic and error parsing.
 * 
 * STRICT CLEAN ARCH: No HTTP-client specific imports (like Axios) live here.
 */
export abstract class RateLimitedGateway {
    private lastRequestTime = 0;

    protected constructor(
        protected readonly logger: ILoggerService,
        private readonly requestDelayMs: number
    ) { }

    /**
     * Ensures a minimum delay between consecutive requests to respect rate limits.
     */
    protected async delayNextRequest(): Promise<void> {
        const elapsed = Date.now() - this.lastRequestTime;
        if (elapsed < this.requestDelayMs) {
            await new Promise(resolve => setTimeout(resolve, this.requestDelayMs - elapsed));
        }
        this.lastRequestTime = Date.now();
    }

    /**
     * Template method: applies the full rate-limited request lifecycle.
     * Handles delay → execute → Result wrapping → error parsing.
     * Includes exponential backoff for 429 Too Many Requests.
     */
    protected async executeWithRateLimit<T>(
        cleanTitle: string,
        apiName: string,
        operation: () => Promise<T | null>,
        maxRetries: number = 3
    ): Promise<Result<T | null, Failure>> {
        let attempt = 0;
        let lastFailure: Failure | null = null;

        while (attempt <= maxRetries) {
            await this.delayNextRequest();

            try {
                const result = await operation();
                return Result.ok(result);
            } catch (error: unknown) {
                const failure = this.parseError(error, cleanTitle, apiName);
                lastFailure = failure;

                // If it's a Rate Limit Exceeded error (usually 429 from HTTP clients)
                // Implement exponential backoff.
                if (failure.message.includes('429')) {
                    attempt++;
                    if (attempt <= maxRetries) {
                        const backoffMs = this.requestDelayMs * Math.pow(2, attempt); // 2x, 4x, 8x
                        this.logger.warn(
                            `[${apiName}] 429 Too Many Requests for "${cleanTitle}". ` +
                            `Retrying in ${backoffMs}ms (Attempt ${attempt}/${maxRetries})...`
                        );
                        await new Promise(resolve => setTimeout(resolve, backoffMs));
                        continue;
                    }
                }

                // For non-429 errors or if max retries exceeded for 429s, fail immediately
                return Result.fail(failure);
            }
        }

        return Result.fail(lastFailure || new ServerFailure('Unknown failure during execution'));
    }

    /**
     * Parses the caught error into a Failure. Subclasses implement this 
     * based on their specific HTTP client (e.g. Axios, fetch, SDK).
     */
    protected abstract parseError(error: unknown, context: string, apiName: string): Failure;
}
