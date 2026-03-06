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
     * Object.assign<Target, Source> serializes the class instance to a plain record
     * without requiring `as` type assertions.
     */
    static toDbModel(entity: EnrichedGameEntity): EnrichedGameDbModel {
        return new EnrichedGameDbModel(
            entity.title,
            entity.uploadDate ? new Date(entity.uploadDate) : new Date(),
            entity.totalRating ?? null,
            entity.added ?? null,
            entity.playtime ?? null,
            entity.isEnriched,
            Object.assign<Record<string, unknown>, EnrichedGameEntity>({}, entity),
            new Date()
        );
    }

    /**
     * Converts a typed JSONB data row back into a Domain Entity.
     * The data parameter is already typed as EnrichedGameEntity by the Drizzle schema,
     * so no type assertions are needed.
     */
    static toDomain(
        data: EnrichedGameEntity,
        wantToPlay: boolean,
        ignored: boolean
    ): EnrichedGameEntity {
        const hydraData = new HydraGameEntity(
            data.fileSize,
            data.title,
            data.uploadDate,
        );

        const entity = new EnrichedGameEntity(hydraData, data);
        entity.wantToPlay = wantToPlay;
        entity.ignored = ignored;
        return entity;
    }
}
