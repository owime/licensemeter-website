import { defineConfig } from "drizzle-kit";
import { mkdirSync } from "node:fs";

const url = process.env.DATABASE_URL;

// PGlite creates its database directory but expects the ignored parent to
// exist. A fresh clone (including CI) has no .pglite directory yet.
if (!url) mkdirSync("./.pglite", { recursive: true });

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
