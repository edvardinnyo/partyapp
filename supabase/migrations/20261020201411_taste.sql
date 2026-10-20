CREATE TYPE "public"."genre" AS ENUM('techno', 'house', 'drum-and-bass', 'trance', 'hardstyle', 'bass-dubstep', 'edm', 'hip-hop-rap', 'rnb-soul', 'pop', 'rock', 'metal', 'punk', 'indie-alternative', 'jazz', 'funk-disco', 'reggae-dancehall', 'latin-reggaeton', 'classical', 'folk', 'mulatos', 'retro');--> statement-breakpoint
CREATE TABLE "taste_genres" (
	"user_id" uuid NOT NULL,
	"genre" "genre" NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "taste_genres_user_id_genre_pk" PRIMARY KEY("user_id","genre"),
	CONSTRAINT "taste_genres_user_position_unique" UNIQUE("user_id","position")
);
--> statement-breakpoint
ALTER TABLE "taste_genres" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "taste_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"top_genres" "genre"[] NOT NULL,
	"genre_scores" jsonb NOT NULL,
	"computed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "taste_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "taste_genres" ADD CONSTRAINT "taste_genres_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taste_profiles" ADD CONSTRAINT "taste_profiles_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Users who passed the placeholder taste step before phase 3 (testers only) choose real genres:
-- without a taste profile the onboarding taste step opens again.
UPDATE "profiles" SET "taste_completed_at" = NULL
WHERE "id" NOT IN (SELECT "user_id" FROM "taste_genres");
