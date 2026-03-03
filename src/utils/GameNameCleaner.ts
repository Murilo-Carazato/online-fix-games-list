export class GameNameCleaner {
    /**
     * Cleans game titles to improve API search results.
     * "Ark Nova 1.0.5.767" -> "Ark Nova"
     * "Game of Life v1.2" -> "Game of Life"
     * "Cool Game (Build 23423)" -> "Cool Game"
     * "Another Game [v1.0]" -> "Another Game"
     */
    public clean(title: string): string {
        let cleanTitle = title;

        // Remove text in parentheses/brackets e.g. "Game (Update1)" -> "Game"
        cleanTitle = cleanTitle.replace(/[\(\[].*?[\)\]]/g, '');

        // Remove build versions starting with v, Build, Update, Patch
        // and followed by numbers
        cleanTitle = cleanTitle.replace(/\b(v|build|update|patch|ver|version)[\s\.]*\d+.*$/i, '');

        // Remove stranded version numbers at the end like " 1.0.5.767" or " 1.2"
        cleanTitle = cleanTitle.replace(/\s\d+(\.\d+)+.*$/, '');

        // Trim extra spaces
        return cleanTitle.trim();
    }
}
