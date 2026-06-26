import type {QuickFilter, SortOption} from "./challenges.types.js";

/** Client-side UI config: predicates drive local filtering, so they are not fetched. */

export const QUICK_FILTERS: QuickFilter[] = [
    {key: "all",      label: "Alle Challenges",     icon: "list",   predicate: {kind: "all"}},
    {key: "own",      label: "Eigene Challenges",   icon: "folder", predicate: {kind: "own"}},
    {key: "assigned", label: "Mir zugewiesen",      icon: "code",   predicate: {kind: "flag",       value: "assigned"}},
    {key: "new",      label: "Neue Challenges",     icon: "plus",   predicate: {kind: "flag",       value: "new"}},
    {key: "easy",     label: "Easy",                icon: "bug",    predicate: {kind: "difficulty", value: "easy"}},
    {key: "medium",   label: "Medium",              icon: "bug",    predicate: {kind: "difficulty", value: "medium"}},
    {key: "hard",     label: "Schwer",              icon: "bug",    predicate: {kind: "difficulty", value: "hard"}},
    {key: "codepeat", label: "CodePeat",            icon: "logo",   predicate: {kind: "category",   value: "CodePeat"}},
    {key: "popular",  label: "Beliebte Challenges", icon: "fire",   predicate: {kind: "flag",       value: "popular"}},
    {key: "sorting",  label: "Sorting",             icon: "sort",   predicate: {kind: "category",   value: "Sorting"}},
    {key: "dp",       label: "Dynamic Programming", icon: "grid",   predicate: {kind: "category",   value: "Dynamic Programming"}},
    {key: "math",     label: "Math",                icon: "math",   predicate: {kind: "category",   value: "Math"}},
];

export const SORT_OPTIONS: SortOption[] = [
    {key: "popular",    label: "Beliebteste zuerst", field: "solvedCount", direction: "desc"},
    {key: "newest",     label: "Neueste zuerst",     field: "createdAt",   direction: "desc"},
    {key: "difficulty", label: "Schwierigkeit",      field: "difficulty",  direction: "asc"},
];
