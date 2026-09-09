import { defineConfig } from "drizzle-kit";

// DATABASE_URL points at the Neon "savings-tracker" project. Local only.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
