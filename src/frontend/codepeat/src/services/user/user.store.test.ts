import {get} from "svelte/store";
import {beforeEach, describe, expect, it, vi} from "vitest";

import * as authService from "../auth/auth.service.js";
import type {User} from "./user.types.js";

vi.mock("../auth/auth.service.js", () => ({
    fetchSession: vi.fn().mockResolvedValue(null),
    login: vi.fn(),
    requestLoginCode: vi.fn(),
    confirmLoginCode: vi.fn(),
    requestPasswordReset: vi.fn(),
    saveAvatar: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
}));

const auth = vi.mocked(authService);

function sampleUser(overrides: Partial<User> = {}): User {
    return {
        id: "1", handle: "sam", displayName: "Sam", email: "sam@example.com",
        progress: {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100},
        avatarUrl: null, canCreateChallenges: false, ...overrides,
    };
}

// Import after the mock is registered so the module-load fetchSession uses the mock.
const store = await import("./user.store.js");

beforeEach(() => vi.clearAllMocks());

describe("session lifecycle", () => {
    it("reflects a refreshed session in currentUser", async () => {
        auth.fetchSession.mockResolvedValue(sampleUser());
        await store.refreshSession();
        expect(get(store.currentUser)?.handle).toBe("sam");
    });

    it("logs in and stores the user", async () => {
        auth.login.mockResolvedValue(sampleUser({handle: "lena"}));
        await store.login({email: "lena@example.com", password: "x"});
        expect(auth.login).toHaveBeenCalledWith({email: "lena@example.com", password: "x"});
        expect(get(store.currentUser)?.handle).toBe("lena");
    });

    it("logs in with a one-time code", async () => {
        auth.confirmLoginCode.mockResolvedValue(sampleUser({handle: "codeuser"}));
        await store.loginWithCode("1234-5678");
        expect(get(store.currentUser)?.handle).toBe("codeuser");
    });

    it("clears the user on logout", async () => {
        auth.login.mockResolvedValue(sampleUser());
        await store.login({email: "a@b.de", password: "x"});
        await store.logout();
        expect(get(store.currentUser)).toBeNull();
    });
});

describe("thin wrappers", () => {
    it("requests a login code", async () => {
        await store.requestLoginCode("a@b.de");
        expect(auth.requestLoginCode).toHaveBeenCalledWith("a@b.de");
    });

    it("requests a password reset", async () => {
        await store.requestPasswordReset("a@b.de");
        expect(auth.requestPasswordReset).toHaveBeenCalledWith("a@b.de");
    });

    it("registers a new account without opening a session", async () => {
        await store.register({email: "a@b.de", username: "u", password: "x"});
        expect(auth.register).toHaveBeenCalled();
        expect(get(store.currentUser)).toBeNull();
    });
});

describe("setAvatar", () => {
    it("persists and reflects the new avatar on the current user", async () => {
        auth.login.mockResolvedValue(sampleUser());
        await store.login({email: "a@b.de", password: "x"});
        auth.saveAvatar.mockResolvedValue("PB/avatar-3.jpg");
        await store.setAvatar("PB/avatar-3.jpg");
        expect(get(store.currentUser)?.avatarUrl).toBe("PB/avatar-3.jpg");
    });
});
