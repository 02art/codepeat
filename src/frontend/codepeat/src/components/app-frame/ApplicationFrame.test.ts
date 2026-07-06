import {render, screen} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {push} = vi.hoisted(() => ({push: vi.fn()}));
vi.mock("svelte-spa-router", async () => ({
    default: (await import("./RouterStub.svelte")).default,
    push,
}));
vi.mock("../routes.js", () => ({default: {}}));

import {currentUser, sessionReady} from "../../services/user/user.store.js";
import ApplicationFrame from "./ApplicationFrame.svelte";

function authenticate() {
    currentUser.set({id: "1", handle: "sam", displayName: "Sam", email: "s@e.de",
        progress: {level: 2, xp: 40, xpIntoLevel: 10, xpForNextLevel: 200}, avatarUrl: null, canCreateChallenges: false});
}

beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set(null);
    sessionReady.set(true);
});

describe("ApplicationFrame", () => {
    it("shows the primary navigation for an authenticated user", async () => {
        window.location.hash = "#/challenges";
        authenticate();
        render(ApplicationFrame);
        expect(await screen.findAllByRole("link", {name: /challenges/i})).not.toHaveLength(0);
        expect(screen.getByTestId("router-outlet")).toBeInTheDocument();
    });

    it("redirects a guest away from a protected route", async () => {
        window.location.hash = "#/settings";
        currentUser.set(null);
        sessionReady.set(true);
        render(ApplicationFrame);
        await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    });
});
