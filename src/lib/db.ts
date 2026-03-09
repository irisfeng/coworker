import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type AppDb = LibSQLDatabase<typeof schema> | BetterSQLite3Database<typeof schema>;

let dbPromise: Promise<AppDb> | undefined;

async function createDb(): Promise<AppDb> {
  const url = process.env.TURSO_DATABASE_URL || "file:coworker.db";

  if (url.startsWith("file:")) {
    const Database = (await import("better-sqlite3")).default;
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const client = new Database(url.slice("file:".length) || "coworker.db");
    return drizzle(client, { schema });
  }

  const { createClient } = await import("@libsql/client/node");
  const { drizzle } = await import("drizzle-orm/libsql/node");

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return drizzle(client, { schema });
}

export function getDb() {
  dbPromise ??= createDb();
  return dbPromise;
}
