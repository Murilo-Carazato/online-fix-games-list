export interface ITitleCleanerService {
    /**
     * Cleans game titles to improve integration and API search results.
     */
    clean(title: string): string;
}

export class TitleCleanerService implements ITitleCleanerService {
    private readonly filters: RegExp[] = [
        // Remove text in parentheses/brackets e.g. "Game (Update1)" -> "Game"
        /\([^)]*\)|\[[^\]]*\]/g,
        // Remove build versions starting with v, Build, Update, Patch and followed by numbers
        /\b(v|build|update|patch|ver|version)[\s\.]*\d+.*$/i,
        // Remove stranded version numbers at the end like " 1.0.5.767" or " 1.2"
        /\s\d+(\.\d+)+.*$/
    ];

    /**
     * Cleans game titles to improve API search results.
     * "Ark Nova 1.0.5.767" -> "Ark Nova"
     * "Game of Life v1.2" -> "Game of Life"
     * "Cool Game (Build 23423)" -> "Cool Game"
     * "Another Game [v1.0]" -> "Another Game"
     */
    public clean(title: string): string {
        return this.filters
            .reduce((cleanTitle, filter) => cleanTitle.replace(filter, ''), title)
            .trim();
    }
}

