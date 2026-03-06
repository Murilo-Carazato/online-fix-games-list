import { ILoggerService } from '../../../domain/services/ILoggerService';
import { Result } from '../../../domain/common/Result';
import { Failure } from '../../../domain/common/Failure';

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
     */
    protected async executeWithRateLimit<T>(
        cleanTitle: string,
        apiName: string,
        operation: () => Promise<T | null>
    ): Promise<Result<T | null, Failure>> {
        await this.delayNextRequest();
        try {
            const result = await operation();
            return Result.ok(result);
        } catch (error: unknown) {
            return Result.fail(this.parseError(error, cleanTitle, apiName));
        }
    }

    /**
     * Parses the caught error into a Failure. Subclasses implement this 
     * based on their specific HTTP client (e.g. Axios, fetch, SDK).
     */
    protected abstract parseError(error: unknown, context: string, apiName: string): Failure;
}
