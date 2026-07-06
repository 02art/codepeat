import {render, screen} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("../../../services/auth/auth.service.js", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../../../services/auth/auth.service.js")>()),
    fetchDeletionStatus: vi.fn().mockResolvedValue(false),
    requestAccountDeletion: vi.fn().mockResolvedValue(undefined),
    cancelAccountDeletion: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn().mockResolvedValue(undefined),
}));

import * as authService from "../../../services/auth/auth.service.js";
import {currentUser} from "../../../services/user/user.store.js";
import ProfileSettingsPage from "./ProfileSettingsPage.svelte";

const auth = vi.mocked(authService);

beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set({id: "1", handle: "sam", displayName: "Sam Smith", email: "sam@example.com",
        progress: {level: 3, xp: 100, xpIntoLevel: 20, xpForNextLevel: 300}, avatarUrl: null, canCreateChallenges: false});
});

describe("ProfileSettingsPage", () => {
    it("shows the current user's profile details", async () => {
        render(ProfileSettingsPage);
        expect(screen.getByText("Profilinformationen")).toBeInTheDocument();
        expect(screen.getByText("sam")).toBeInTheDocument();
        expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    });

    it("checks the deletion status on mount", async () => {
        render(ProfileSettingsPage);
        await vi.waitFor(() => expect(auth.fetchDeletionStatus).toHaveBeenCalled());
    });
});
