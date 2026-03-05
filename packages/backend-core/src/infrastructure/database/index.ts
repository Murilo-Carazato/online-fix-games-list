/**
 * Database index — the single env-reading entry point for the database layer.
 * All repositories import { db } from this file, keeping connection.ts pure.
 */
import { createDatabase } from "./connection";

const connectionString =
    process.env.DATABASE_URL ||
    "postgres://postgres:password@localhost:5432/hydradb";

export const { db, client } = createDatabase(connectionString);
