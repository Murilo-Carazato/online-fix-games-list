/**
 * Domain contract for cleaning raw game titles before querying external APIs.
 * Lives in Domain — implementations in Infrastructure.
 */
export interface ITitleCleanerService {
    clean(title: string): string;
}
