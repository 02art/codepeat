import type {Difficulty} from "../../../services/challenges/challenges.types.js";

export type FilterIcon =
    | "list"
    | "folder"
    | "code"
    | "plus"
    | "bug"
    | "logo"
    | "sort"
    | "grid"
    | "math"
    | "clock"
    | "search";

/** Describes how a quick filter narrows the challenge list. Kept as plain data. */
export type FilterPredicate =
    | {kind: "all"}
    | {kind: "official"}
    | {kind: "own"}
    | {kind: "new"}
    | {kind: "difficulty"; value: Difficulty}
    | {kind: "category"; value: string};

export interface QuickFilter {
    key: string;
    label: string;
    icon: FilterIcon;
    predicate: FilterPredicate;
}

/** Challenge field a sort option orders by. */
export type SortField = "difficulty" | "createdAt" | "views";

export interface SortOption {
    key: string;
    label: string;
    field: SortField;
    direction: "asc" | "desc";
}
