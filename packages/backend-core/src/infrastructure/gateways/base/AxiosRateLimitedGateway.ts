import axios from 'axios';
import { ILoggerService } from '../../../domain/services/ILoggerService';
import { Failure, ServerFailure } from '../../../domain/common/Failure';
import { RateLimitedGateway } from './RateLimitedGateway';

/**
 * Concrete base class for external API gateways driven by Axios.
 * 
 * Provides the Axios-specific error parsing (`parseError`) implementation required
 * by the pure `RateLimitedGateway`. Subclasses only need to provide their API logic.
 */
export abstract class AxiosRateLimitedGateway extends RateLimitedGateway {

    protected constructor(logger: ILoggerService, requestDelayMs: number) {
        super(logger, requestDelayMs);
    }

    /**
     * Converts an Axios or unknown error into a ServerFailure.
     * Extracts response data from the HTTP error cleanly.
     */
    protected parseError(error: unknown, context: string, apiName: string): Failure {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 'unknown';
            const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            this.logger.error(`${apiName} Error for "${context}": status=${status} ${detail}`);
            return new ServerFailure(`${apiName} Error: ${error.message}`);
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`${apiName} unexpected error for "${context}": ${errorMessage}`);
        return new ServerFailure(`${apiName} Error: ${errorMessage}`);
    }
}
