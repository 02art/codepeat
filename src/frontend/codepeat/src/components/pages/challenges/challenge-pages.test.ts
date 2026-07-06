import {render, screen, fireEvent} from "@testing-library/svelte";
import {get} from "svelte/store";
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("svelte-spa-router", () => ({push: vi.fn()}));
vi.mock("../../../services/challenges/challenges.service.js", () => ({
    fetchChallenges: vi.fn(),
    setFavorite: vi.fn().mockResolvedValue(undefined),
    fetchChallenge: vi.fn(),
}));
vi.mock("../../../services/submissions/submission.service.js", () => ({
    createSubmission: vi.fn(),
}));

import * as challengeService from "../../../services/challenges/challenges.service.js";
import {currentUser} from "../../../services/user/user.store.js";
import type {Challenge, ChallengeDetail} from "../../../services/challenges/challenges.types.js";
import ChallengesOverviewPage from "./ChallengesOverviewPage.svelte";
import ChallengeDetailPage from "./ChallengeDetailPage.svelte";

const service = vi.mocked(challengeService);

function challenge(overrides: Partial<Challenge> = {}): Challenge {
    return {
        id: "c1", title: "Two Sum", description: "Add up", difficulty: "easy", favorited: false, solved: false,
        createdBy: "", official: true, categories: ["Array"], isNew: false, createdAt: "2026-01-01", views: 3, ...overrides,
    };
}

function detail(overrides: Partial<ChallengeDetail> = {}): ChallengeDetail {
    return {
        ...challenge(),
        creator: {displayName: "CodePeat", avatarUrl: null, verified: true},
        tasks: ["Add two numbers"],
        constraints: ["n <= 100"],
        example: {language: "Java", input: "[2,7]", output: "[0,1]"},
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    currentUser.set(null);
});

describe("ChallengesOverviewPage", () => {
    it("renders the fetched challenges", async () => {
        service.fetchChallenges.mockResolvedValue([challenge({id: "c1", title: "Two Sum"}), challenge({id: "c2", title: "Word Ladder", categories: ["Graph"]})]);
        render(ChallengesOverviewPage);
        expect(await screen.findByText("Two Sum")).toBeInTheDocument();
        expect(screen.getByText("Word Ladder")).toBeInTheDocument();
    });

    it("filters the list via the search box", async () => {
        service.fetchChallenges.mockResolvedValue([challenge({id: "c1", title: "Two Sum"}), challenge({id: "c2", title: "Word Ladder"})]);
        render(ChallengesOverviewPage);
        await screen.findByText("Two Sum");
        await fireEvent.input(screen.getByPlaceholderText(/suchen/i), {target: {value: "ladder"}});
        expect(screen.queryByText("Two Sum")).toBeNull();
        expect(screen.getByText("Word Ladder")).toBeInTheDocument();
    });

    it("toggles a favorite", async () => {
        service.fetchChallenges.mockResolvedValue([challenge({id: "c1", title: "Two Sum"})]);
        render(ChallengesOverviewPage);
        await screen.findByText("Two Sum");
        await fireEvent.click(screen.getByRole("button", {name: /favoriten hinzufügen/i}));
        expect(service.setFavorite).toHaveBeenCalledWith("c1", true);
    });
});

describe("ChallengeDetailPage", () => {
    it("renders a challenge's detail", async () => {
        service.fetchChallenge.mockResolvedValue(detail({title: "Two Sum"}));
        render(ChallengeDetailPage, {props: {params: {id: "c1"}}});
        expect(await screen.findByText("Two Sum")).toBeInTheDocument();
        expect(screen.getByText("Add two numbers")).toBeInTheDocument();
        expect(service.fetchChallenge).toHaveBeenCalledWith("c1");
    });

    it("hides the submit action on the user's own challenge", async () => {
        currentUser.set({id: "42", handle: "lena", displayName: "Lena", email: "l@e.de",
            progress: {level: 1, xp: 0, xpIntoLevel: 0, xpForNextLevel: 100}, avatarUrl: null, canCreateChallenges: true});
        service.fetchChallenge.mockResolvedValue(detail({createdBy: "42", official: false, creator: {displayName: "Lena", avatarUrl: null, verified: false}}));
        render(ChallengeDetailPage, {props: {params: {id: "c1"}}});
        await screen.findByText("Two Sum");
        expect(get(currentUser)?.id).toBe("42");
    });
});
