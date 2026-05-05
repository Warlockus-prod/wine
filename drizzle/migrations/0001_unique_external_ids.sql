DROP INDEX "dishes_external_idx";--> statement-breakpoint
DROP INDEX "wines_external_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "dishes_external_unique" ON "dishes" USING btree ("restaurant_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wines_external_unique" ON "wines" USING btree ("restaurant_id","external_id");