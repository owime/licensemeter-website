CREATE TABLE "saas_connections" (
	"tenant_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"org_ref" text NOT NULL,
	"client_id" text,
	"secret_enc" text NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_sync_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saas_connections_tenant_id_provider_pk" PRIMARY KEY("tenant_id","provider")
);
--> statement-breakpoint
CREATE TABLE "saas_seats" (
	"tenant_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_active_at" timestamp with time zone,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saas_seats_tenant_id_provider_email_pk" PRIMARY KEY("tenant_id","provider","email")
);
--> statement-breakpoint
ALTER TABLE "saas_connections" ADD CONSTRAINT "saas_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_seats" ADD CONSTRAINT "saas_seats_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;