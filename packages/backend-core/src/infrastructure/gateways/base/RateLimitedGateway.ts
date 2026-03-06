import axios from 'axios';
import { ILoggerService } from '../../../domain/services/ILoggerService';
import { Result } from '../../../domain/common/Result';
import { Failure, ServerFailure } from '../../../domain/common/Failure';

/**
 * Abstract base class for external API gateways requiring rate limiting.
 *
 * Applies the Template Method pattern: subclasses inherit the shared
 * rate-limiting, try/catch, and error-handling skeleton, while only
 * implementing the API-specific mapping logic.
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
     * Handles delay → execute → Result wrapping → error handling.
     * Subclasses provide only the API-specific `operation` callback.
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
            return this.handleApiError(error, cleanTitle, apiName);
        }
    }

    /**
     * Converts an Axios or unknown error into a Result.fail(ServerFailure).
     * Avoids `as any` by using JSON.stringify on the response data.
     */
    protected handleApiError<T>(error: unknown, context: string, apiName: string): Result<T, Failure> {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 'unknown';
            const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            this.logger.error(`${apiName} Error for "${context}": status=${status} ${detail}`);
            return Result.fail(new ServerFailure(`${apiName} Error: ${error.message}`));
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`${apiName} unexpected error for "${context}": ${errorMessage}`);
        return Result.fail(new ServerFailure(`${apiName} Error: ${errorMessage}`));
    }
}
