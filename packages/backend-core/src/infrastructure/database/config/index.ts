/**
 * Database index — the single env-reading entry point for the database layer.
 * All repositories import { db } from this file, keeping connection.ts pure.
 */
import { createDatabase } from "./connection";

const connectionString =
    process.env.DATABASE_URL ||
    "postgres://postgres:password@localhost:5432/hydradb";

const globalForDb = globalThis as unknown as {
    __dbCache: ReturnType<typeof createDatabase> | undefined;
};

const cache = globalForDb.__dbCache ?? createDatabase(connectionString);

if (process.env.NODE_ENV !== 'production') {
    globalForDb.__dbCache = cache;
}

export const { db, client } = cache;
