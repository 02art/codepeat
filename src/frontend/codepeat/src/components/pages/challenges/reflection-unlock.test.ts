import {render, screen} from "@testing-library/svelte";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {push} = vi.hoisted(() => ({push: vi.fn()}));
vi.mock("svelte-spa-router", () => ({push}));
vi.mock("../../../services/challenges/challenges.service.js", () => ({
    fetchChallenge: vi.fn(),
    unlockChallenge: vi.fn(),
}));
vi.mock("../../../services/reflections/reflection.service.js", () => ({
    fetchQuestionsForFilling: vi.fn(),
    saveReflection: vi.fn().mockResolvedValue(undefined),
}));

import * as challengeService from "../../../services/challenges/challenges.service.js";
import * as reflectionService from "../../../services/reflections/reflection.service.js";
import type {ChallengeDetail} from "../../../services/challenges/challenges.types.js";
import ReflectionPage from "./ReflectionPage.svelte";
import ChallengeUnlockPage from "./ChallengeUnlockPage.svelte";

const challenges = vi.mocked(challengeService);
const reflections = vi.mocked(reflectionService);

function detail(): ChallengeDetail {
    return {
        id: "c1", title: "Two Sum", description: "d", difficulty: "easy", favorited: false, solved: false,
        createdBy: "", official: true, categories: [], isNew: false, createdAt: "2026-01-01", views: 0,
        creator: {displayName: "CodePeat", avatarUrl: null, verified: true}, tasks: [], constraints: [], example: null,
    };
}

beforeEach(() => vi.clearAllMocks());

describe("ReflectionPage", () => {
    it("renders the first reflection question", async () => {
        window.location.hash = "#/challenges/c1/reflection?submission=s1&xp=pending";
        challenges.fetchChallenge.mockResolvedValue(detail());
        reflections.fetchQuestionsForFilling.mockResolvedValue([
            {id: "q1", text: "Was war schwierig?", kind: "text", options: []},
        ]);
        render(ReflectionPage, {props: {params: {id: "c1"}}});
        expect(await screen.findByText("Was war schwierig?")).toBeInTheDocument();
    });
});

describe("ChallengeUnlockPage", () => {
    it("redeems the token and navigates to the challenge", async () => {
        challenges.unlockChallenge.mockResolvedValue("c9");
        render(ChallengeUnlockPage, {props: {params: {id: "c9", token: "tok"}}});
        await vi.waitFor(() => expect(challenges.unlockChallenge).toHaveBeenCalledWith("tok"));
        await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/challenges/c9"));
    });

    it("shows an error when the token is invalid", async () => {
        challenges.unlockChallenge.mockRejectedValue(new Error("ungültig"));
        render(ChallengeUnlockPage, {props: {params: {id: "c9", token: "bad"}}});
        expect(await screen.findByText(/ungültig|fehlgeschlagen|nicht/i)).toBeInTheDocument();
    });
});
