/**
 * Represents a Store entity in the domain (e.g. Steam, Epic Games).
 * It has a distinct identity (id).
 */
export class StoreEntity {
    constructor(
        public readonly id: number,
        public readonly name: string,
        public readonly domainPattern: string
    ) { }
}
