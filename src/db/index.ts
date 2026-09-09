import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export { schema };
export type Db = ReturnType<typeof drizzle>;

// Lazily initialized so build-time imports don't throw when DATABASE_URL is absent.
let _db: Db | undefined;

export function getDb(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = drizzle(neon(url), { schema });
  }
  return _db;
}

// Proxy so callers can write `db.select(...)` as before.
export const db = new Proxy({} as Db, {
  get(_, prop: string | symbol) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
