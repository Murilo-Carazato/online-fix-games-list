import {
    pgTable, varchar, timestamp, boolean, integer, real, serial, text,
    primaryKey
} from "drizzle-orm/pg-core";

// ─── LOOKUP / SEED TABLES ────────────────────────────────────────────────────

/** Genres (e.g. Puzzle, Adventure) — shared lookup seeded from IGDB */
// games[0].genres[0].name
export const genres = pgTable("genres", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull().unique(),
});

/** Themes (e.g. Action, Horror) — from IGDB */
// games[0].themes[0].name
export const themes = pgTable("themes", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull().unique(),
});

/** Game modes (e.g. Single player, Co-operative) — from IGDB */
// games[0].game_modes[0].name
export const gameModes = pgTable("game_modes", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull().unique(),
});

/** Platforms (e.g. Xbox Series X|S, Nintendo Switch 2) — from IGDB/RAWG */

/** 
 
quero q seja uma tabela 1:N pra funcionar desse jeito:
games[0].platforms[0].name = Playstation
games[0].platforms[0].versionId.name = 5
games[0].platforms[0].versionId.name = 4
isso significa q funciona para Playstation 4 e 5

e 1:N com stores pois a pllataforma PC, pode ter várias lojas (Steam, Epic, GOG)
**/
export const platforms = pgTable("platforms", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 300 }).notNull().unique(),
});

/** Platform Versions (e.g. 4, 5 for PlayStation) */
export const platformVersions = pgTable("platform_versions", {
    id: serial("id").primaryKey(),
    platformId: integer("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 300 }).notNull(),
});

/** Stores (e.g. Steam, PlayStation) — SEEDED at migration. */
export const stores = pgTable("stores", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(), // Removed unique() as per comment: "PC, pode ter várias lojas (Steam, Epic, GOG)"
    domainPattern: varchar("domain_pattern", { length: 200 }).notNull().unique(),
    iconUrl: text("icon_url"),
});

/** Intermediate table for possible platform <-> store relations (e.g. PC -> Steam). SEEDED. */
export const platformStores = pgTable("platform_stores", {
    id: serial("id").primaryKey(),
    platformId: integer("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
    storeId: integer("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
});

/** Franchises (e.g. Halo, Final Fantasy) — from IGDB */
/*
games[0].franchises[0].gameId.name = Halo

para ver qual franquia o jogo pertence, ent n precisa de name, precisa do gameId
*/
export const franchises = pgTable("franchises", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 300 }).notNull().unique(),
});

/** Languages (e.g. English, Portuguese (Brazil)) — from IGDB */
/*
1:N com languageSupportTypes
games[0].languages[0].name = English
games[0].languages[1].name = Portuguese (Brazil)

games[0].languages[0].languageSupportTypes[0].name = Audio
games[0].languages[1].languageSupportTypes[1].name = Subtitles

significa q o jogo suporta audio em inglês e legendas em portugues
*/
export const languages = pgTable("languages", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull().unique(),
});

/** Language support types (e.g. Audio, Subtitles, Interface) — SEEDED */
export const languageSupportTypes = pgTable("language_support_types", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
});

/**
 * Rating categories — SEEDED at migration.
 * Maps RAWG's string labels to numeric scores (replaces RATING_WEIGHTS constant).
 * e.g. "exceptional" → score 5, "recommended" → 4, "meh" → 3, "skip" → 1
 */

/*
games[0].ratingCategories[0].title = "exceptional"
games[0].ratingCategories[0].score = 5
games[0].ratingCategories[0].count = 10
games[0].ratingCategories[0].percentage = 10

isso significa q a categoria exceptional vale 5 pontos, pessoas 10 votaram o jogo como ela; e esses 10 representam 10% do total dos outros ratings(10% das pessoas q avaliaram acharam o jogo exceptional)
*/
export const ratingCategories = pgTable("rating_categories", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 100 }).notNull().unique(),
    score: integer("score").notNull(),
});

// ─── MAIN GAME TABLE ─────────────────────────────────────────────────────────

/** Core game data — one row per OnlineFix game title */
export const games = pgTable("games", {
    id: serial("id").primaryKey(), // Surrogate key
    title: varchar("title", { length: 500 }).notNull(),
    baseTitle: varchar("base_title", { length: 500 }).notNull().unique(),
    fileSizeValue: real("file_size_value"),
    fileSizeUnit: varchar("file_size_unit", { length: 10 }),
    uploadDate: timestamp("upload_date").notNull(),
    isEnriched: boolean("is_enriched").default(false).notNull(),
    igdbId: integer("igdb_id"),
    rawgId: integer("rawg_id"),
    playtime: integer("playtime"),
    coverUrl: text("cover_url"),
    totalRating: real("total_rating"),
    totalRatingCount: integer("total_rating_count"),
    addedTotal: integer("added_total"),
    youtubeFetchFailed: boolean("youtube_fetch_failed").default(false).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── JOIN TABLES (game ↔ lookup) ─────────────────────────────────────────────

export const gameGenres = pgTable("game_genres",
    { gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }), genreId: integer("genre_id").notNull().references(() => genres.id, { onDelete: "cascade" }) },
    (t) => [primaryKey({ columns: [t.gameId, t.genreId] })]
);

export const gameThemes = pgTable("game_themes",
    { gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }), themeId: integer("theme_id").notNull().references(() => themes.id, { onDelete: "cascade" }) },
    (t) => [primaryKey({ columns: [t.gameId, t.themeId] })]
);

export const gameGameModes = pgTable("game_game_modes",
    { gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }), gameModeId: integer("game_mode_id").notNull().references(() => gameModes.id, { onDelete: "cascade" }) },
    (t) => [primaryKey({ columns: [t.gameId, t.gameModeId] })]
);

export const gamePlatformVersions = pgTable("game_platform_versions",
    { gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }), platformVersionId: integer("platform_version_id").notNull().references(() => platformVersions.id, { onDelete: "cascade" }) },
    (t) => [primaryKey({ columns: [t.gameId, t.platformVersionId] })]
);

/** games[0].franchises[0].gameId.name = Halo */
export const gameFranchises = pgTable("game_franchises",
    { gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }), franchiseId: integer("franchise_id").notNull().references(() => franchises.id, { onDelete: "cascade" }) },
    (t) => [primaryKey({ columns: [t.gameId, t.franchiseId] })]
);

// ─── 1:N / NESTED HIERARCHIES ────────────────────────────────────────────────

/** Nested 1:N languages. games[0].languages[0].name = English */
export const gameLanguages = pgTable("game_languages", {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    languageId: integer("language_id").notNull().references(() => languages.id, { onDelete: "cascade" }),
});

/** games[0].languages[0].languageSupportTypes[0].name = Audio */
export const gameLanguageSupports = pgTable("game_language_supports",
    {
        gameLanguageId: integer("game_language_id").notNull().references(() => gameLanguages.id, { onDelete: "cascade" }),
        supportTypeId: integer("support_type_id").notNull().references(() => languageSupportTypes.id, { onDelete: "cascade" }),
    },
    (t) => [primaryKey({ columns: [t.gameLanguageId, t.supportTypeId] })]
);

/** External store links per game, linked through the true platform-store availability */
export const gameExternalLinks = pgTable("game_external_links", {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    platformStoreId: integer("platform_store_id").references(() => platformStores.id),
    storeId: integer("store_id").notNull().references(() => stores.id), // Fallback direct link if platform unknown
    url: text("url").notNull(),
});

/** Screenshots per game — URLs from RAWG */
/*
games[0].screenshots[0].url =  "https://..."
games[0].screenshots[1].url =  "https://..."
*/
export const screenshots = pgTable("screenshots", {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
});

/** Player ratings per game */
export const gameRatings = pgTable("game_ratings", {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    ratingCategoryId: integer("rating_category_id").notNull().references(() => ratingCategories.id),
    count: integer("count").notNull(),
    percent: real("percent").notNull(),
});

/** Added stats per game */
export const gameAddedStats = pgTable("game_added_stats", {
    gameId: integer("game_id").primaryKey().references(() => games.id, { onDelete: "cascade" }),
    yet: integer("yet").default(0).notNull(),
    owned: integer("owned").default(0).notNull(),
    beaten: integer("beaten").default(0).notNull(),
    toplay: integer("toplay").default(0).notNull(),
    dropped: integer("dropped").default(0).notNull(),
    playing: integer("playing").default(0).notNull(),
});

/**
 * Videos per game.
 * `isIgdbVideo` = true  → plain YouTube URL string from IGDB's videos field
 * `isIgdbVideo` = false → full VideoEntity from the Alanzoka YouTube channel search
 */
/*
se for video do Igdb:
games[0].videos[0].url = "https://..."
games[0].videos[1].url = "https://..."

/** Base table for all videos (Class Table Inheritance) */
export const videos = pgTable("videos", {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
});

/** Plain IGDB Video records extending base videos */
export const igdbVideos = pgTable("igdb_videos", {
    videoId: integer("video_id").primaryKey().references(() => videos.id, { onDelete: "cascade" }),
});

/** Full YouTube Metadata for Alanzoka Videos extending base videos */
export const alanzokaVideos = pgTable("alanzoka_videos", {
    videoId: integer("video_id").primaryKey().references(() => videos.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    publishedAt: timestamp("published_at").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    channelTitle: text("channel_title"),
});
