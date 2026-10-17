CREATE TABLE "periods" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "periods_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text,
	CONSTRAINT "periods_user_id_start_date_unique" UNIQUE("user_id","start_date"),
	CONSTRAINT "periods_end_after_start" CHECK ("periods"."end_date" is null or "periods"."end_date" >= "periods"."start_date")
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "weight_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"date" text NOT NULL,
	"weight" real NOT NULL,
	CONSTRAINT "weight_entries_user_id_date_unique" UNIQUE("user_id","date"),
	CONSTRAINT "weight_entries_weight_positive" CHECK ("weight_entries"."weight" > 0)
);
--> statement-breakpoint
ALTER TABLE "periods" ADD CONSTRAINT "periods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;