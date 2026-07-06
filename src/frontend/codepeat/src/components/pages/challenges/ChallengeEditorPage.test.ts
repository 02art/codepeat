import {render, screen, fireEvent} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {push} = vi.hoisted(() => ({push: vi.fn()}));
vi.mock("svelte-spa-router", () => ({push}));
vi.mock("../../../services/challenges/challenges.service.js", () => ({
    createChallenge: vi.fn().mockResolvedValue("new-id"),
    updateChallenge: vi.fn().mockResolvedValue(undefined),
    deleteChallenge: vi.fn().mockResolvedValue(undefined),
    fetchChallengeDraft: vi.fn(),
    createInviteLink: vi.fn(),
}));
vi.mock("../../../services/reflections/reflection.service.js", () => ({
    fetchChallengeQuestions: vi.fn().mockResolvedValue([]),
    replaceReflectionQuestions: vi.fn().mockResolvedValue(undefined),
}));

import * as challengeService from "../../../services/challenges/challenges.service.js";
import {currentUser} from "../../../services/user/user.store.js";
import ChallengeEditorPage from "./ChallengeEditorPage.svelte";

const service = vi.mocked(challengeService);

function teacher() {
    currentUser.set({id: "9", handle: "prof", displayName: "Prof", email: "p@e.de",
        progress: {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100}, avatarUrl: null, canCreateChallenges: true});
}

beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set(null);
});

describe("ChallengeEditorPage", () => {
    it("redirects a non-teacher away from the editor", async () => {
        currentUser.set({id: "1", handle: "sam", displayName: "Sam", email: "s@e.de",
            progress: {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100}, avatarUrl: null, canCreateChallenges: false});
        render(ChallengeEditorPage, {props: {params: {}}});
        await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/challenges"));
    });

    it("renders the create form for a teacher", async () => {
        teacher();
        render(ChallengeEditorPage, {props: {params: {}}});
        expect(await screen.findByPlaceholderText(/titel wird in der challenge-übersicht/i)).toBeInTheDocument();
    });

    it("switches to the settings tab", async () => {
        teacher();
        render(ChallengeEditorPage, {props: {params: {}}});
        await screen.findByPlaceholderText(/titel wird/i);
        await fireEvent.click(screen.getByRole("button", {name: /einstellungen/i}));
        expect(await screen.findByText(/Private Challenge/i)).toBeInTheDocument();
    });
});
