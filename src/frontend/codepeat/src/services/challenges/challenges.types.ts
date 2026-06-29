export type Difficulty = "easy" | "medium" | "hard";

export type ChallengeStatus = "locked" | "open";

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: Difficulty;
    /** Global availability of the challenge (same for everyone). */
    status: ChallengeStatus;
    favorited: boolean;
    /** Whether the *current* user has solved it — per-user, set by the service. */
    solved: boolean;
    createdBy: string;
    categories: string[];
    popular: boolean;
    isNew: boolean;
    assigned: boolean;
    /** ISO date (YYYY-MM-DD); drives "newest first" sorting. */
    createdAt: string;
    solvedCount: number;
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
