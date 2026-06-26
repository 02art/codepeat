import type {ChallengeStatus, Difficulty} from "../../../services/challenges/challenges.types.js";

export type FilterIcon =
    | "list"
    | "folder"
    | "code"
    | "plus"
    | "bug"
    | "logo"
    | "fire"
    | "sort"
    | "grid"
    | "math";

/**
 * Describes how a quick filter narrows the challenge list. Kept as plain data
 * so filters can be served by the (mock) API instead of hardcoded in the UI.
 */
export type FilterPredicate =
    | {kind: "all"}
    | {kind: "own"}
    | {kind: "difficulty"; value: Difficulty}
    | {kind: "status"; value: ChallengeStatus}
    | {kind: "category"; value: string}
    | {kind: "flag"; value: "popular" | "new" | "assigned"};

export interface QuickFilter {
    key: string;
    label: string;
    icon: FilterIcon;
    predicate: FilterPredicate;
}

/** Challenge field a sort option orders by. */
export type SortField = "difficulty" | "createdAt" | "solvedCount";

export interface SortOption {
    key: string;
    label: string;
    field: SortField;
    direction: "asc" | "desc";
}
