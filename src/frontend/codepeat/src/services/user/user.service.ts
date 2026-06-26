/** User profile data access. Mock-backed; swap bodies for the generated client. */

import {MOCK_USERS} from "./user.mock.js";
import type {User} from "./user.types.js";

const NETWORK_DELAY_MS = 200;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch a single user's public profile by id. */
export async function fetchUser(id: string): Promise<User> {
    await delay(NETWORK_DELAY_MS);
    const user = MOCK_USERS.find((u) => u.id === id);
    if (user === undefined) {
        throw new Error(`Nutzer ${id} wurde nicht gefunden.`);
    }
    return structuredClone(user);
}
