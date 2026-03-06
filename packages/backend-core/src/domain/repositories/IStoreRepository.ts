import { StoreEntity } from "../entities/StoreEntity";

export interface IStoreRepository {
    /**
     * Retrieves all known store definitions from the database.
     */
    getAllStores(): Promise<StoreEntity[]>;
}
