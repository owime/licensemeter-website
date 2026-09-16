CREATE TABLE "adobe_connections" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_enc" text NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_sync_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adobe_users" (
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "adobe_users_tenant_id_email_pk" PRIMARY KEY("tenant_id","email")
);
--> statement-breakpoint
CREATE TABLE "ai_spend_daily" (
	"tenant_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"day" date NOT NULL,
	"category" text NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_spend_daily_tenant_id_provider_day_category_pk" PRIMARY KEY("tenant_id","provider","day","category"),
	CONSTRAINT "ai_spend_daily_amount_nonneg" CHECK ("ai_spend_daily"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_oid" text NOT NULL,
	"actor_email" text,
	"action" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_states" (
	"state" text PRIMARY KEY NOT NULL,
	"oid" text,
	"tid" text,
	"workos_user_id" text,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "email_signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"welcome_sent_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"source" text DEFAULT 'landing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"remediation_status" text DEFAULT 'unassigned' NOT NULL,
	"assignee_membership_id" uuid,
	"due_date" date,
	"workflow_note" text,
	"ticket_url" text,
	"remediation_requested_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "findings_monthly_impact_nonneg" CHECK ("findings"."monthly_impact_cents" >= 0),
	CONSTRAINT "findings_remediation_status_check" CHECK ("findings"."remediation_status" in ('unassigned', 'planned', 'requested', 'in_progress'))
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"oid" text,
	"workos_user_id" text,
	"email" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'viewer' NOT NULL,
	"welcome_tour_at" timestamp with time zone,
	"data_tour_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_role_check" CHECK ("memberships"."role" in ('viewer', 'admin', 'owner'))
);
--> statement-breakpoint
CREATE TABLE "ms_connections" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"tid" text NOT NULL,
	"app_client_id" text,
	"cred_type" text,
	"secret_enc" text,
	"cert_thumbprint" text,
	"secret_expires_at" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"last_verify_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ms_connections_mode_check" CHECK ("ms_connections"."mode" in ('managed', 'byo')),
	CONSTRAINT "ms_connections_mode_columns_check" CHECK (("ms_connections"."mode" = 'byo' and "ms_connections"."app_client_id" is not null and "ms_connections"."cred_type" is not null and "ms_connections"."secret_enc" is not null) or ("ms_connections"."mode" = 'managed' and "ms_connections"."app_client_id" is null and "ms_connections"."cred_type" is null and "ms_connections"."secret_enc" is null))
);
--> statement-breakpoint
CREATE TABLE "msp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"owner_workos_user_id" text,
	"owner_oid" text,
	"stripe_customer_id" text,
	"subscription_status" text,
	"paid_until" timestamp with time zone,
	"comped_at" timestamp with time zone,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"interval" text,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"last_event_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "msp_accounts_quantity_nonneg" CHECK ("msp_accounts"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ops_alerts" (
	"key" text PRIMARY KEY NOT NULL,
	"last_sent_at" timestamp with time zone NOT NULL,
	"suppressed_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_book" (
	"tenant_id" uuid NOT NULL,
	"sku_id" text NOT NULL,
	"monthly_price_cents" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'default' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_book_tenant_id_sku_id_pk" PRIMARY KEY("tenant_id","sku_id"),
	CONSTRAINT "price_book_monthly_price_nonneg" CHECK ("price_book"."monthly_price_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "seen_signins" (
	"oid" text PRIMARY KEY NOT NULL,
	"tid" text NOT NULL,
	"upn" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"signin_count" integer DEFAULT 1 NOT NULL
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
	"by_sku" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "snapshots_total_monthly_spend_nonneg" CHECK ("snapshots"."total_monthly_spend_cents" >= 0),
	CONSTRAINT "snapshots_total_monthly_waste_nonneg" CHECK ("snapshots"."total_monthly_waste_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"tier" text,
	"interval" text,
	"status" text NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"last_event_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"tid" text,
	"name" text,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"currency_rate_ppm" integer DEFAULT 1000000 NOT NULL,
	"workos_org_id" text,
	"domain" text,
	"allow_domain_join" boolean DEFAULT false NOT NULL,
	"concealed_names" boolean,
	"has_p1" boolean,
	"inactive_days" integer DEFAULT 90 NOT NULL,
	"renewal_date" date,
	"leak_alerts" boolean DEFAULT true NOT NULL,
	"monthly_report" boolean DEFAULT false NOT NULL,
	"activity_signal" text,
	"copilot_signal" text,
	"usage_aggregate" jsonb,
	"copilot_aggregate" jsonb,
	"is_demo" boolean DEFAULT false NOT NULL,
	"consented_at" timestamp with time zone,
	"trial_started_at" timestamp with time zone,
	"stripe_customer_id" text,
	"subscription_status" text,
	"paid_until" timestamp with time zone,
	"comped_at" timestamp with time zone,
	"trial_reminders" boolean DEFAULT true NOT NULL,
	"msp_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_currency_supported" CHECK ("tenants"."currency" in ('EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'DKK', 'NOK', 'SEK', 'PLN', 'CZK')),
	CONSTRAINT "tenants_currency_rate_positive" CHECK ("tenants"."currency_rate_ppm" > 0)
);
--> statement-breakpoint
CREATE TABLE "vendor_renewals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vendor" text NOT NULL,
	"contract_name" text NOT NULL,
	"renewal_date" date NOT NULL,
	"notice_days" integer DEFAULT 30 NOT NULL,
	"annual_value_cents" integer DEFAULT 0 NOT NULL,
	"owner_membership_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_renewals_notice_days_range" CHECK ("vendor_renewals"."notice_days" between 0 and 365),
	CONSTRAINT "vendor_renewals_annual_value_nonneg" CHECK ("vendor_renewals"."annual_value_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "adobe_connections" ADD CONSTRAINT "adobe_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adobe_users" ADD CONSTRAINT "adobe_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_spend_daily" ADD CONSTRAINT "ai_spend_daily_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_assignee_membership_id_memberships_id_fk" FOREIGN KEY ("assignee_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ms_connections" ADD CONSTRAINT "ms_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_book" ADD CONSTRAINT "price_book_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_connections" ADD CONSTRAINT "saas_connections_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saas_seats" ADD CONSTRAINT "saas_seats_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_runs" ADD CONSTRAINT "sync_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_skus" ADD CONSTRAINT "tenant_skus_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_msp_account_id_msp_accounts_id_fk" FOREIGN KEY ("msp_account_id") REFERENCES "public"."msp_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_renewals" ADD CONSTRAINT "vendor_renewals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_renewals" ADD CONSTRAINT "vendor_renewals_owner_membership_id_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_tenant_idx" ON "audit_log" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_signups_email_idx" ON "email_signups" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "findings_tenant_dedupe_idx" ON "findings" USING btree ("tenant_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "findings_tenant_status_idx" ON "findings" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "findings_tenant_remediation_idx" ON "findings" USING btree ("tenant_id","remediation_status");--> statement-breakpoint
CREATE INDEX "findings_assignee_idx" ON "findings" USING btree ("assignee_membership_id");--> statement-breakpoint
CREATE INDEX "findings_tenant_user_idx" ON "findings" USING btree ("tenant_id","graph_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_tenant_email_idx" ON "memberships" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "memberships_oid_idx" ON "memberships" USING btree ("oid");--> statement-breakpoint
CREATE INDEX "memberships_workos_user_idx" ON "memberships" USING btree ("workos_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ms_connections_tid_idx" ON "ms_connections" USING btree ("tid");--> statement-breakpoint
CREATE UNIQUE INDEX "msp_accounts_stripe_customer_idx" ON "msp_accounts" USING btree ("stripe_customer_id") WHERE "msp_accounts"."stripe_customer_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "msp_accounts_stripe_subscription_idx" ON "msp_accounts" USING btree ("stripe_subscription_id") WHERE "msp_accounts"."stripe_subscription_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "msp_accounts_owner_workos_user_idx" ON "msp_accounts" USING btree ("owner_workos_user_id") WHERE "msp_accounts"."owner_workos_user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "msp_accounts_owner_oid_idx" ON "msp_accounts" USING btree ("owner_oid") WHERE "msp_accounts"."owner_oid" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "snapshots_tenant_day_idx" ON "snapshots" USING btree ("tenant_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_customer_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "sync_runs_tenant_idx" ON "sync_runs" USING btree ("tenant_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_runs_one_running_idx" ON "sync_runs" USING btree ("tenant_id") WHERE "sync_runs"."status" = 'running';--> statement-breakpoint
CREATE INDEX "tenant_users_upn_idx" ON "tenant_users" USING btree ("tenant_id","upn");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_tid_idx" ON "tenants" USING btree ("tid") WHERE "tenants"."tid" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_workos_org_idx" ON "tenants" USING btree ("workos_org_id") WHERE "tenants"."workos_org_id" is not null;--> statement-breakpoint
CREATE INDEX "tenants_domain_idx" ON "tenants" USING btree ("domain") WHERE "tenants"."domain" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_stripe_customer_idx" ON "tenants" USING btree ("stripe_customer_id") WHERE "tenants"."stripe_customer_id" is not null;--> statement-breakpoint
CREATE INDEX "tenants_msp_account_idx" ON "tenants" USING btree ("msp_account_id") WHERE "tenants"."msp_account_id" is not null;--> statement-breakpoint
CREATE INDEX "vendor_renewals_tenant_date_idx" ON "vendor_renewals" USING btree ("tenant_id","renewal_date");--> statement-breakpoint
CREATE INDEX "vendor_renewals_owner_idx" ON "vendor_renewals" USING btree ("owner_membership_id");