import {beforeEach, describe, expect, it, vi} from "vitest";

import backend from "../../backend.js";
import * as auth from "./auth.service.js";

vi.mock("../../backend.js", () => {
    const fn = () => vi.fn();
    return {
        default: {
            authentication: {
                currentSession: {authApiClientV1AuthSessionGet: fn(), authApiClientV1AuthSessionDelete: fn()},
                account: {
                    authApiClientV1AuthLoginPost: fn(),
                    authApiClientV1AuthSignupPost: fn(),
                    authApiClientV1AuthEmailVerifyPost: fn(),
                },
                loginByCode: {authApiClientV1AuthCodeRequestPost: fn(), authApiClientV1AuthCodeConfirmPost: fn()},
                passwordReset: {authApiClientV1AuthPasswordRequestPost: fn(), authApiClientV1AuthPasswordResetPost: fn()},
            },
            codepeat: {
                challenges: {codepeatChallengesCanCreateRetrieve: fn()},
                account: {
                    codepeatAccountAvatarRetrieve: fn(),
                    codepeatAccountSetAvatarCreate: fn(),
                    codepeatAccountProgressRetrieve: fn(),
                    codepeatAccountRequestPasswordChangeCreate: fn(),
                    codepeatAccountConfirmPasswordChangeCreate: fn(),
                    codepeatAccountRequestDeletionCreate: fn(),
                    codepeatAccountCancelDeletionCreate: fn(),
                    codepeatAccountDeletionStatusRetrieve: fn(),
                    codepeatAccountConfirmDeletionCreate: fn(),
                },
            },
        },
    };
});

const authApi = backend.authentication as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>;
const account = backend.codepeat.account as unknown as Record<string, ReturnType<typeof vi.fn>>;
const challenges = backend.codepeat.challenges as unknown as Record<string, ReturnType<typeof vi.fn>>;

/** A rejected client call carrying an HTTP Response, as the generated clients throw. */
function reject(status: number, body: unknown = {}) {
    return Promise.reject({response: new Response(JSON.stringify(body), {status})});
}

const ALLAUTH_USER = {id: 7, username: "sam", display: "Sam", email: "sam@example.com"};

beforeEach(() => {
    vi.clearAllMocks();
    // Successful enrichment by default.
    challenges.codepeatChallengesCanCreateRetrieve.mockResolvedValue({canCreate: true});
    account.codepeatAccountAvatarRetrieve.mockResolvedValue({avatar: "PB/avatar-1.jpg"});
    account.codepeatAccountProgressRetrieve.mockResolvedValue({level: 2, xp: 50, xpIntoLevel: 10, xpForNextLevel: 200});
});

describe("fetchSession", () => {
    it("maps an authenticated session to a domain user", async () => {
        authApi.currentSession.authApiClientV1AuthSessionGet.mockResolvedValue({meta: {isAuthenticated: true}, data: {user: ALLAUTH_USER}});
        const user = await auth.fetchSession();
        expect(user).toMatchObject({id: "7", handle: "sam", displayName: "Sam", canCreateChallenges: true, avatarUrl: "PB/avatar-1.jpg"});
        expect(user?.progress.level).toBe(2);
    });

    it("returns null when the session is not authenticated", async () => {
        authApi.currentSession.authApiClientV1AuthSessionGet.mockResolvedValue({meta: {isAuthenticated: false}, data: {}});
        expect(await auth.fetchSession()).toBeNull();
    });

    it("returns null when the session lookup fails", async () => {
        authApi.currentSession.authApiClientV1AuthSessionGet.mockReturnValue(reject(401));
        expect(await auth.fetchSession()).toBeNull();
    });
});

describe("login", () => {
    it("returns the user on success", async () => {
        authApi.account.authApiClientV1AuthLoginPost.mockResolvedValue({data: {user: ALLAUTH_USER}});
        expect((await auth.login({email: "sam@example.com", password: "x"})).handle).toBe("sam");
    });

    it("asks the user to verify their email when that flow is pending", async () => {
        authApi.account.authApiClientV1AuthLoginPost.mockReturnValue(reject(401, {data: {flows: [{id: "verify_email"}]}}));
        await expect(auth.login({email: "a@b.de", password: "x"})).rejects.toThrow(/E-Mail-Adresse/);
    });

    it("surfaces the first server error message", async () => {
        authApi.account.authApiClientV1AuthLoginPost.mockReturnValue(reject(400, {errors: [{message: "Falsche Daten"}]}));
        await expect(auth.login({email: "a@b.de", password: "x"})).rejects.toThrow("Falsche Daten");
    });
});

describe("register", () => {
    it("resolves when signup triggers the verify-email flow", async () => {
        authApi.account.authApiClientV1AuthSignupPost.mockReturnValue(reject(401, {data: {flows: [{id: "verify_email"}]}}));
        await expect(auth.register({email: "a@b.de", username: "u", password: "x"})).resolves.toBeUndefined();
    });

    it("throws on a real signup error", async () => {
        authApi.account.authApiClientV1AuthSignupPost.mockReturnValue(reject(400, {errors: [{message: "Name vergeben"}]}));
        await expect(auth.register({email: "a@b.de", username: "u", password: "x"})).rejects.toThrow("Name vergeben");
    });
});

describe("verifyEmail", () => {
    it("resolves on success", async () => {
        authApi.account.authApiClientV1AuthEmailVerifyPost.mockResolvedValue({});
        await expect(auth.verifyEmail("key")).resolves.toBeUndefined();
    });

    it("treats a 401 as verified", async () => {
        authApi.account.authApiClientV1AuthEmailVerifyPost.mockReturnValue(reject(401));
        await expect(auth.verifyEmail("key")).resolves.toBeUndefined();
    });

    it("throws on an invalid key", async () => {
        authApi.account.authApiClientV1AuthEmailVerifyPost.mockReturnValue(reject(400, {errors: [{message: "ungültig"}]}));
        await expect(auth.verifyEmail("key")).rejects.toThrow("ungültig");
    });
});

describe("logout", () => {
    it("swallows the 401 allauth returns once logged out", async () => {
        authApi.currentSession.authApiClientV1AuthSessionDelete.mockReturnValue(reject(401));
        await expect(auth.logout()).resolves.toBeUndefined();
    });
});

describe("login by code", () => {
    it("treats the 401 pending flow as a sent code", async () => {
        authApi.loginByCode.authApiClientV1AuthCodeRequestPost.mockReturnValue(reject(401));
        await expect(auth.requestLoginCode("a@b.de")).resolves.toBeUndefined();
    });

    it("throws when the code cannot be sent", async () => {
        authApi.loginByCode.authApiClientV1AuthCodeRequestPost.mockReturnValue(reject(400, {errors: [{message: "kaputt"}]}));
        await expect(auth.requestLoginCode("a@b.de")).rejects.toThrow("kaputt");
    });

    it("confirms a code and returns the user", async () => {
        authApi.loginByCode.authApiClientV1AuthCodeConfirmPost.mockResolvedValue({data: {user: ALLAUTH_USER}});
        expect((await auth.confirmLoginCode("1234-5678")).handle).toBe("sam");
    });

    it("throws on an invalid code", async () => {
        authApi.loginByCode.authApiClientV1AuthCodeConfirmPost.mockReturnValue(reject(400, {}));
        await expect(auth.confirmLoginCode("bad")).rejects.toThrow(/Code/);
    });
});

describe("password reset", () => {
    it("requests a reset email", async () => {
        authApi.passwordReset.authApiClientV1AuthPasswordRequestPost.mockResolvedValue({});
        await expect(auth.requestPasswordReset("a@b.de")).resolves.toBeUndefined();
    });

    it("throws when the reset email fails", async () => {
        authApi.passwordReset.authApiClientV1AuthPasswordRequestPost.mockReturnValue(reject(400, {errors: [{message: "no"}]}));
        await expect(auth.requestPasswordReset("a@b.de")).rejects.toThrow("no");
    });

    it("treats a 401 after resetting the password as success", async () => {
        authApi.passwordReset.authApiClientV1AuthPasswordResetPost.mockReturnValue(reject(401));
        await expect(auth.resetPassword("key", "New1!aaa")).resolves.toBeUndefined();
    });

    it("throws on an expired/invalid key (400)", async () => {
        authApi.passwordReset.authApiClientV1AuthPasswordResetPost.mockReturnValue(reject(400, {errors: [{message: "abgelaufen"}]}));
        await expect(auth.resetPassword("key", "New1!aaa")).rejects.toThrow("abgelaufen");
    });
});

describe("password change (codepeat flow)", () => {
    it("stages a change", async () => {
        account.codepeatAccountRequestPasswordChangeCreate.mockResolvedValue({});
        await expect(auth.changePassword({currentPassword: "a", newPassword: "New1!aaa"})).resolves.toBeUndefined();
    });

    it("surfaces a DRF field error", async () => {
        account.codepeatAccountRequestPasswordChangeCreate.mockReturnValue(reject(400, {currentPassword: ["ist falsch"]}));
        await expect(auth.changePassword({currentPassword: "x", newPassword: "y"})).rejects.toThrow("ist falsch");
    });

    it("confirms a staged change", async () => {
        account.codepeatAccountConfirmPasswordChangeCreate.mockResolvedValue({});
        await expect(auth.confirmPasswordChange("tok")).resolves.toBeUndefined();
    });

    it("surfaces the detail on a bad token", async () => {
        account.codepeatAccountConfirmPasswordChangeCreate.mockReturnValue(reject(400, {detail: "abgelaufen"}));
        await expect(auth.confirmPasswordChange("tok")).rejects.toThrow("abgelaufen");
    });
});

describe("account deletion", () => {
    it("requests and cancels deletion", async () => {
        account.codepeatAccountRequestDeletionCreate.mockResolvedValue({});
        account.codepeatAccountCancelDeletionCreate.mockResolvedValue({});
        await expect(auth.requestAccountDeletion()).resolves.toBeUndefined();
        await expect(auth.cancelAccountDeletion()).resolves.toBeUndefined();
    });

    it("reports the pending status, false on error", async () => {
        account.codepeatAccountDeletionStatusRetrieve.mockResolvedValue({pending: true});
        expect(await auth.fetchDeletionStatus()).toBe(true);
        account.codepeatAccountDeletionStatusRetrieve.mockReturnValue(reject(500));
        expect(await auth.fetchDeletionStatus()).toBe(false);
    });

    it("confirms deletion and surfaces the detail on error", async () => {
        account.codepeatAccountConfirmDeletionCreate.mockResolvedValue({});
        await expect(auth.confirmAccountDeletion("tok")).resolves.toBeUndefined();
        account.codepeatAccountConfirmDeletionCreate.mockReturnValue(reject(400, {detail: "ungültig"}));
        await expect(auth.confirmAccountDeletion("tok")).rejects.toThrow("ungültig");
    });
});

describe("avatar", () => {
    it("reads the stored avatar, null on error", async () => {
        account.codepeatAccountAvatarRetrieve.mockResolvedValue({avatar: "PB/x.jpg"});
        expect(await auth.fetchAvatar()).toBe("PB/x.jpg");
        account.codepeatAccountAvatarRetrieve.mockReturnValue(reject(500));
        expect(await auth.fetchAvatar()).toBeNull();
    });

    it("saves an avatar", async () => {
        account.codepeatAccountSetAvatarCreate.mockResolvedValue({avatar: "PB/y.jpg"});
        expect(await auth.saveAvatar("PB/y.jpg")).toBe("PB/y.jpg");
    });
});

describe("enrichment fallbacks", () => {
    it("zeroes progress and clears capabilities when enrichment calls fail", async () => {
        authApi.currentSession.authApiClientV1AuthSessionGet.mockResolvedValue({meta: {isAuthenticated: true}, data: {user: ALLAUTH_USER}});
        challenges.codepeatChallengesCanCreateRetrieve.mockReturnValue(reject(500));
        account.codepeatAccountAvatarRetrieve.mockReturnValue(reject(500));
        account.codepeatAccountProgressRetrieve.mockReturnValue(reject(500));
        const user = await auth.fetchSession();
        expect(user).toMatchObject({canCreateChallenges: false, avatarUrl: null});
        expect(user?.progress).toEqual({level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100});
    });
});

describe("loginWithProvider", () => {
    it("submits a hidden form to the allauth redirect endpoint", () => {
        const submit = vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(() => {});
        auth.loginWithProvider("github");
        expect(submit).toHaveBeenCalled();
        const form = document.querySelector("form");
        expect(form?.action).toContain("/auth-api/browser/v1/auth/provider/redirect");
        expect(form?.querySelector('input[name="provider"]')?.getAttribute("value")).toBe("github");
        submit.mockRestore();
    });
});
