import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";

const MIGRATIONS_DIR = path.join(__dirname, "../../drizzle");
const connectionString =
    process.env.DATABASE_URL ||
    "postgres://postgres:password@localhost:5432/hydradb";

/**
 * Runs all pending Drizzle migrations against the configured database.
 * Intended to be executed as a one-off startup step (not at runtime).
 */
async function runMigrations(): Promise<void> {
    // Use a dedicated short-lived client for migrations (max 1 connection)
    const migrationClient = postgres(connectionString, { max: 1 });
    const db = drizzle(migrationClient);

    console.log("▶  Running database migrations...");
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    console.log("✔  Migrations applied successfully.");

    await migrationClient.end();
}

runMigrations().catch((err) => {
    console.error("✖  Migration failed:", err);
    process.exit(1);
});
