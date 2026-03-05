import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Creates a Drizzle DB instance from an explicit connection string.
 * The caller (factory/entry-point) is responsible for reading
 * DATABASE_URL from the environment so this module stays pure.
 */
export function createDatabase(connectionString: string) {
    // Disable prefetch — not supported for "Transaction" pool mode
    const client = postgres(connectionString, { prepare: false });
    return { db: drizzle(client, { schema }), client };
}
