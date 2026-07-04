/**
 * Auth & session access backed by django-allauth headless.
 *
 * We use the "browser" client variant, which relies on the Django session cookie + CSRF.
 * Because CodePeat is served same-origin by Django (under /codepeat/), that same session
 * cookie authenticates the DRF API as well.
 *
 * allauth signals auth state via HTTP status (401 = not/partly authenticated) and an
 * `{status, data, meta, errors}` envelope; the generated client throws on non-2xx, so the
 * helpers below read the envelope off the thrown response to tell flows from real errors.
 */

import backend from "../../backend.js";
import type {AuthenticatedResponse, ConfirmLoginCode, Login, RequestLoginCode, Signup, User as AllauthUser} from "../../auth-client/index.js";
import type {User, UserProgress} from "../user/user.types.js";
import type {LoginInput, PasswordChangeInput, RegistrationInput} from "./auth.types.js";

/** allauth headless client variant: cookie/session based (works same-origin with the DRF API). */
const CLIENT = "browser" as const;

/** Current CSRF token from the cookie (used for the provider-redirect form POST). */
function csrfToken(): string {
    return document.cookie.match(/csrftoken=([\w-]+)/)?.[1] ?? "";
}

/** A fresh account with no XP yet (also the fallback when progress can't be loaded). */
const ZERO_PROGRESS: UserProgress = {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100};

/** Map an allauth headless user to the frontend domain user. */
function toUser(user: AllauthUser, enrichment: Enrichment): User {
    return {
        id: user.id != null ? String(user.id) : user.username,
        handle: user.username,
        displayName: user.display?.trim() || user.username,
        email: user.email ?? "",
        progress: enrichment.progress,
        avatarUrl: enrichment.avatarUrl,
        verified: false,
        canCreateChallenges: enrichment.canCreateChallenges,
    };
}

/** Whether the current session may create challenges (lecturer/admin); false on any error. */
async function fetchCanCreateChallenges(): Promise<boolean> {
    try {
        const res = await backend.codepeat.challenges.codepeatChallengesCanCreateRetrieve();
        return res.canCreate;
    } catch {
        return false;
    }
}

/** The signed-in user's stored profile picture, or null when none is set / on error. */
export async function fetchAvatar(): Promise<string | null> {
    try {
        const res = await backend.codepeat.account.codepeatAccountAvatarRetrieve();
        return res.avatar;
    } catch {
        return null;
    }
}

/** Persist the chosen profile picture and return the stored value. */
export async function saveAvatar(avatar: string): Promise<string | null> {
    const res = await backend.codepeat.account.codepeatAccountSetAvatarCreate({avatar: {avatar}});
    return res.avatar;
}

/** The signed-in user's XP/level progress; zeroed on error. */
async function fetchProgress(): Promise<UserProgress> {
    try {
        const res = await backend.codepeat.account.codepeatAccountProgressRetrieve();
        return {level: res.level, xp: res.xp, xpIntoLevel: res.xpIntoLevel, xpForNextLevel: res.xpForNextLevel};
    } catch {
        return ZERO_PROGRESS;
    }
}

/** Extra per-user data resolved alongside the session. */
interface Enrichment {
    canCreateChallenges: boolean;
    avatarUrl: string | null;
    progress: UserProgress;
}

/** Resolve the capability, avatar and progress enrichments a domain user needs, in parallel. */
async function enrich(): Promise<Enrichment> {
    const [canCreateChallenges, avatarUrl, progress] = await Promise.all([
        fetchCanCreateChallenges(),
        fetchAvatar(),
        fetchProgress(),
    ]);
    return {canCreateChallenges, avatarUrl, progress};
}

/**
 * The HTTP `Response` carried by a thrown client error, or null.
 *
 * Both generated clients (auth-client and api-client) have their *own* `ResponseError`
 * class, so an `instanceof` check against a single import misses errors from the other
 * client. We detect the response structurally instead.
 */
function errorResponse(error: unknown): Response | null {
    const response = (error as {response?: unknown})?.response;
    return response instanceof Response ? response : null;
}

/** Read a thrown error's JSON body (allauth's `{status,data,meta,errors}` envelope or DRF errors). */
async function readEnvelope(error: unknown): Promise<Record<string, unknown> | null> {
    const response = errorResponse(error);
    return response ? response.json().catch(() => null) : null;
}

/** Whether the response lists a given pending flow (e.g. "verify_email"). */
function hasFlow(body: unknown, id: string): boolean {
    const flows = (body as {data?: {flows?: Array<{id?: string}>}})?.data?.flows;
    return Array.isArray(flows) && flows.some((flow) => flow?.id === id);
}

/** First human-readable error message from the envelope, if any. */
function firstErrorMessage(body: unknown): string | null {
    const errors = (body as {errors?: Array<{message?: string}>})?.errors;
    return errors?.[0]?.message ?? null;
}

/** Resolve the current session to a user, or null when anonymous. */
export async function fetchSession(): Promise<User | null> {
    try {
        const res: AuthenticatedResponse = await backend.authentication.currentSession.authApiClientV1AuthSessionGet({client: CLIENT});
        if (!res.meta.isAuthenticated) {
            return null;
        }
        return toUser(res.data.user, await enrich());
    } catch {
        return null; // 401 → not authenticated
    }
}

/** Authenticate with email + password and open a session. */
export async function login(input: LoginInput): Promise<User> {
    try {
        const res = await backend.authentication.account.authApiClientV1AuthLoginPost(
            {client: CLIENT, login: {email: input.email, password: input.password} as unknown as Login},
        );
        return toUser(res.data.user, await enrich());
    } catch (error) {
        const body = await readEnvelope(error);
        if (hasFlow(body, "verify_email")) {
            throw new Error("Bitte bestätige zuerst deine E-Mail-Adresse über den Link in der Mail.", {cause: error});
        }
        throw new Error(firstErrorMessage(body) ?? "Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.", {cause: error});
    }
}

/** Register an account; it stays unconfirmed until the emailed verification link is used. */
export async function register(input: RegistrationInput): Promise<void> {
    try {
        await backend.authentication.account.authApiClientV1AuthSignupPost(
            {client: CLIENT, signup: {email: input.email, username: input.username, password: input.password} as unknown as Signup},
        );
        // A 2xx would mean immediate authentication; with mandatory verification we land in catch.
    } catch (error) {
        const body = await readEnvelope(error);
        if (hasFlow(body, "verify_email")) {
            return; // signup accepted, verification email sent
        }
        throw new Error(firstErrorMessage(body) ?? "Registrierung fehlgeschlagen.", {cause: error});
    }
}

/** Confirm an email address from the key embedded in the verification link. */
export async function verifyEmail(key: string): Promise<void> {
    try {
        await backend.authentication.account.authApiClientV1AuthEmailVerifyPost({client: CLIENT, verifyEmail: {key}});
    } catch (error) {
        if (errorResponse(error)?.status === 401) {
            return; // email verified — the session simply isn't authenticated (e.g. a different browser)
        }
        const body = await readEnvelope(error);
        throw new Error(firstErrorMessage(body) ?? "Der Bestätigungslink ist ungültig oder abgelaufen.", {cause: error});
    }
}

/** Close the current session. */
export async function logout(): Promise<void> {
    try {
        await backend.authentication.currentSession.authApiClientV1AuthSessionDelete({client: CLIENT});
    } catch {
        // allauth returns 401 once the session is gone — already logged out.
    }
}

/**
 * Start a third-party login (e.g. GitHub) via a synchronous browser redirect.
 *
 * allauth's provider redirect must be a real form POST so the browser follows the 302 to the
 * provider; it cannot be an XHR. Same-origin paths are used, so the session cookie is shared.
 */
export function loginWithProvider(provider: string): void {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/auth-api/browser/v1/auth/provider/redirect";

    const fields: Record<string, string> = {
        provider,
        callback_url: "/codepeat/index.html#/challenges",
        process: "login",
        csrfmiddlewaretoken: csrfToken(),
    };
    for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
}

/** First DRF field-validation message from a `{field: [msg, ...]}` body, if any. */
function firstFieldError(body: unknown): string | null {
    if (body === null || typeof body !== "object") {
        return null;
    }
    for (const value of Object.values(body as Record<string, unknown>)) {
        if (typeof value === "string") {
            return value;
        }
        if (Array.isArray(value) && typeof value[0] === "string") {
            return value[0];
        }
    }
    return null;
}

// Login by one-time code (allauth login-by-code)

/** Request a one-time login code to be emailed; resolves once the code has been sent. */
export async function requestLoginCode(email: string): Promise<void> {
    try {
        await backend.authentication.loginByCode.authApiClientV1AuthCodeRequestPost(
            {client: CLIENT, requestLoginCode: {email} as unknown as RequestLoginCode},
        );
    } catch (error) {
        // allauth answers 401 with a pending "login by code" flow — that's the expected next step.
        if (errorResponse(error)?.status === 401) {
            return;
        }
        const body = await readEnvelope(error);
        throw new Error(firstErrorMessage(body) ?? "Code konnte nicht gesendet werden.", {cause: error});
    }
}

/** Confirm a one-time login code and open a session. */
export async function confirmLoginCode(code: string): Promise<User> {
    try {
        const res = await backend.authentication.loginByCode.authApiClientV1AuthCodeConfirmPost(
            {client: CLIENT, confirmLoginCode: {code} as ConfirmLoginCode},
        );
        return toUser(res.data.user, await enrich());
    } catch (error) {
        const body = await readEnvelope(error);
        throw new Error(firstErrorMessage(body) ?? "Der Code ist ungültig oder abgelaufen.", {cause: error});
    }
}

// Password reset (allauth "password forgotten")

/** Email a password-reset link; resolves once the mail has been queued. */
export async function requestPasswordReset(email: string): Promise<void> {
    try {
        await backend.authentication.passwordReset.authApiClientV1AuthPasswordRequestPost(
            {client: CLIENT, requestPassword: {email}},
        );
    } catch (error) {
        const body = await readEnvelope(error);
        throw new Error(firstErrorMessage(body) ?? "Die E-Mail konnte nicht gesendet werden.", {cause: error});
    }
}

/**
 * Set a new password from the key in the reset link. allauth does not sign the user in
 * afterwards (ACCOUNT_LOGIN_ON_PASSWORD_RESET is off), so a 401 means success — the reset
 * went through and the user now logs in with the new password. Only a 400 (invalid/expired
 * key or a rejected password) is a real error.
 */
export async function resetPassword(key: string, password: string): Promise<void> {
    try {
        await backend.authentication.passwordReset.authApiClientV1AuthPasswordResetPost(
            {client: CLIENT, resetPassword: {key, password}},
        );
    } catch (error) {
        if (errorResponse(error)?.status === 401) {
            return;
        }
        const body = await readEnvelope(error);
        throw new Error(firstErrorMessage(body) ?? "Das Passwort konnte nicht zurückgesetzt werden.", {cause: error});
    }
}

// Password change (email-confirmed, CodePeat-local flow)

/** Stage a password change and email a confirmation link; the change applies only once confirmed. */
export async function changePassword(input: PasswordChangeInput): Promise<void> {
    try {
        await backend.codepeat.account.codepeatAccountRequestPasswordChangeCreate(
            {passwordChangeRequest: {currentPassword: input.currentPassword, newPassword: input.newPassword}},
        );
    } catch (error) {
        const body = await readEnvelope(error);
        throw new Error(firstFieldError(body) ?? "Passwortänderung fehlgeschlagen.", {cause: error});
    }
}

/** Confirm a staged password change via the token from the emailed link. */
export async function confirmPasswordChange(token: string): Promise<void> {
    try {
        await backend.codepeat.account.codepeatAccountConfirmPasswordChangeCreate({passwordChangeConfirm: {token}});
    } catch (error) {
        const body = await readEnvelope(error);
        const detail = (body as {detail?: string})?.detail;
        throw new Error(detail ?? "Der Bestätigungslink ist ungültig oder abgelaufen.", {cause: error});
    }
}

/** Email the signed-in user a confirmation link to delete their account (also used to resend). */
export async function requestAccountDeletion(): Promise<void> {
    await backend.codepeat.account.codepeatAccountRequestDeletionCreate();
}

/** Cancel a pending deletion; any outstanding confirmation link becomes invalid. */
export async function cancelAccountDeletion(): Promise<void> {
    await backend.codepeat.account.codepeatAccountCancelDeletionCreate();
}

/** Whether a deletion confirmation is currently pending for the signed-in user. */
export async function fetchDeletionStatus(): Promise<boolean> {
    try {
        const res = await backend.codepeat.account.codepeatAccountDeletionStatusRetrieve();
        return res.pending;
    } catch {
        return false;
    }
}

/** Confirm account deletion via the token from the emailed link; the account is removed. */
export async function confirmAccountDeletion(token: string): Promise<void> {
    try {
        await backend.codepeat.account.codepeatAccountConfirmDeletionCreate({accountDeletionConfirm: {token}});
    } catch (error) {
        const body = await readEnvelope(error);
        const detail = (body as {detail?: string})?.detail;
        throw new Error(detail ?? "Der Bestätigungslink ist ungültig oder abgelaufen.", {cause: error});
    }
}
