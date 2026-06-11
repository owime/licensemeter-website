import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;

// Real Postgres when DATABASE_URL is set, embedded PGlite otherwise (dev/demo).
export default url?.startsWith("postgres")
  ? defineConfig({
      dialect: "postgresql",
      schema: "./src/server/db/schema.ts",
      dbCredentials: { url },
    })
  : defineConfig({
      dialect: "postgresql",
      driver: "pglite",
      schema: "./src/server/db/schema.ts",
      dbCredentials: { url: "./.pglite/data" },
    });
