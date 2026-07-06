import {describe, expect, it} from "vitest";

import {QUICK_FILTERS, SORT_OPTIONS} from "./challenges.config.js";
import {challengesViewState} from "./challenges.view-state.js";

describe("QUICK_FILTERS", () => {
    it("offers the structural and topic filters, each with a real predicate", () => {
        const keys = QUICK_FILTERS.map((f) => f.key);
        expect(keys).toContain("all");
        expect(keys).toContain("codepeat");
        expect(keys).toContain("own");
        for (const filter of QUICK_FILTERS) {
            expect(filter.predicate.kind).toBeTruthy();
            expect(filter.label.length).toBeGreaterThan(0);
        }
    });

    it("uses LeetCode-style topic names, not forced German", () => {
        const labels = QUICK_FILTERS.map((f) => f.label);
        expect(labels).toContain("Two Pointers");
        expect(labels).toContain("Binary Search");
        expect(labels).not.toContain("Zwei Zeiger");
    });
});

describe("SORT_OPTIONS", () => {
    it("sorts popularity by the real views field", () => {
        const popular = SORT_OPTIONS.find((o) => o.key === "popular");
        expect(popular?.field).toBe("views");
        expect(popular?.direction).toBe("desc");
    });
});

describe("challengesViewState", () => {
    it("starts from a clean default state", () => {
        expect(challengesViewState).toMatchObject({
            searchQuery: "",
            activeKey: "all",
            activeSortKey: null,
            showFavoritesOnly: false,
            hideSolved: false,
        });
    });
});
