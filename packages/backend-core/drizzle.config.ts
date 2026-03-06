import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/infrastructure/database/config/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/hydradb",
    },
});
