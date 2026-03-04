import { pgTable, varchar, timestamp, boolean, integer, jsonb, real } from "drizzle-orm/pg-core";
import type { EnrichedGame } from "@hydra/core-domain";

// We store only custom preferences associated with a game title.
// For now, we use the `title` as the primary key since it's the unique identifier 
// in our current JSON source (onlinefix.json).
export const gamePreferences = pgTable("game_preferences", {
    title: varchar("title", { length: 500 }).primaryKey(),
    wantToPlay: boolean("want_to_play").default(false).notNull(),
    ignored: boolean("ignored").default(false).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enriched Games Table for fast filtering/sorting
export const enrichedGames = pgTable("enriched_games", {
    title: varchar("title", { length: 500 }).primaryKey(),
    uploadDate: timestamp("upload_date").notNull(),
    totalRating: real("total_rating"),
    added: integer("added"),
    playtime: integer("playtime"),
    isEnriched: boolean("is_enriched").default(false).notNull(),
    // Store the complete payload as JSONB to prevent enormous table schemas
    // while keeping vital fields above as native SQL columns for the ORDER BY performance
    data: jsonb("data").$type<EnrichedGame>().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
