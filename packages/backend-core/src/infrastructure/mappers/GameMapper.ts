import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { HydraGameEntity } from '../../domain/entities/HydraGameEntity';
import { EnrichedGameDbModel } from '../database/models/EnrichedGameDbModel';

/**
 * Responsible for converting between the Domain Entity and the Infrastructure DB Model.
 * Lives in the Infrastructure layer — the Domain never knows about this mapper.
 */
export class GameMapper {

    /**
     * Converts a Domain Entity into a DB row ready for insertion/update.
     */
    static toDbModel(entity: EnrichedGameEntity): EnrichedGameDbModel {
        return {
            title: entity.title,
            uploadDate: entity.uploadDate ? new Date(entity.uploadDate) : new Date(),
            totalRating: entity.totalRating ?? null,
            added: entity.added ?? null,
            playtime: entity.playtime ?? null,
            isEnriched: entity.isEnriched,
            data: entity as unknown as Record<string, unknown>,
            updatedAt: new Date(),
        };
    }

    /**
     * Converts a DB row (plus joined preference columns) back into a Domain Entity.
     */
    static toDomain(
        row: EnrichedGameDbModel & { wantToPlay?: boolean | null; ignored?: boolean | null }
    ): EnrichedGameEntity {
        const hydraData = new HydraGameEntity(
            (row.data as any).fileSize,
            (row.data as any).title,
            (row.data as any).uploadDate,
        );

        const entity = new EnrichedGameEntity(hydraData, row.data as any);
        entity.wantToPlay = row.wantToPlay ?? false;
        entity.ignored = row.ignored ?? false;
        return entity;
    }
}
