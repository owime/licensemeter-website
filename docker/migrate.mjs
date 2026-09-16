import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  await client`select pg_advisory_lock(742036159)`;
  await migrate(drizzle(client), { migrationsFolder: "./docker/migrations" });
  console.log("Database migrations complete.");
} finally {
  await client`select pg_advisory_unlock(742036159)`;
  await client.end();
}
