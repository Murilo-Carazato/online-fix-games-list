import { ILoggerService } from '../../domain/services/ILoggerService';

/**
 * Console implementation of ILoggerService.
 * Lives in the Infrastructure layer — injected at the composition root (index.ts).
 */
export class ConsoleLoggerService implements ILoggerService {
    public info(message: string): void {
        console.log(`[INFO] ${message}`);
    }

    public warn(message: string): void {
        console.warn(`[WARN] ${message}`);
    }

    public error(message: string): void {
        console.error(`[ERROR] ${message}`);
    }
}
