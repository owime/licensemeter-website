CREATE TABLE "consent_states" (
	"state" text PRIMARY KEY NOT NULL,
	"oid" text NOT NULL,
	"tid" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"dedupe_key" text NOT NULL,
	"rule" text NOT NULL,
	"graph_user_id" text,
	"sku_id" text,
	"title" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"monthly_impact_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"oid" text,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_book" (
	"tenant_id" uuid NOT NULL,
	"sku_id" text NOT NULL,
	"monthly_price_cents" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'default' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_book_tenant_id_sku_id_pk" PRIMARY KEY("tenant_id","sku_id")
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"day" date NOT NULL,
	"total_monthly_spend_cents" integer DEFAULT 0 NOT NULL,
	"total_monthly_waste_cents" integer DEFAULT 0 NOT NULL,
	"purchased_seats" integer DEFAULT 0 NOT NULL,
	"assigned_seats" integer DEFAULT 0 NOT NULL,
	"by_sku" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "tenant_skus" (
	"tenant_id" uuid NOT NULL,
	"sku_id" text NOT NULL,
	"sku_part_number" text NOT NULL,
	"display_name" text,
	"prepaid_enabled" integer DEFAULT 0 NOT NULL,
	"prepaid_suspended" integer DEFAULT 0 NOT NULL,
	"prepaid_warning" integer DEFAULT 0 NOT NULL,
	"consumed_units" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_skus_tenant_id_sku_id_pk" PRIMARY KEY("tenant_id","sku_id")
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"tenant_id" uuid NOT NULL,
	"graph_id" text NOT NULL,
	"upn" text NOT NULL,
	"display_name" text,
	"account_enabled" boolean DEFAULT true NOT NULL,
	"user_type" text,
	"created_date_time" timestamp with time zone,
	"last_interactive_sign_in" timestamp with time zone,
	"last_non_interactive_sign_in" timestamp with time zone,
	"last_activity" timestamp with time zone,
	"workload_activity" jsonb,
	"licenses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_users_tenant_id_graph_id_pk" PRIMARY KEY("tenant_id","graph_id")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tid" text NOT NULL,
	"name" text,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"concealed_names" boolean,
	"has_p1" boolean,
	"activity_signal" text,
	"copilot_signal" text,
	"usage_aggregate" jsonb,
	"copilot_aggregate" jsonb,
	"is_demo" boolean DEFAULT false NOT NULL,
	"consented_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_book" ADD CONSTRAINT "price_book_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_skus" ADD CONSTRAINT "tenant_skus_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "findings_tenant_dedupe_idx" ON "findings" USING btree ("tenant_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "findings_tenant_status_idx" ON "findings" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_tenant_email_idx" ON "memberships" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "memberships_oid_idx" ON "memberships" USING btree ("oid");--> statement-breakpoint
CREATE UNIQUE INDEX "snapshots_tenant_day_idx" ON "snapshots" USING btree ("tenant_id","day");--> statement-breakpoint
CREATE INDEX "sync_runs_tenant_idx" ON "sync_runs" USING btree ("tenant_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_runs_one_running_idx" ON "sync_runs" USING btree ("tenant_id") WHERE "sync_runs"."status" = 'running';--> statement-breakpoint
CREATE INDEX "tenant_users_upn_idx" ON "tenant_users" USING btree ("tenant_id","upn");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_tid_idx" ON "tenants" USING btree ("tid");