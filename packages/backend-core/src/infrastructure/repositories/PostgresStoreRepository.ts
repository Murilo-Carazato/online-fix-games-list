import { db } from "../database/config";
import { stores } from "../database/config/schema";
import { IStoreRepository } from "../../domain/repositories/IStoreRepository";
import { StoreEntity } from "../../domain/entities/StoreEntity";
import { ILoggerService } from "../../domain/services/ILoggerService";

export class PostgresStoreRepository implements IStoreRepository {
    constructor(private readonly logger: ILoggerService) { }

    async getAllStores(): Promise<StoreEntity[]> {
        const rows = await db.select().from(stores);
        this.logger.info(`[StoreRepository] Loaded ${rows.length} store records from DB.`);
        return rows.map(r => new StoreEntity(r.id, r.name, r.domainPattern));
    }
}
