/** In-memory fixtures backing the auth service. Read only via that service. */

/** Active session at boot, or `null` to start anonymous (preview the logged-out UI). */
export const INITIAL_SESSION_USER_ID: string | null = "u1";

/** User id a successful mock login resolves to. */
export const LOGIN_USER_ID = "u1";
