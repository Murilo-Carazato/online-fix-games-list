export interface ITitleCleaner {
    /**
     * Cleans game titles to improve integration and API search results.
     */
    clean(title: string): string;
}
