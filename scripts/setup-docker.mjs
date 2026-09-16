import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const example = await readFile(
  new URL("../.env.docker.example", import.meta.url),
  "utf8",
);
const configured = example.replace(/__GENERATE_SECRET__/g, () =>
  randomBytes(32).toString("hex"),
);
// Never overwrite an existing deployment's encryption key or database password.
try {
  await writeFile(new URL("../.env.docker", import.meta.url), configured, {
    flag: "wx",
    mode: 0o600,
  });
  console.log("Created .env.docker with unique secrets. Review it, then run:");
  console.log("docker compose --env-file .env.docker up --build -d");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.error(".env.docker already exists. Keeping it unchanged.");
  process.exitCode = 1;
}
