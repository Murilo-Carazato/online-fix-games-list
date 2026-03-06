import { eq } from "drizzle-orm";
import { db } from "../database/config";
import { stores } from "../database/config/schema";
import { IStoreMatcherService } from "../../domain/services/IStoreMatcherService";
import { ILoggerService } from "../../domain/services/ILoggerService";

/**
 * Resolves store metadata by matching an external game URL against the
 * `stores` table (seeded with domain patterns like "steampowered.com").
 * Returns the matching store's id, name and favicon URL — or a fallback "Other" row.
 */
export class DbStoreMatcherService implements IStoreMatcherService {
    /** In-memory cache: avoids re-querying the seeded lookup table on every call */
    private storeCache: { id: number; name: string; domainPattern: string }[] | null = null;

    constructor(private readonly logger: ILoggerService) { }

    private async loadStores(): Promise<{ id: number; name: string; domainPattern: string }[]> {
        if (this.storeCache) return this.storeCache;
        this.storeCache = await db.select().from(stores);
        this.logger.info(`[StoreMatcherService] Loaded ${this.storeCache.length} store records from DB.`);
        return this.storeCache;
    }

    public async matchStore(url: string): Promise<{ storeId: number; storeName: string; categoryIcon: string }> {
        const allStores = await this.loadStores();
        const lowerUrl = url.toLowerCase();

        const matched = allStores.find(s => s.domainPattern !== '*' && lowerUrl.includes(s.domainPattern));
        const fallback = allStores.find(s => s.domainPattern === '*');

        const store = matched ?? fallback ?? { id: 0, name: 'Other', domainPattern: '*' };

        let domain = store.domainPattern;
        try { domain = new URL(url).hostname; } catch { /* keep pattern if URL is invalid */ }
        const categoryIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

        return { storeId: store.id, storeName: store.name, categoryIcon };
    }
}
