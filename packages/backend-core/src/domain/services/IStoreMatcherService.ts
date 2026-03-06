/**
 * Domain contract for resolving store information from an external game URL.
 * Keeps the Gateway layer free from hardcoded if/else store maps and from
 * direct database access (Clean Architecture boundary).
 */
export interface IStoreMatcherService {
    matchStore(url: string): Promise<{ storeId: number; storeName: string; categoryIcon: string }>;
}
