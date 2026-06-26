/** Auth & session access. Mock-backed; swap bodies for the generated client, call sites stay. */

import {fetchUser} from "../user/user.service.js";
import type {User} from "../user/user.types.js";
import {INITIAL_SESSION_USER_ID, LOGIN_USER_ID} from "./auth.mock.js";
import type {PasswordChangeInput, RegistrationInput} from "./auth.types.js";

const NETWORK_DELAY_MS = 200;

let sessionUserId: string | null = INITIAL_SESSION_USER_ID;
let accountDeletionRequested = false;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Resolve the current session to a user, or `null` when anonymous. */
export async function fetchSession(): Promise<User | null> {
    await delay(NETWORK_DELAY_MS);
    if (sessionUserId === null) {
        return null;
    }
    return fetchUser(sessionUserId);
}

/** Authenticate and open a session for the current user. */
export async function login(): Promise<User> {
    await delay(NETWORK_DELAY_MS);
    sessionUserId = LOGIN_USER_ID;
    return fetchUser(sessionUserId);
}

/** Close the current session. */
export async function logout(): Promise<void> {
    await delay(NETWORK_DELAY_MS);
    sessionUserId = null;
}

/** Register an account; stays unconfirmed until the emailed link is used. */
export async function register(input: RegistrationInput): Promise<void> {
    await delay(NETWORK_DELAY_MS);
    if (input.email.trim() === "" || input.username.trim() === "" || input.password === "") {
        throw new Error("Bitte fülle alle Pflichtfelder aus.");
    }
}

/** Request a password change; applied only after the emailed confirmation. */
export async function changePassword(input: PasswordChangeInput): Promise<void> {
    await delay(NETWORK_DELAY_MS);
    if (input.currentPassword === "" || input.newPassword === "") {
        throw new Error("Bitte fülle beide Passwortfelder aus.");
    }
}

/** Request account deletion; removed only after the emailed confirmation. */
export async function requestAccountDeletion(): Promise<void> {
    await delay(NETWORK_DELAY_MS);
    accountDeletionRequested = true;
}

/** Whether an unconfirmed account-deletion request is pending. */
export function isAccountDeletionRequested(): boolean {
    return accountDeletionRequested;
}
