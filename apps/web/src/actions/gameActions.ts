"use server";

import { revalidatePath } from "next/cache";
import { PostgresGameRepository } from "@hydra/infrastructure";

// Instantiate the repository (Clean Architecture boundary)
const repository = new PostgresGameRepository();

export async function toggleWantToPlayAction(title: string, currentState: boolean) {
    try {
        const newState = !currentState;
        await repository.setWantToPlay(title, newState);
        revalidatePath("/");
        return { success: true, newState };
    } catch (error) {
        console.error("Failed to toggle want to play:", error);
        return { success: false, error: "Database error" };
    }
}

export async function toggleIgnoredAction(title: string, currentState: boolean) {
    try {
        const newState = !currentState;
        await repository.setIgnored(title, newState);
        revalidatePath("/");
        return { success: true, newState };
    } catch (error) {
        console.error("Failed to toggle ignored:", error);
        return { success: false, error: "Database error" };
    }
}

export async function getAllPreferences() {
    try {
        const preferences = await repository.getAllPreferences();
        return preferences;
    } catch (error) {
        console.error("Failed to get preferences:", error);
        return [];
    }
}

import { PostgresGameDataRepository } from "@hydra/infrastructure";
const dataRepository = new PostgresGameDataRepository();

export async function fetchMoreGamesAction(offset: number, limit: number = 50) {
    try {
        const games = await dataRepository.getGamesPaginated({ offset, limit });
        return { success: true, games };
    } catch (error) {
        console.error("Failed to fetch more games:", error);
        return { success: false, error: "Database error", games: [] };
    }
}
