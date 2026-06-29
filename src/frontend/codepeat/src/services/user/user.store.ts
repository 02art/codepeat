import {writable} from "svelte/store";

import * as auth from "../auth/auth.service.js";
import type {LoginInput, RegistrationInput} from "../auth/auth.types.js";

import type {User} from "./user.types.js";

/** The authenticated user, or `null` while loading or when anonymous. */
export const currentUser = writable<User | null>(null);

/**
 * Whether the initial session lookup has completed. Route guards must wait for this
 * before deciding, otherwise a logged-in user reloading a protected page would be
 * bounced to the login screen while the session is still being resolved.
 */
export const sessionReady = writable(false);

void auth.fetchSession()
    .then((user) => currentUser.set(user))
    .catch(() => currentUser.set(null))
    .finally(() => sessionReady.set(true));

/** Re-read the session from the backend and reflect it in {@link currentUser}. */
export async function refreshSession(): Promise<void> {
    currentUser.set(await auth.fetchSession());
}

/** Authenticate and reflect the user in {@link currentUser}. */
export async function login(input: LoginInput): Promise<void> {
    currentUser.set(await auth.login(input));
}

/** Request a one-time login code to be emailed. */
export async function requestLoginCode(email: string): Promise<void> {
    await auth.requestLoginCode(email);
}

/** Confirm a one-time login code and reflect the user in {@link currentUser}. */
export async function loginWithCode(code: string): Promise<void> {
    currentUser.set(await auth.confirmLoginCode(code));
}

/** Persist the current user's profile picture and reflect it in {@link currentUser}. */
export async function setAvatar(avatar: string): Promise<void> {
    const saved = await auth.saveAvatar(avatar);
    currentUser.update((user) => (user ? {...user, avatarUrl: saved} : user));
}

/** End the session and clear {@link currentUser}. */
export async function logout(): Promise<void> {
    await auth.logout();
    currentUser.set(null);
}

/** Register a new account; session stays anonymous until the email is confirmed. */
export async function register(input: RegistrationInput): Promise<void> {
    await auth.register(input);
}
