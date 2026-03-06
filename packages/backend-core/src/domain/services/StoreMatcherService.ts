import { IStoreMatcherService } from "../../domain/services/IStoreMatcherService";
import { IStoreRepository } from "../../domain/repositories/IStoreRepository";
import { StoreMatchData } from "../../domain/data/StoreMatchData";
import { StoreEntity } from "../../domain/entities/StoreEntity";

/**
 * Resolves store metadata by matching an external game URL against the
 * store definitions loaded via the repository (e.g. "steampowered.com").
 * Returns the matching store's id, name and favicon URL — or a fallback "Other" row.
 */
export class StoreMatcherService implements IStoreMatcherService {
    /** In-memory cache: avoids re-querying the repository on every loop iteration */
    private storeCache: StoreEntity[] | null = null;

    constructor(private readonly storeRepository: IStoreRepository) { }

    private async loadStores(): Promise<StoreEntity[]> {
        if (this.storeCache) return this.storeCache;
        this.storeCache = await this.storeRepository.getAllStores();
        return this.storeCache;
    }

    public async matchStore(url: string): Promise<StoreMatchData> {
        const allStores = await this.loadStores();
        const lowerUrl = url.toLowerCase();

        const matched = allStores.find(s => s.domainPattern !== '*' && lowerUrl.includes(s.domainPattern));
        const fallback = allStores.find(s => s.domainPattern === '*');

        const store = matched ?? fallback ?? { id: 0, name: 'Other', domainPattern: '*' };

        let domain = store.domainPattern;
        try { domain = new URL(url).hostname; } catch { /* keep pattern if URL is invalid */ }
        const categoryIcon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

        return new StoreMatchData(store.id, store.name, categoryIcon);
    }
}
