CREATE TABLE "game_preferences" (
	"title" varchar(500) PRIMARY KEY NOT NULL,
	"want_to_play" boolean DEFAULT false NOT NULL,
	"ignored" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
