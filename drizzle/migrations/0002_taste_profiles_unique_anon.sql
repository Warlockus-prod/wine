DROP INDEX "taste_profiles_anon_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "taste_profiles_anon_idx" ON "taste_profiles" USING btree ("anonymous_id");