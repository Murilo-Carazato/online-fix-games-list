import { ITitleCleanerService } from './ITitleCleanerService';

/**
 * Concrete implementation of ITitleCleanerService.
 * Strips version numbers, build tags, and parenthetical noise from game titles
 * before they are used to query external APIs.
 * Lives in Infrastructure — the Domain never knows about this class.
 */
export class TitleCleanerService implements ITitleCleanerService {
    private readonly filters: RegExp[] = [
        // Remove text in parentheses/brackets e.g. "Game (Update1)" -> "Game"
        /\([^)]*\)|\[[^\]]*\]/g,
        // Remove build versions e.g. "v1.2", "Build 23", "Update 5"
        /\b(v|build|update|patch|ver|version)[\s\.]*\d+.*$/i,
        // Remove stranded version numbers at end e.g. " 1.0.5.767"
        /\s\d+(\.\d+)+.*$/
    ];

    /**
     * "Ark Nova 1.0.5.767"   -> "Ark Nova"
     * "Game of Life v1.2"    -> "Game of Life"
     * "Cool Game (Build 234)"-> "Cool Game"
     */
    public clean(title: string): string {
        return this.filters
            .reduce((cleanTitle, filter) => cleanTitle.replace(filter, ''), title)
            .trim();
    }
}
