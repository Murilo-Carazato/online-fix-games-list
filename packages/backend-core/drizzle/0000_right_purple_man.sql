CREATE TABLE "alanzoka_videos" (
	"video_id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"published_at" timestamp NOT NULL,
	"thumbnail_url" text,
	"channel_title" text
);
--> statement-breakpoint
CREATE TABLE "franchises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(300) NOT NULL,
	CONSTRAINT "franchises_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "game_added_stats" (
	"game_id" integer PRIMARY KEY NOT NULL,
	"yet" integer DEFAULT 0 NOT NULL,
	"owned" integer DEFAULT 0 NOT NULL,
	"beaten" integer DEFAULT 0 NOT NULL,
	"toplay" integer DEFAULT 0 NOT NULL,
	"dropped" integer DEFAULT 0 NOT NULL,
	"playing" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_external_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"platform_store_id" integer,
	"store_id" integer NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_franchises" (
	"game_id" integer NOT NULL,
	"franchise_id" integer NOT NULL,
	CONSTRAINT "game_franchises_game_id_franchise_id_pk" PRIMARY KEY("game_id","franchise_id")
);
--> statement-breakpoint
CREATE TABLE "game_game_modes" (
	"game_id" integer NOT NULL,
	"game_mode_id" integer NOT NULL,
	CONSTRAINT "game_game_modes_game_id_game_mode_id_pk" PRIMARY KEY("game_id","game_mode_id")
);
--> statement-breakpoint
CREATE TABLE "game_genres" (
	"game_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "game_genres_game_id_genre_id_pk" PRIMARY KEY("game_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "game_language_supports" (
	"game_language_id" integer NOT NULL,
	"support_type_id" integer NOT NULL,
	CONSTRAINT "game_language_supports_game_language_id_support_type_id_pk" PRIMARY KEY("game_language_id","support_type_id")
);
--> statement-breakpoint
CREATE TABLE "game_languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"language_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_modes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "game_modes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "game_platform_versions" (
	"game_id" integer NOT NULL,
	"platform_version_id" integer NOT NULL,
	CONSTRAINT "game_platform_versions_game_id_platform_version_id_pk" PRIMARY KEY("game_id","platform_version_id")
);
--> statement-breakpoint
CREATE TABLE "game_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"rating_category_id" integer NOT NULL,
	"count" integer NOT NULL,
	"percent" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_themes" (
	"game_id" integer NOT NULL,
	"theme_id" integer NOT NULL,
	CONSTRAINT "game_themes_game_id_theme_id_pk" PRIMARY KEY("game_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"base_title" varchar(500) NOT NULL,
	"file_size_value" real,
	"file_size_unit" varchar(10),
	"upload_date" timestamp NOT NULL,
	"is_enriched" boolean DEFAULT false NOT NULL,
	"igdb_id" integer,
	"rawg_id" integer,
	"playtime" integer,
	"cover_url" text,
	"total_rating" real,
	"total_rating_count" integer,
	"added_total" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "games_base_title_unique" UNIQUE("base_title")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "igdb_videos" (
	"video_id" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "language_support_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "language_support_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "languages_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "platform_stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_id" integer NOT NULL,
	"store_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform_id" integer NOT NULL,
	"name" varchar(300) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(300) NOT NULL,
	CONSTRAINT "platforms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rating_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"score" integer NOT NULL,
	CONSTRAINT "rating_categories_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "screenshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"domain_pattern" varchar(200) NOT NULL,
	"icon_url" text,
	CONSTRAINT "stores_domain_pattern_unique" UNIQUE("domain_pattern")
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	CONSTRAINT "themes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_id" integer NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alanzoka_videos" ADD CONSTRAINT "alanzoka_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_added_stats" ADD CONSTRAINT "game_added_stats_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_external_links" ADD CONSTRAINT "game_external_links_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_external_links" ADD CONSTRAINT "game_external_links_platform_store_id_platform_stores_id_fk" FOREIGN KEY ("platform_store_id") REFERENCES "public"."platform_stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_external_links" ADD CONSTRAINT "game_external_links_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_franchises" ADD CONSTRAINT "game_franchises_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_franchises" ADD CONSTRAINT "game_franchises_franchise_id_franchises_id_fk" FOREIGN KEY ("franchise_id") REFERENCES "public"."franchises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_game_modes" ADD CONSTRAINT "game_game_modes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_game_modes" ADD CONSTRAINT "game_game_modes_game_mode_id_game_modes_id_fk" FOREIGN KEY ("game_mode_id") REFERENCES "public"."game_modes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_language_supports" ADD CONSTRAINT "game_language_supports_game_language_id_game_languages_id_fk" FOREIGN KEY ("game_language_id") REFERENCES "public"."game_languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_language_supports" ADD CONSTRAINT "game_language_supports_support_type_id_language_support_types_id_fk" FOREIGN KEY ("support_type_id") REFERENCES "public"."language_support_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_languages" ADD CONSTRAINT "game_languages_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_languages" ADD CONSTRAINT "game_languages_language_id_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."languages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_platform_versions" ADD CONSTRAINT "game_platform_versions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_platform_versions" ADD CONSTRAINT "game_platform_versions_platform_version_id_platform_versions_id_fk" FOREIGN KEY ("platform_version_id") REFERENCES "public"."platform_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_ratings" ADD CONSTRAINT "game_ratings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_ratings" ADD CONSTRAINT "game_ratings_rating_category_id_rating_categories_id_fk" FOREIGN KEY ("rating_category_id") REFERENCES "public"."rating_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_themes" ADD CONSTRAINT "game_themes_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_themes" ADD CONSTRAINT "game_themes_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "igdb_videos" ADD CONSTRAINT "igdb_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_stores" ADD CONSTRAINT "platform_stores_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_stores" ADD CONSTRAINT "platform_stores_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_versions" ADD CONSTRAINT "platform_versions_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;