export type Difficulty = "easy" | "medium" | "hard";

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    /** Whether the current user has bookmarked it (per-user). */
    favorited: boolean;
    /** Whether the current user has solved it, i.e. has an accepted submission (per-user). */
    solved: boolean;
    createdBy: string;
    /** Official CodePeat challenge (no individual creator on record). */
    official: boolean;
    /** Topic tags used by the overview quick filters. */
    categories: string[];
    isNew: boolean;
    /** ISO date (YYYY-MM-DD); drives "newest first" sorting. */
    createdAt: string;
    /** View count; drives "most popular first" sorting. */
    views: number;
}

/** Editable challenge data used by the challenge editor (raw, unsplit text fields). */
export interface ChallengeDraft {
    title: string;
    /** Task description, one requirement per line. */
    description: string;
    /** Constraints, one per line. */
    constraints: string;
    exampleLanguage: string;
    exampleInput: string;
    exampleOutput: string;
    difficulty: Difficulty;
    visibility: "public" | "private";
    /** When on, students only get XP after a lecturer accepts their submission. */
    requiresGrading: boolean;
    /** Assigned topic tags (e.g. "Array", "Graph"); also drive the overview filters. */
    categories: string[];
}

/** Worked example shown on the detail page. */
export interface ChallengeExample {
    language: string;
    input: string;
    output: string;
}

/** Author of a challenge, resolved for display on the detail page. */
export interface ChallengeCreator {
    displayName: string;
    avatarUrl: string | null;
    /** CodePeat in-house challenges are verified and shown with a badge. */
    verified: boolean;
}

/**
 * Full challenge from the detail endpoint: the list fields plus the heavy
 * content the overview does not need.
 */
export interface ChallengeDetail extends Challenge {
    views: number;
    /** Description and constraints split into bullet points (raw form lives on ChallengeDraft). */
    tasks: string[];
    constraints: string[];
    example: ChallengeExample | null;
    creator: ChallengeCreator;
}
