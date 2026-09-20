import { db } from "../config";
import { stores } from "../config/schema";

async function main() {
    console.log("Seeding stores...");
    try {
        await db.insert(stores).values([
            { id: 0, name: 'Other', domainPattern: '*' },
            { id: 1, name: 'Steam', domainPattern: 'store.steampowered.com' },
            { id: 2, name: 'Epic Games', domainPattern: 'store.epicgames.com' },
            { id: 3, name: 'GOG', domainPattern: 'gog.com' },
            { id: 4, name: 'Xbox Store', domainPattern: 'xbox.com' },
            { id: 5, name: 'PlayStation Store', domainPattern: 'store.playstation.com' },
            { id: 6, name: 'Nintendo Store', domainPattern: 'nintendo.com' },
        ]).onConflictDoNothing();
        console.log("Stores seeded successfully.");
    } catch (e) {
        console.error("Error seeding stores:", e);
    }
    process.exit(0);
}

main();
