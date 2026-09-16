import { defineConfig } from "drizzle-kit";

// Versioned migrations are for new self-hosted databases. The existing hosted
// deployment keeps its separate, operator-managed schema workflow.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./docker/migrations",
});
