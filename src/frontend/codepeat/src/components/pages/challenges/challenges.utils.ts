import type {Challenge, Difficulty} from "../../../services/challenges/challenges.types.js";
import type {FilterPredicate, SortOption} from "./challenges.types.js";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
    easy:   "Einfach",
    medium: "Medium",
    hard:   "Schwer",
};

/** Ordering rank for difficulty, easy (lowest) to hard (highest). */
const DIFFICULTY_RANK: Record<Difficulty, number> = {
    easy:   0,
    medium: 1,
    hard:   2,
};

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
    easy:   "text-success",
    medium: "text-warning",
    hard:   "text-error",
};

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
    easy:   "bg-success/15 text-success",
    medium: "bg-warning/20 text-warning-content",
    hard:   "bg-error/15 text-error",
};

export function difficultyLabel(difficulty: Difficulty): string {
    return DIFFICULTY_LABEL[difficulty];
}

export function difficultyClass(difficulty: Difficulty): string {
    return DIFFICULTY_CLASS[difficulty];
}

/** Tailwind classes for the filled difficulty pill on the detail page. */
export function difficultyBadgeClass(difficulty: Difficulty): string {
    return DIFFICULTY_BADGE_CLASS[difficulty];
}

/** Whether a single challenge satisfies the given quick-filter predicate. */
function matchesPredicate(
    challenge: Challenge,
    predicate: FilterPredicate,
    currentUserId: string | null,
): boolean {
    switch (predicate.kind) {
        case "all":        return true;
        case "own":        return challenge.createdBy === currentUserId;
        case "official":   return challenge.official;
        case "new":        return challenge.isNew;
        case "difficulty": return challenge.difficulty === predicate.value;
        case "category":   return challenge.categories.includes(predicate.value);
    }
}

/**
 * Filter challenges by the active quick-filter predicate and a search query.
 * `currentUserId` is needed to resolve the "own" predicate (challenges I created).
 */
export function filterChallenges(
    challenges: Challenge[],
    query: string,
    predicate: FilterPredicate,
    currentUserId: string | null,
): Challenge[] {
    let filtered = challenges.filter((c) => matchesPredicate(c, predicate, currentUserId));

    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length > 0) {
        filtered = filtered.filter((c) =>
            c.title.toLowerCase().includes(normalizedQuery)
            || c.description.toLowerCase().includes(normalizedQuery)
            || c.categories.some((category) => category.toLowerCase().includes(normalizedQuery))
        );
    }

    return filtered;
}

/**
 * Return a new array of challenges ordered by the given sort option.
 * Passing `null` keeps the original (API) order.
 */
export function sortChallenges(
    challenges: Challenge[],
    sort: SortOption | null,
): Challenge[] {
    if (sort === null) {
        return challenges;
    }

    const sorted = [...challenges];

    sorted.sort((a, b) => {
        let comparison: number;

        switch (sort.field) {
            case "difficulty":
                comparison = DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty];
                break;
            case "createdAt":
                comparison = a.createdAt.localeCompare(b.createdAt);
                break;
            case "views":
                comparison = a.views - b.views;
                break;
        }

        return sort.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
}

/**
 * Count how many challenges the current user has solved.
 */
export function completedCount(challenges: Challenge[]): number {
    return challenges.filter((c) => c.solved).length;
}
