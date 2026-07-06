import {describe, expect, it} from "vitest";

import type {Challenge} from "../../../services/challenges/challenges.types.js";
import type {FilterPredicate} from "./challenges.types.js";
const ALL_PREDICATE: FilterPredicate = {kind: "all"};
import {
    completedCount,
    difficultyBadgeClass,
    difficultyClass,
    difficultyLabel,
    filterChallenges,
    sortChallenges,
} from "./challenges.utils.js";
import type {SortOption} from "./challenges.types.js";

function challenge(overrides: Partial<Challenge> = {}): Challenge {
    return {
        id: "1",
        title: "Two Sum",
        description: "Find two numbers",
        difficulty: "easy",
        favorited: false,
        solved: false,
        createdBy: "",
        official: true,
        categories: ["Array"],
        isNew: false,
        createdAt: "2026-01-01",
        views: 0,
        ...overrides,
    };
}

describe("difficulty helpers", () => {
    it("labels each difficulty", () => {
        expect(difficultyLabel("easy")).toBe("Einfach");
        expect(difficultyLabel("hard")).toBe("Schwer");
    });

    it("returns a class for the difficulty text and badge", () => {
        expect(difficultyClass("easy")).toContain("success");
        expect(difficultyBadgeClass("hard")).toContain("error");
    });
});

describe("filterChallenges", () => {
    const list = [
        challenge({id: "1", title: "Two Sum", difficulty: "easy", categories: ["Array"], official: true, createdBy: ""}),
        challenge({id: "2", title: "Word Ladder", difficulty: "hard", categories: ["Graph"], official: false, createdBy: "42", isNew: true}),
        challenge({id: "3", title: "Valid Parentheses", difficulty: "medium", categories: ["Stack"], official: true, solved: true, createdBy: ""}),
    ];

    it("returns everything for the 'all' predicate", () => {
        expect(filterChallenges(list, "", ALL_PREDICATE, null)).toHaveLength(3);
    });

    it("filters official (CodePeat) challenges", () => {
        const result = filterChallenges(list, "", {kind: "official"}, null);
        expect(result.map((c) => c.id)).toEqual(["1", "3"]);
    });

    it("filters by difficulty", () => {
        expect(filterChallenges(list, "", {kind: "difficulty", value: "hard"}, null).map((c) => c.id)).toEqual(["2"]);
    });

    it("filters by category", () => {
        expect(filterChallenges(list, "", {kind: "category", value: "Graph"}, null).map((c) => c.id)).toEqual(["2"]);
    });

    it("filters new challenges", () => {
        expect(filterChallenges(list, "", {kind: "new"}, null).map((c) => c.id)).toEqual(["2"]);
    });

    it("filters own challenges by the current user id", () => {
        expect(filterChallenges(list, "", {kind: "own"}, "42").map((c) => c.id)).toEqual(["2"]);
    });

    it("searches title, description and categories", () => {
        expect(filterChallenges(list, "ladder", ALL_PREDICATE, null).map((c) => c.id)).toEqual(["2"]);
        expect(filterChallenges(list, "graph", ALL_PREDICATE, null).map((c) => c.id)).toEqual(["2"]);
        expect(filterChallenges(list, "nothing-here", ALL_PREDICATE, null)).toHaveLength(0);
    });
});

describe("sortChallenges", () => {
    const list = [
        challenge({id: "a", difficulty: "hard", views: 3, createdAt: "2026-01-01"}),
        challenge({id: "b", difficulty: "easy", views: 9, createdAt: "2026-03-01"}),
        challenge({id: "c", difficulty: "medium", views: 1, createdAt: "2026-02-01"}),
    ];

    it("keeps API order when sort is null", () => {
        expect(sortChallenges(list, null).map((c) => c.id)).toEqual(["a", "b", "c"]);
    });

    it("sorts by views descending (most popular first)", () => {
        const sort: SortOption = {key: "popular", label: "", field: "views", direction: "desc"};
        expect(sortChallenges(list, sort).map((c) => c.id)).toEqual(["b", "a", "c"]);
    });

    it("sorts by difficulty ascending", () => {
        const sort: SortOption = {key: "difficulty", label: "", field: "difficulty", direction: "asc"};
        expect(sortChallenges(list, sort).map((c) => c.id)).toEqual(["b", "c", "a"]);
    });

    it("sorts by creation date descending", () => {
        const sort: SortOption = {key: "newest", label: "", field: "createdAt", direction: "desc"};
        expect(sortChallenges(list, sort).map((c) => c.id)).toEqual(["b", "c", "a"]);
    });
});

describe("completedCount", () => {
    it("counts solved challenges", () => {
        expect(completedCount([challenge({solved: true}), challenge({solved: false}), challenge({solved: true})])).toBe(2);
    });
});
