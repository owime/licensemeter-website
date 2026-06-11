import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type {
  AggregateUsage,
  FindingStatus,
  MembershipRole,
  SyncRunStatus,
  SyncStep,
  UserLicense,
  WasteRuleId,
  WorkloadActivity,
} from "~/server/types";

/** One row per connected Microsoft 365 tenant (the unit of isolation everywhere). */
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Entra tenant id (tid claim). */
    tid: text("tid").notNull(),
    name: text("name"),
    currency: text("currency").notNull().default("EUR"),
    /** Capabilities discovered during sync; null until first sync. */
    concealedNames: boolean("concealed_names"),
    hasP1: boolean("has_p1"),
    /** Signal quality from the last sync; lets price edits re-run analysis offline. */
    activitySignal: text("activity_signal").$type<"full" | "none">(),
    copilotSignal: text("copilot_signal").$type<"per-user" | "aggregate" | "none">(),
    usageAggregate: jsonb("usage_aggregate").$type<AggregateUsage>(),
    copilotAggregate: jsonb("copilot_aggregate").$type<AggregateUsage>(),
    isDemo: boolean("is_demo").notNull().default(false),
    consentedAt: timestamp("consented_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("tenants_tid_idx").on(t.tid)],
);

/** Who may sign in to which tenant workspace, and as what. */
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    /** Entra object id; null until an invited email signs in for the first time. */
    oid: text("oid"),
    email: text("email").notNull(),
    name: text("name"),
    role: text("role").$type<MembershipRole>().notNull().default("viewer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_tenant_email_idx").on(t.tenantId, t.email),
    index("memberships_oid_idx").on(t.oid),
  ],
);

/** Short-lived nonces for the admin-consent redirect, bound to the initiating user. */
export const consentStates = pgTable("consent_states", {
  state: text("state").primaryKey(),
  oid: text("oid").notNull(),
  /** The initiator's sign-in tenant; the granted tenant must match it (v1: one workspace per tenant). */
  tid: text("tid").notNull(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

/** Latest subscribedSkus snapshot per tenant. */
export const tenantSkus = pgTable(
  "tenant_skus",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    skuId: text("sku_id").notNull(),
    skuPartNumber: text("sku_part_number").notNull(),
    displayName: text("display_name"),
    prepaidEnabled: integer("prepaid_enabled").notNull().default(0),
    prepaidSuspended: integer("prepaid_suspended").notNull().default(0),
    prepaidWarning: integer("prepaid_warning").notNull().default(0),
    consumedUnits: integer("consumed_units").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.skuId] })],
);

/** Latest directory + activity snapshot per user per tenant. */
export const tenantUsers = pgTable(
  "tenant_users",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    graphId: text("graph_id").notNull(),
    upn: text("upn").notNull(),
    displayName: text("display_name"),
    accountEnabled: boolean("account_enabled").notNull().default(true),
    userType: text("user_type"),
    createdDateTime: timestamp("created_date_time", { withTimezone: true }),
    lastInteractiveSignIn: timestamp("last_interactive_sign_in", {
      withTimezone: true,
    }),
    lastNonInteractiveSignIn: timestamp("last_non_interactive_sign_in", {
      withTimezone: true,
    }),
    /** Max across sign-ins and workload activity; the signal waste rules use. */
    lastActivity: timestamp("last_activity", { withTimezone: true }),
    workloadActivity: jsonb("workload_activity").$type<WorkloadActivity>(),
    licenses: jsonb("licenses").$type<UserLicense[]>().notNull().default([]),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.tenantId, t.graphId] }),
    index("tenant_users_upn_idx").on(t.tenantId, t.upn),
  ],
);

/** Editable monthly price per SKU per tenant; prefilled from the static catalog. */
export const priceBook = pgTable(
  "price_book",
  {
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    skuId: text("sku_id").notNull(),
    monthlyPriceCents: integer("monthly_price_cents").notNull().default(0),
    /** "default" = catalog estimate, "custom" = entered by the customer. */
    source: text("source").$type<"default" | "custom">().notNull().default("default"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.tenantId, t.skuId] })],
);

export const findings = pgTable(
  "findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    /** Stable identity of a finding across syncs: rule|userId|skuId. */
    dedupeKey: text("dedupe_key").notNull(),
    rule: text("rule").$type<WasteRuleId>().notNull(),
    graphUserId: text("graph_user_id"),
    skuId: text("sku_id"),
    title: text("title").notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    monthlyImpactCents: integer("monthly_impact_cents").notNull().default(0),
    status: text("status").$type<FindingStatus>().notNull().default("open"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("findings_tenant_dedupe_idx").on(t.tenantId, t.dedupeKey),
    index("findings_tenant_status_idx").on(t.tenantId, t.status),
  ],
);

export const syncRuns = pgTable(
  "sync_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    status: text("status").$type<SyncRunStatus>().notNull().default("running"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    steps: jsonb("steps").$type<SyncStep[]>().notNull().default([]),
    error: text("error"),
  },
  (t) => [
    index("sync_runs_tenant_idx").on(t.tenantId, t.startedAt),
    // Concurrency lock: at most one running sync per tenant.
    uniqueIndex("sync_runs_one_running_idx")
      .on(t.tenantId)
      .where(sql`${t.status} = 'running'`),
  ],
);

/** Launch-update / security-one-pager requests from the landing page. */
export const emailSignups = pgTable(
  "email_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    source: text("source").notNull().default("landing"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("email_signups_email_idx").on(t.email)],
);

/** One row per tenant per day for trend lines. */
export const snapshots = pgTable(
  "snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    totalMonthlySpendCents: integer("total_monthly_spend_cents").notNull().default(0),
    totalMonthlyWasteCents: integer("total_monthly_waste_cents").notNull().default(0),
    purchasedSeats: integer("purchased_seats").notNull().default(0),
    assignedSeats: integer("assigned_seats").notNull().default(0),
    bySku: jsonb("by_sku")
      .$type<Record<string, { purchased: number; assigned: number }>>()
      .notNull()
      .default({}),
  },
  (t) => [uniqueIndex("snapshots_tenant_day_idx").on(t.tenantId, t.day)],
);
