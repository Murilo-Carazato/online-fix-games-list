/**
 * Represents the resolved store information after matching a URL.
 */
export class StoreMatchData {
    constructor(
        public readonly storeId: number,
        public readonly storeName: string,
        public readonly categoryIcon: string
    ) { }
}
