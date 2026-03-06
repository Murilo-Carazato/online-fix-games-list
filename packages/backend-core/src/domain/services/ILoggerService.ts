/**
 * Domain contract for logging. Abstracts any concrete logging implementation
 * (console, Pino, Winston, Datadog, etc.) away from the Use Case layer.
 * Lives in the Domain layer so all other layers can depend on it.
 */
export interface ILoggerService {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
