import {describe, expect, it} from "vitest";

import {toChallenge, toChallengeDetail} from "./challenges.mapper.js";

function apiChallenge(overrides: Record<string, unknown> = {}) {
    return {
        id: "c1",
        name: "Two Sum",
        description: "Line one\nLine two",
        difficulty: "medium",
        createdBy: null,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        categories: ["Array", "Hashing"],
        views: 12,
        constraints: "n <= 100\n1 <= x",
        exampleLanguage: "Java",
        exampleInput: "[2,7]",
        exampleOutput: "[0,1]",
        isSolved: true,
        isFavorited: false,
        ...overrides,
    } as never;
}

describe("toChallenge", () => {
    it("maps the core fields and per-user state", () => {
        const challenge = toChallenge(apiChallenge());
        expect(challenge).toMatchObject({
            id: "c1",
            title: "Two Sum",
            difficulty: "medium",
            official: true,
            categories: ["Array", "Hashing"],
            views: 12,
            solved: true,
            favorited: false,
        });
        expect(challenge.createdAt).toBe("2026-01-01");
    });

    it("marks a challenge with a creator as non-official", () => {
        expect(toChallenge(apiChallenge({createdBy: 42})).official).toBe(false);
        expect(toChallenge(apiChallenge({createdBy: 42})).createdBy).toBe("42");
    });

    it("resolves the creator id from an expanded user object", () => {
        expect(toChallenge(apiChallenge({createdBy: {id: 5, username: "lena"}})).createdBy).toBe("5");
    });

    it("flags recently created challenges as new", () => {
        const recent = new Date().toISOString();
        expect(toChallenge(apiChallenge({createdAt: new Date(recent)})).isNew).toBe(true);
        expect(toChallenge(apiChallenge({createdAt: new Date("2020-01-01")})).isNew).toBe(false);
    });

    it("defaults missing categories to an empty array", () => {
        expect(toChallenge(apiChallenge({categories: undefined})).categories).toEqual([]);
    });
});

describe("toChallengeDetail", () => {
    it("shows system challenges (no creator) as CodePeat", () => {
        const detail = toChallengeDetail(apiChallenge({createdBy: null}));
        expect(detail.creator).toMatchObject({displayName: "CodePeat", verified: true});
    });

    it("shows admin-authored challenges as CodePeat", () => {
        const detail = toChallengeDetail(apiChallenge({createdBy: {id: 1, username: "root", is_staff: true}}));
        expect(detail.creator.displayName).toBe("CodePeat");
    });

    it("shows teacher-authored challenges with their name", () => {
        const detail = toChallengeDetail(apiChallenge({createdBy: {id: 2, username: "lena", full_name: "Lena Lang", is_staff: false}}));
        expect(detail.creator).toMatchObject({displayName: "Lena Lang", verified: false});
    });

    it("splits description and constraints into bullet lines", () => {
        const detail = toChallengeDetail(apiChallenge());
        expect(detail.tasks).toEqual(["Line one", "Line two"]);
        expect(detail.constraints).toEqual(["n <= 100", "1 <= x"]);
    });

    it("builds the worked example when input/output are present", () => {
        const detail = toChallengeDetail(apiChallenge());
        expect(detail.example).toMatchObject({language: "Java", input: "[2,7]", output: "[0,1]"});
    });

    it("returns no example when input and output are empty", () => {
        const detail = toChallengeDetail(apiChallenge({exampleInput: "", exampleOutput: ""}));
        expect(detail.example).toBeNull();
    });
});
