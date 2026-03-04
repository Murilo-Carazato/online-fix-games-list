import { pgTable, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

// We store only custom preferences associated with a game title.
// For now, we use the `title` as the primary key since it's the unique identifier 
// in our current JSON source (onlinefix.json).
export const gamePreferences = pgTable("game_preferences", {
    title: varchar("title", { length: 500 }).primaryKey(),
    wantToPlay: boolean("want_to_play").default(false).notNull(),
    ignored: boolean("ignored").default(false).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
