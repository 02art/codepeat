import type {QuickFilter, SortOption} from "./challenges.types.js";

/** Client-side quick filters. Every predicate is backed by a real challenge field. */
export const QUICK_FILTERS: QuickFilter[] = [
    {key: "all",        label: "Alle Challenges",     icon: "list",   predicate: {kind: "all"}},
    {key: "codepeat",   label: "CodePeat",            icon: "logo",   predicate: {kind: "official"}},
    {key: "own",        label: "Eigene",              icon: "folder", predicate: {kind: "own"}},
    {key: "new",        label: "Neu",                 icon: "clock",  predicate: {kind: "new"}},
    {key: "easy",       label: "Einfach",             icon: "bug",    predicate: {kind: "difficulty", value: "easy"}},
    {key: "medium",     label: "Mittel",              icon: "bug",    predicate: {kind: "difficulty", value: "medium"}},
    {key: "hard",       label: "Schwer",              icon: "bug",    predicate: {kind: "difficulty", value: "hard"}},
    {key: "array",      label: "Array",               icon: "grid",   predicate: {kind: "category", value: "Array"}},
    {key: "string",     label: "String",              icon: "code",   predicate: {kind: "category", value: "String"}},
    {key: "hashing",    label: "Hashing",             icon: "list",   predicate: {kind: "category", value: "Hashing"}},
    {key: "twopointer", label: "Two Pointers",        icon: "code",   predicate: {kind: "category", value: "Two Pointers"}},
    {key: "dp",         label: "Dynamic Programming", icon: "grid",   predicate: {kind: "category", value: "Dynamic Programming"}},
    {key: "math",       label: "Math",                icon: "math",   predicate: {kind: "category", value: "Math"}},
    {key: "graph",      label: "Graph",               icon: "grid",   predicate: {kind: "category", value: "Graph"}},
    {key: "sorting",    label: "Sorting",             icon: "sort",   predicate: {kind: "category", value: "Sorting"}},
    {key: "search",     label: "Binary Search",       icon: "search", predicate: {kind: "category", value: "Binary Search"}},
    {key: "linkedlist", label: "Linked List",         icon: "list",   predicate: {kind: "category", value: "Linked List"}},
];

export const SORT_OPTIONS: SortOption[] = [
    {key: "popular",    label: "Beliebteste zuerst", field: "views",      direction: "desc"},
    {key: "newest",     label: "Neueste zuerst",     field: "createdAt",  direction: "desc"},
    {key: "difficulty", label: "Schwierigkeit",      field: "difficulty", direction: "asc"},
];

/**
 * Assignable topic tags, derived from the quick filters so the editor and the overview stay
 * in sync: every tag a teacher can set is also filterable in the catalogue.
 */
export const CHALLENGE_CATEGORIES: string[] = QUICK_FILTERS
    .map((filter) => filter.predicate)
    .filter((predicate): predicate is {kind: "category"; value: string} => predicate.kind === "category")
    .map((predicate) => predicate.value);
