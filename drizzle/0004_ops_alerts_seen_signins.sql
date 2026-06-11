CREATE TABLE "ops_alerts" (
	"key" text PRIMARY KEY NOT NULL,
	"last_sent_at" timestamp with time zone NOT NULL,
	"suppressed_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seen_signins" (
	"oid" text PRIMARY KEY NOT NULL,
	"tid" text NOT NULL,
	"upn" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"signin_count" integer DEFAULT 1 NOT NULL
);
