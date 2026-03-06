import { EnrichedGameEntity } from '../../domain/entities/EnrichedGameEntity';
import { HydraGameEntity } from '../../domain/entities/HydraGameEntity';
import { VideoEntity } from '../../domain/entities/VideoEntity';
import { IgdbLanguageSupport, IgdbExternalGame, RawgRating } from '../../domain/data/ExternalGameData';
import { EnrichedGameDbModel } from '../database/models/EnrichedGameDbModel';

export interface JoinedGameDbRow {
    game: { title: string; fileSize: string | null; uploadDate: Date; isEnriched: boolean; igdbId: number | null; rawgId: number | null; playtime: number | null; coverUrl: string | null; totalRating: number | null; totalRatingCount: number | null; addedTotal: number | null };
    genres: string[];
    themes: string[];
    modes: string[];
    platforms: { name: string; versions: string[] }[];
    franchises: string[];
    languageSupports: { language: string; supportTypes: string[] }[];
    externalLinks: { storeId: number; storeName: string; domainPattern: string; url: string }[];
    screenshots: string[];
    ratings: RawgRating[];
    addedStats: { yet: number; owned: number; beaten: number; toplay: number; dropped: number; playing: number } | null;
    igdbVideos: string[];
    alanzokaVideos: { url: string; title: string; publishedAt: Date; thumbnailUrl: string | null; channelTitle: string | null }[];
}

/**
 * Pure domain transformer — zero database imports.
 * Converts between Domain Entities and plain value objects used by the Repository
 * for DB inserts, and reconstructs Domain Entities from joined DB row data.
 */
export class GameMapper {

    // ─── TO DB VALUE OBJECTS (Entity → Plain Objects for Repository to insert) ─

    static toDb(entity: EnrichedGameEntity): EnrichedGameDbModel {
        const igdbVideos: { url: string }[] = [];
        for (const url of entity.videos ?? []) {
            igdbVideos.push({ url });
        }

        const alanzokaVideos: { url: string; title: string; publishedAt: Date; thumbnailUrl: string | null; channelTitle: string | null }[] = [];
        for (const v of entity.contentCreatorVideos ?? []) {
            alanzokaVideos.push({
                url: v.url,
                title: v.title,
                publishedAt: v.publishedAt ? new Date(v.publishedAt) : new Date(),
                thumbnailUrl: v.thumbnailUrl ?? null,
                channelTitle: v.channelTitle ?? null,
            });
        }

        let statsValues: EnrichedGameDbModel['addedStats'] = null;
        if (entity.addedByStatus) {
            const s = entity.addedByStatus;
            statsValues = {
                yet: s['yet'] ?? 0,
                owned: s['owned'] ?? 0,
                beaten: s['beaten'] ?? 0,
                toplay: s['toplay'] ?? 0,
                dropped: s['dropped'] ?? 0,
                playing: s['playing'] ?? 0,
            };
        }

        // Group logic for languages (e.g., aggregate 'Audio' and 'Subtitles' under 'English')
        const langMap = new Map<string, Set<string>>();
        for (const ls of entity.languageSupports ?? []) {
            if (!langMap.has(ls.language)) langMap.set(ls.language, new Set());
            langMap.get(ls.language)!.add(ls.supportType);
        }
        const languageSupports = Array.from(langMap.entries()).map(([language, types]) => ({
            language,
            supportTypes: Array.from(types)
        }));

        // Parse platforms and versions based on user request (e.g. "PlayStation 5" -> "Playstation", ["5"])
        const platMap = new Map<string, Set<string>>();
        for (const p of entity.platforms ?? []) {
            let name = p;
            let version = "Base";

            const matchParenthesis = p.match(/^(.*?)\s*\((.*?)\)$/);
            if (matchParenthesis) {
                name = matchParenthesis[1].trim();
                version = matchParenthesis[2].trim();
            } else {
                const matchNumber = p.match(/^(.*?)\s+(\d+)$/);
                if (matchNumber) {
                    name = matchNumber[1].trim();
                    version = matchNumber[2].trim();
                }
            }

            if (!platMap.has(name)) platMap.set(name, new Set());
            platMap.get(name)!.add(version);
        }
        const platforms = Array.from(platMap.entries()).map(([name, versionsSet]) => ({
            name,
            versions: Array.from(versionsSet)
        }));

        return {
            core: {
                title: entity.title,
                fileSize: entity.fileSize ?? null,
                uploadDate: entity.uploadDate ? new Date(entity.uploadDate) : new Date(),
                isEnriched: entity.isEnriched,
                igdbId: entity.igdbId ?? null,
                rawgId: entity.rawgId ?? null,
                playtime: entity.playtime ?? null,
                coverUrl: entity.coverUrl ?? null,
                totalRating: entity.totalRating ?? null,
                totalRatingCount: entity.totalRatingCount ?? null,
                addedTotal: entity.added ?? null,
                updatedAt: new Date(),
            },
            igdbVideos,
            alanzokaVideos,
            addedStats: statsValues,
            screenshots: (entity.screenshots ?? []).map(url => ({ url })),
            externalLinks: (entity.externalGames ?? []).map(l => ({ storeId: l.storeId, url: l.url })),
            genres: entity.genres ?? [],
            themes: entity.themes ?? [],
            gameModes: entity.gameModes ?? [],
            platforms,
            franchises: entity.franchises ?? [],
            languageSupports,
            ratings: entity.ratings ?? [],
        };
    }

    // ─── TO DOMAIN (Joined DB row data → Domain Entity) ───────────────────────

    static toDomain(row: JoinedGameDbRow): EnrichedGameEntity {
        const { game } = row;

        const hydra = new HydraGameEntity(
            game.fileSize ?? '',
            game.title,
            game.uploadDate.toISOString()
        );

        const creatorVideos = row.alanzokaVideos.map(v => new VideoEntity(
            v.url,
            v.title ?? '',
            v.publishedAt ? v.publishedAt.toISOString() : new Date().toISOString(),
            v.thumbnailUrl ?? '',
            v.channelTitle ?? ''
        ));

        // Flatten language supports
        const flatLangSupports: IgdbLanguageSupport[] = [];
        for (const ls of row.languageSupports) {
            for (const st of ls.supportTypes) {
                flatLangSupports.push({ language: ls.language, supportType: st });
            }
        }

        // Flatten platforms
        const flatPlatforms: string[] = [];
        for (const p of row.platforms) {
            for (const v of p.versions) {
                if (v === 'Base') flatPlatforms.push(p.name);
                else {
                    if (v.startsWith('Microsoft') || v.startsWith('Mac')) flatPlatforms.push(`${p.name} (${v})`);
                    else flatPlatforms.push(`${p.name} ${v}`);
                }
            }
        }

        const externalLinks: IgdbExternalGame[] = row.externalLinks.map(r => ({
            storeId: r.storeId,
            storeName: r.storeName,
            categoryIcon: `https://www.google.com/s2/favicons?domain=${r.domainPattern}&sz=128`,
            url: r.url,
        }));

        const entity = new EnrichedGameEntity(hydra, {
            igdbId: game.igdbId,
            rawgId: game.rawgId,
            totalRating: game.totalRating,
            totalRatingCount: game.totalRatingCount,
            playtime: game.playtime,
            coverUrl: game.coverUrl,
            added: game.addedTotal,
            genres: row.genres,
            themes: row.themes,
            gameModes: row.modes,
            platforms: flatPlatforms,
            franchises: row.franchises,
            languageSupports: flatLangSupports,
            externalGames: externalLinks,
            screenshots: row.screenshots,
            ratings: row.ratings,
            addedByStatus: row.addedStats ? { ...row.addedStats } : null,
            videos: row.igdbVideos,
            contentCreatorVideos: creatorVideos,
        });

        entity.isEnriched = game.isEnriched;
        return entity;
    }
}
