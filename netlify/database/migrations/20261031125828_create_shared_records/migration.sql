CREATE TABLE "shared_records" (
	"collection" text,
	"record_id" text,
	"data" jsonb,
	"deleted" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shared_records_pkey" PRIMARY KEY("collection","record_id")
);
--> statement-breakpoint
CREATE INDEX "shared_records_updated_at_idx" ON "shared_records" ("updated_at");