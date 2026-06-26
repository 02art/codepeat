import {writable} from "svelte/store";

import * as auth from "../auth/auth.service.js";
import type {RegistrationInput} from "../auth/auth.types.js";

import type {User} from "./user.types.js";

/** The authenticated user, or `null` while loading or when anonymous. */
export const currentUser = writable<User | null>(null);

void auth.fetchSession()
    .then((user) => currentUser.set(user))
    .catch(() => currentUser.set(null));

/** Authenticate and reflect the user in {@link currentUser}. */
export async function login(): Promise<void> {
    currentUser.set(await auth.login());
}

/** Update the current user's profile picture. */
export function setAvatar(avatarUrl: string): void {
    currentUser.update((user) => (user ? {...user, avatarUrl} : user));
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
