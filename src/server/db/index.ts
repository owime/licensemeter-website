import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";

import { env } from "~/env";
import * as schema from "./schema";

export type Db = PostgresJsDatabase<typeof schema>;

/**
 * Real Postgres when DATABASE_URL is set; embedded PGlite otherwise (dev/demo).
 * Both drivers expose the same Drizzle query API for everything this app uses,
 * so the PGlite instance is intentionally typed as the postgres-js database.
 */
const createDb = (): Db => {
  if (env.DATABASE_URL) {
    const client = postgres(env.DATABASE_URL, { prepare: false });
    return drizzlePostgres(client, { schema });
  }
  const client = new PGlite("./.pglite/data");
  return drizzlePglite(client, { schema }) as unknown as Db;
};

/** Cache the connection in dev so Next.js HMR doesn't open a new one per reload. */
const globalForDb = globalThis as unknown as { db?: Db };

export const db: Db = globalForDb.db ?? createDb();

if (env.NODE_ENV !== "production") globalForDb.db = db;

export { schema };
